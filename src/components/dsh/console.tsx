import { useEffect, useMemo, useState } from "react";
import { Boxes, Download, FileJson, GitBranch, Play, ScrollText, Shield, Users } from "lucide-react";
import { buildMissionPackage } from "../../lib/mission-package";
import { MatrixRain } from "./matrix-rain";
import { AgentBuilder } from "./agent-builder";
import { OllamaBar, storedOllamaHost } from "./ollama-bar";
import { OLLAMA_SYSTEM, ollamaChat } from "../../lib/ollama";
import { FRAMEWORKS, IDE_GROUPS, IDES, MOBILE_APPS, projectSlug, starterFiles, type FrameworkId, type IdeId, type MobileId } from "../../lib/project-starter";
import { publicUrl } from "../../lib/public-url";
import {
  CONTRACTS,
  MODULES,
  PHASE_ORDER,
  PROFILES,
  ROLES,
  explainPolicy,
  runObjective,
  type ExecutionReport,
  type ProfileId,
  type Task,
} from "../../../dsh-superagent-xlevel/src/public.ts";

type View = "mission" | "scaffold" | "graph" | "agents" | "policy" | "contracts" | "architecture";

const SCAFFOLD_HREF = publicUrl("/sr-smith-c57fdd3.zip");

const PRESETS: Array<{ id: string; label: string; profile: ProfileId; objective: string }> = [
  {
    id: "app",
    label: "Una aplicación",
    profile: "engineering",
    objective: "Quiero una aplicación para anotar gastos. El usuario escribe fecha, concepto e importe, y al volver a abrirla sigue viendo la lista. Está hecha cuando puedo añadir uno y verlo después de recargar.",
  },
  {
    id: "command",
    label: "Un comando",
    profile: "headless",
    objective: "Quiero un comando de terminal que reciba una carpeta y diga cuántos archivos hay y cuánto ocupan. Está hecho cuando npm test cubre una carpeta vacía y otra con dos archivos.",
  },
  {
    id: "api",
    label: "Un servicio",
    profile: "engineering",
    objective: "Quiero un servicio local con dos rutas: una para crear una nota y otra para listarlas. Está hecho cuando una llamada crea la nota y la siguiente la devuelve.",
  },
  {
    id: "research",
    label: "Entender un tema",
    profile: "research",
    objective: "Necesito entender cómo funciona el inicio de sesión de este proyecto antes de tocarlo. Quiero las preguntas abiertas, de dónde sale cada respuesta y qué decisión puedo tomar con eso.",
  },
  {
    id: "fix",
    label: "Arreglar un fallo",
    profile: "engineering",
    objective: "Al guardar, la lista se vacía. Esperaba ver lo que acabo de escribir. Se reproduce recargando la página. Está arreglado cuando recargar conserva la lista y hay una prueba que lo demuestra.",
  },
  {
    id: "risk",
    label: "Revisar riesgos",
    profile: "security",
    objective: "Revisa quién puede leer y borrar estos datos, qué pasa si alguien pega una instrucción dentro de un campo y qué no debe poder ocurrir nunca.",
  },
];

const PROFILE_FACE: Record<string, { title: string; when: string }> = {
  research: { title: "Investigar", when: "Primero hay que entender el tema. Busca y cita. No escribe el programa." },
  engineering: { title: "Construir", when: "Hay que diseñar, programar, probar y revisar el resultado." },
  autonomous: { title: "Seguir hasta el final", when: "La tarea es larga. Guarda el avance y retoma si se corta." },
  security: { title: "Revisar riesgos", when: "Quién puede hacer qué, qué datos se tocan y qué no debe ocurrir." },
  full: { title: "Equipo completo", when: "No quieres dejar ningún rol fuera." },
  headless: { title: "Solo la terminal", when: "Un comando, sin pantalla." },
  product: { title: "Definir el producto", when: "Todavía se decide qué se construye, para quién y qué queda fuera." },
  data: { title: "Datos", when: "Hay tablas, archivos o documentos que hay que ordenar y comprobar." },
  ops: { title: "Dejarlo funcionando", when: "Hay que automatizar, vigilar y recuperar el proceso en tu máquina." },
};

const NAV: Array<{ id: View; label: string; icon: typeof Play }> = [
  { id: "scaffold", label: "Carpeta base", icon: Download },
  { id: "mission", label: "Tu proyecto", icon: Play },
  { id: "graph", label: "Pasos", icon: GitBranch },
  { id: "agents", label: "Quién hace qué", icon: Users },
  { id: "policy", label: "Reglas", icon: Shield },
  { id: "contracts", label: "Acuerdos", icon: FileJson },
  { id: "architecture", label: "Piezas", icon: Boxes },
];

function depths(tasks: Task[]): Record<string, number> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const memo = new Map<string, number>();
  const depth = (id: string, trail: string[]): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (trail.includes(id)) return 0;
    const task = byId.get(id);
    if (!task || task.dependencies.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const value = 1 + Math.max(...task.dependencies.map((dependency) => depth(dependency, [...trail, id])));
    memo.set(id, value);
    return value;
  };
  const result: Record<string, number> = {};
  for (const task of tasks) result[task.id] = depth(task.id, []);
  return result;
}

function statusClass(status: string): string {
  if (status === "completed" || status === "ok" || status === "implemented") return "text-signal";
  if (status === "blocked" || status === "warn" || status === "reference" || status === "contract") return "text-warn";
  if (status === "failed" || status === "error" || status === "planned") return "text-danger";
  return "text-muted";
}

export function Console() {
  const [projectName, setProjectName] = useState("mi-proyecto");
  const [framework, setFramework] = useState<FrameworkId>("cli");
  const [ides, setIdes] = useState<IdeId[]>(["opencode", "codex", "antigravity", "windsurf", "copilot", "cline", "trae"]);
  const [mobile, setMobile] = useState<MobileId[]>([]);
  const [surface, setSurface] = useState<"computer" | "mobile">("computer");
  const [view, setView] = useState<View>("mission");
  const [details, setDetails] = useState(false);
  const [ollamaHost, setOllamaHost] = useState(storedOllamaHost);
  const [ollamaModel, setOllamaModel] = useState("");
  const [expertNote, setExpertNote] = useState<string | null>(null);
  const [modelNote, setModelNote] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<ProfileId>("engineering");
  const [objective, setObjective] = useState("");
  const [scene, setScene] = useState<"where" | "shape" | "env" | "who" | "goal" | "download" | "agent">("where");
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packaging, setPackaging] = useState(false);
  const [packageNote, setPackageNote] = useState<string | null>(null);
  const profile = PROFILES.find((item) => item.id === profileId) ?? PROFILES[0];
  const rules = useMemo(() => explainPolicy(), []);
  const slug = projectSlug(projectName);
  const ready = projectName.trim().length > 0 && objective.trim().length > 0 && (surface === "computer" || mobile.length > 0);

  function goToStep(next: 1 | 2 | 3) {
    setDetails(false);
    if (next === 1) setScene("where");
    if (next === 2) setScene("goal");
    if (next === 3) setScene(report ? "download" : "goal");
  }

  const phase = scene === "download" ? 3 : scene === "who" || scene === "goal" ? 2 : 1;

  function execute(nextObjective = objective, nextProfile = profileId) {
    if (!nextObjective.trim() || !projectName.trim()) {
      setError("Hace falta un nombre y un objetivo. Si no, el proyecto del ZIP no puede probarse.");
      return;
    }
    try {
      setReport(runObjective({ objective: nextObjective, profileId: nextProfile, mode: "strict-local" }));
      setPackageNote(null);
      setExpertNote(null);
      setError(null);
      setView("mission");
      setScene("download");
      if (!ollamaModel) {
        setModelNote(null);
        return;
      }
      setModelNote(`Preguntando a ${ollamaModel}…`);
      ollamaChat(
        ollamaHost,
        ollamaModel,
        OLLAMA_SYSTEM,
        `Proyecto: ${projectName}\nObjetivo:\n${nextObjective}\n\nRedacta el documento de trabajo: alcance, archivos, contratos, pruebas y riesgos.`,
      )
        .then((text) => {
          setExpertNote(text);
          setModelNote(`${ollamaModel} ha redactado DESDE-OLLAMA.md. Saldrá en el ZIP.`);
        })
        .catch((caught: unknown) => {
          setModelNote(caught instanceof Error ? caught.message : "El modelo no respondió.");
        });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo ejecutar.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden text-fg">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <img src={publicUrl("/sr-smith.jpg")} alt="" className="h-full w-full object-cover object-[center_18%]" />
        <div className="absolute inset-0 bg-[#070b09]/48" />
        <MatrixRain className="absolute inset-0 h-full w-full" />
        <div className="matrix-scan absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b09_75%)]" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-8">
        <p className="matrix-title font-mono text-sm tracking-[0.35em] text-signal">SR.SMITH</p>
        {scene !== "agent" && (
          <ol className="mt-4 flex items-center gap-2" aria-label="Camino">
            {(
              [
                [1, "Elige"],
                [2, "Describe"],
                [3, "Descarga"],
              ] as const
            ).map(([number, label], index) => (
              <li key={number} className="flex items-center gap-2">
                {index > 0 && <span className="h-px w-6 bg-signal/50" />}
                <button
                  type="button"
                  onClick={() => goToStep(number)}
                  className={"font-mono text-xs tracking-wide " + (phase === number ? "text-signal" : "text-[#ebe6d6]/70")}
                >
                  {label}
                </button>
              </li>
            ))}
          </ol>
        )}
        <div key={scene} className="glass-card mt-5 max-h-[78vh] overflow-auto rounded-panel p-6 sm:p-8">
        {scene === "agent" ? (
          <AgentBuilder host={ollamaHost} model={ollamaModel} />
        ) : (
          <>
        {(!details || view === "mission") && (
          <div>
            {scene === "where" && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-fg">¿Dónde vas a usarlo?</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#ebe6d6]/80">En el ordenador se descarga una carpeta. En el móvil, un archivo para la app.</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {([
                    ["computer", "Ordenador", "Código, pruebas y el editor"],
                    ["mobile", "Móvil", "Un archivo para pegar o adjuntar"],
                  ] as const).map(([id, label, hint]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={surface === id}
                      onClick={() => setSurface(id)}
                      className={
                        "rounded-panel border px-3 py-5 text-left transition " +
                        (surface === id ? "border-signal bg-signal text-ink" : "border-line bg-black/30 text-fg hover:border-signal/60")
                      }
                    >
                      <span className="block text-lg font-medium">{label}</span>
                      <span className={"mt-1 block text-sm " + (surface === id ? "text-ink/80" : "text-muted")}>{hint}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setScene(surface === "mobile" ? "env" : "shape")} className="mt-6 h-12 w-full rounded-panel bg-signal text-sm font-semibold text-ink">
                  Continuar
                </button>
              </div>
            )}
            {scene === "shape" && surface === "computer" && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">¿Qué vas a construir?</h1>
                <div className="mt-6 flex flex-col gap-2">
                  {FRAMEWORKS.map((item) => {
                    const active = item.id === framework;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFramework(item.id)}
                        className={"rounded-panel border px-3 py-3 text-left " + (active ? "border-signal bg-signal text-ink" : "border-line bg-black/30 text-fg")}
                      >
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className={"mt-1 block text-sm leading-relaxed " + (active ? "text-ink/85" : "text-muted")}>{item.fits}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={() => setScene("where")} className="h-12 flex-1 rounded-panel border border-line text-sm">Atrás</button>
                  <button type="button" onClick={() => setScene("env")} className="h-12 flex-[2] rounded-panel bg-signal text-sm font-semibold text-ink">Continuar</button>
                </div>
              </div>
            )}
            {scene === "env" && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{surface === "mobile" ? "¿En qué app?" : "¿Con qué programa lo abres?"}</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#ebe6d6]/80">
                  {surface === "mobile" ? "Elige una o varias. Cada una descarga su archivo." : "Los que leen el mismo archivo van juntos."}
                </p>
                {surface === "computer" ? (
                  <div className="mt-6 flex flex-col gap-2">
                    {IDE_GROUPS.map((group) => {
                      const members = group.ides as readonly IdeId[];
                      const active = members.every((id) => ides.includes(id));
                      return (
                        <button
                          key={group.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setIdes((current) => {
                              const on = members.every((id) => current.includes(id));
                              const next = on ? current.filter((id) => !members.includes(id)) : [...new Set([...current, ...members])];
                              return next.length > 0 ? next : current;
                            })
                          }
                          className={"rounded-panel border px-3 py-3 text-left " + (active ? "border-signal bg-signal text-ink" : "border-line bg-black/30 text-fg")}
                        >
                          <span className="block text-sm font-medium">{group.label}</span>
                          <span className={"mt-1 block text-sm " + (active ? "text-ink/80" : "text-muted")}>{group.members}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-2">
                    {MOBILE_APPS.map((item) => {
                      const active = mobile.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setMobile((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}
                          className={"rounded-panel border px-3 py-3 text-left " + (active ? "border-signal bg-signal text-ink" : "border-line bg-black/30 text-fg")}
                        >
                          <span className="block text-sm font-medium">{item.label}</span>
                          <span className={"mt-1 block text-sm " + (active ? "text-ink/80" : "text-muted")}>{item.summary}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={() => setScene(surface === "mobile" ? "where" : "shape")} className="h-12 flex-1 rounded-panel border border-line text-sm">Atrás</button>
                  <button
                    type="button"
                    disabled={surface === "mobile" && mobile.length === 0}
                    onClick={() => setScene("who")}
                    className="h-12 flex-[2] rounded-panel bg-signal text-sm font-semibold text-ink disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            {scene === "who" && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">¿Quién lo hace?</h1>
                <div className="mt-6 flex flex-col gap-2">
                  {PROFILES.map((item) => {
                    const face = PROFILE_FACE[item.id];
                    const active = item.id === profileId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setProfileId(item.id)}
                        className={"rounded-panel border px-3 py-3 text-left " + (active ? "border-signal bg-signal text-ink" : "border-line bg-black/30 text-fg")}
                      >
                        <span className="block text-sm font-medium">{face?.title ?? item.name}</span>
                        <span className={"mt-1 block text-sm " + (active ? "text-ink/80" : "text-muted")}>{face?.when ?? item.summary}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={() => setScene("env")} className="h-12 flex-1 rounded-panel border border-line text-sm">Atrás</button>
                  <button type="button" onClick={() => setScene("goal")} className="h-12 flex-[2] rounded-panel bg-signal text-sm font-semibold text-ink">Continuar</button>
                </div>
              </div>
            )}
            {scene === "goal" && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">¿Qué quieres conseguir?</h1>
                <p className="mt-2 text-sm leading-relaxed text-[#ebe6d6]/80">El resultado, para quién es y cómo sabrás que está hecho.</p>
                <label htmlFor="project-name" className="mt-5 block text-xs tracking-wide text-muted">CÓMO SE LLAMA</label>
                <input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} className="mt-2 h-12 w-full rounded-panel border border-line bg-black/40 px-3 text-sm outline-none focus:border-signal" />
                <textarea
                  id="objective"
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  rows={5}
                  placeholder="Una lista de gastos. Está hecho cuando añado uno y sigue ahí al recargar."
                  className="mt-3 w-full resize-y rounded-panel border border-line bg-black/40 p-3 text-sm leading-relaxed outline-none placeholder:text-muted focus:border-signal"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setObjective(preset.objective);
                        setProfileId(preset.profile);
                      }}
                      className="h-10 rounded-full border border-line px-3 text-sm text-fg hover:border-signal"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={() => setScene("who")} className="h-12 flex-1 rounded-panel border border-line text-sm">Atrás</button>
                  <button type="button" onClick={() => execute()} disabled={!ready} className="h-12 flex-[2] rounded-panel bg-signal text-sm font-semibold text-ink disabled:opacity-50">
                    Preparar
                  </button>
                </div>
                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
              </div>
            )}
            {scene === "download" && (
              <div id="descarga">
                <h1 className="text-3xl font-semibold tracking-tight">Tu proyecto está listo</h1>
                {modelNote && <p className="mt-2 text-sm text-muted">{modelNote}</p>}
                <div className="mt-4">
                  <MissionDownload
                    report={report}
                    packaging={packaging}
                    note={packageNote}
                    surface={surface}
                    files={
                      surface === "mobile" && report
                        ? starterFiles({ name: projectName, objective, framework, ide: [], mobile, surface: "mobile" }).files
                        : undefined
                    }
                    onDownload={async () => {
                      if (!report || !profile) return;
                      setPackaging(true);
                      setPackageNote(null);
                      try {
                        const packed = await buildMissionPackage({
                          objective,
                          profileId,
                          profileName: profile.name,
                          roles: profile.roles,
                          report,
                          projectName,
                          framework,
                          ide: surface === "computer" ? ides : [],
                          mobile: surface === "mobile" ? mobile : [],
                          expertNote: expertNote ?? undefined,
                          surface,
                        });
                        const url = URL.createObjectURL(packed.blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = packed.filename;
                        link.click();
                        URL.revokeObjectURL(url);
                        setPackageNote(`${packed.filename} · ${packed.fileCount} archivos · ${packed.bytes} bytes`);
                      } catch (caught) {
                        setPackageNote(caught instanceof Error ? caught.message : "No se pudo empaquetar.");
                      } finally {
                        setPackaging(false);
                      }
                    }}
                  />
                </div>
                <div className="mt-4">
                  <StartGuide slug={slug} framework={framework} ide={ides} mobile={mobile} surface={surface} />
                </div>
                <button type="button" onClick={() => setScene("goal")} className="mt-4 text-sm text-muted underline-offset-2 hover:underline">
                  Cambiar el texto
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}
        </div>
        <div className="mt-5 flex flex-col gap-2 text-sm">
          {scene === "agent" ? (
            <button type="button" onClick={() => setScene("where")} className="text-left text-[#ebe6d6]/80 underline-offset-2 hover:underline">
              Volver al proyecto
            </button>
          ) : (
            <button type="button" onClick={() => { setDetails(false); setScene("agent"); }} className="text-left text-[#ebe6d6]/80 underline-offset-2 hover:underline">
              Quiero un agente, no un proyecto
            </button>
          )}
          {scene === "download" && (
            <button type="button" onClick={() => { setDetails(true); setView("graph"); }} className="text-left text-muted underline-offset-2 hover:underline">
              Ver el razonamiento. Muestra los pasos, las reglas y quién hizo cada parte.
            </button>
          )}
          <button type="button" onClick={() => { setDetails(true); setView("scaffold"); setScene("where"); }} className="text-left text-muted underline-offset-2 hover:underline">
            Descargar la carpeta base, sin este proyecto
          </button>
        </div>
        <div className="mt-4">
          <OllamaBar host={ollamaHost} model={ollamaModel} onHost={setOllamaHost} onModel={setOllamaModel} />
        </div>
        {details && scene !== "agent" && (
          <div className="mt-4 max-h-80 overflow-auto rounded-panel border border-line bg-black/50 p-3">
            <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Razonamiento">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setView(item.id)} className={"inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm " + (active ? "border-signal bg-signal text-ink" : "border-line text-fg")}>
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            {view === "scaffold" && <Scaffold />}
            {view === "graph" && <Graph report={report} onRun={() => execute()} />}
            {view === "agents" && <Agents profileRoles={profile?.roles ?? []} />}
            {view === "policy" && <Policy rules={rules} />}
            {view === "contracts" && <Contracts />}
            {view === "architecture" && <Architecture />}
            {view === "mission" && (
              <>
                <ReportSummary report={report} />
                <Timeline report={report} />
                <Sandbox report={report} />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Scaffold() {
  const [paths, setPaths] = useState<string[]>([]);
  const [sha, setSha] = useState("");
  useEffect(() => {
    let active = true;
    fetch(publicUrl("/scaffold-manifest.json"))
      .then((response) => response.json())
      .then((body: { paths?: string[]; sha256?: string }) => {
        if (!active) return;
        setPaths(body.paths ?? []);
        setSha(body.sha256 ?? "");
      })
      .catch(() => {
        if (active) setPaths([]);
      });
    return () => {
      active = false;
    };
  }, []);
  const grouped = useMemo(() => {
    const groups = new Map<string, number>();
    for (const path of paths) {
      const parts = path.split("/");
      const key = parts.length > 2 ? parts[1]! : "(raíz)";
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return [...groups.entries()].sort((a, b) => b[1] - a[1]);
  }, [paths]);

  return (
    <section className="rounded-panel border border-signal bg-surface p-4 sm:p-6">
      <p className="font-mono text-xs tracking-widest text-signal">SCAFFOLDING COMPLETO</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">334 archivos dentro de sr-smith/</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        333 archivos del repositorio más <span className="text-fg">MANIFEST.txt</span>, numerados del 001 al 333. El ZIP pesa
        238747 bytes. Si el descompresor dice 85, es otro archivo o no está entrando en las carpetas.
      </p>
      <a
        href={SCAFFOLD_HREF}
        download="sr-smith-c57fdd3.zip"
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-panel bg-signal px-5 text-sm font-semibold text-ink"
      >
        <Download className="size-4" aria-hidden="true" />
        Descargar sr-smith-c57fdd3.zip
      </a>
      <p className="mt-3 break-all font-mono text-xs text-muted">
        {SCAFFOLD_HREF}
        {sha ? ` · sha256 ${sha.slice(0, 16)}` : ""}
      </p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map(([name, count]) => (
          <li key={name} className="flex items-center justify-between rounded-panel border border-line bg-bg px-3 py-2 font-mono text-sm">
            <span>{name === "(raíz)" ? name : `${name}/`}</span>
            <span className="text-muted">{count}</span>
          </li>
        ))}
      </ul>
      <ol className="mt-4 max-h-80 overflow-auto rounded-panel border border-line bg-bg p-3 font-mono text-xs leading-6 text-muted">
        {paths.map((path) => (
          <li key={path}>{path}</li>
        ))}
      </ol>
    </section>
  );
}

function StartGuide({
  slug,
  framework,
  ide,
  mobile,
  surface,
}: {
  slug: string;
  framework: FrameworkId;
  ide: IdeId[];
  mobile: MobileId[];
  surface: "computer" | "mobile";
}) {
  const frameworkLabel = FRAMEWORKS.find((item) => item.id === framework)?.label ?? framework;
  const ideLabel = IDES.filter((item) => ide.includes(item.id))
    .map((item) => item.label)
    .join(", ");
  const ideFiles = IDE_GROUPS.filter((group) => (group.ides as readonly string[]).some((id) => ide.includes(id as IdeId)))
    .map((group) => `${group.label}: ${group.files}`)
    .join(". ");
  const phones = MOBILE_APPS.filter((item) => mobile.includes(item.id));
  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="font-mono text-xs tracking-widest text-signal">ASÍ SE EMPIEZA</p>
      <ol className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
        {surface === "mobile" ? (
          phones.map((item) => (
            <li key={item.id}>
              <span className="text-muted">{item.label}.</span> Descarga su archivo y ábrelo en la app. No hay npm.
            </li>
          ))
        ) : (
          <>
        <li>
          <span className="text-muted">1. Abre la carpeta.</span> Descomprime el ZIP y abre{" "}
          <span className="font-mono">proyectos/{slug}</span>
          {ideLabel ? ` con ${ideLabel}` : ""}.
        </li>
        <li>
          <span className="text-muted">2. El entorno lee sus archivos.</span> {ideFiles}
        </li>
        <li>
          <span className="text-muted">3. Comprueba que arranca.</span>{" "}
          <span className="font-mono">{frameworkLabel}</span>:{" "}
          <span className="font-mono">npm install && npm test && npm start</span>
        </li>
          </>
        )}
        <li>
          <span className="text-muted">Opcional.</span> El plano de control, en la raíz{" "}
          <span className="font-mono">sr-smith/</span>, no hace falta para empezar este proyecto.
        </li>
      </ol>
    </section>
  );
}

function MissionDownload({
  report,
  packaging,
  note,
  surface,
  files,
  onDownload,
}: {
  report: ExecutionReport | null;
  packaging: boolean;
  note: string | null;
  surface: "computer" | "mobile";
  files?: Record<string, string>;
  onDownload: () => void;
}) {
  if (!report) {
    return (
      <section className="rounded-panel border border-dashed border-line bg-surface p-4">
        <p className="font-mono text-xs tracking-widest text-signal">3 · DESCARGA</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Todavía no hay paquete. Elige el proyecto y pulsa Preparar mi proyecto. El botón de descarga aparece aquí.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-panel border border-signal bg-surface p-4">
      <p className="font-mono text-xs tracking-widest text-signal">3 · DESCARGA</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {surface === "mobile"
          ? "Cada botón descargará el archivo de la app, no un ZIP de ordenador."
          : "El ZIP trae el código, las pruebas, AGENTS.md, las skills y las comprobaciones."}
      </p>
      {surface === "mobile" ? (
        <div className="mt-4 flex flex-col gap-2">
          {Object.entries(files ?? {}).map(([path, content]) => (
            <button
              key={path}
              type="button"
              onClick={() => {
                const blob = new Blob([content], { type: path.endsWith(".json") ? "application/json" : "text/markdown" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = path;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex h-11 items-center justify-between rounded-panel border border-signal bg-bg px-4 text-sm text-fg"
            >
              <span>{path}</span>
              <Download className="size-4 text-signal" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
      <button
        type="button"
        onClick={onDownload}
        disabled={packaging}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-panel bg-signal px-4 text-sm font-semibold text-ink disabled:opacity-60"
      >
        <Download className="size-4" aria-hidden="true" />
        {packaging ? "Empaquetando…" : "Descargar scaffolding"}
      </button>
      )}
      {note && <p className="mt-3 break-all font-mono text-xs text-muted">{note}</p>}
    </section>
  );
}

function ReportSummary({ report }: { report: ExecutionReport | null }) {
  if (!report) {
    return (
      <section className="rounded-panel border border-line bg-surface p-4">
        <p className="text-xs font-medium tracking-wide text-muted">SIN PREPARAR</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          El detalle sale después de preparar el proyecto. No es un paso aparte: es la misma preparación.
        </p>
        <ol className="mt-4 flex flex-wrap gap-2">
          {PHASE_ORDER.map((phase) => (
            <li key={phase} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">
              {phase}
            </li>
          ))}
        </ol>
      </section>
    );
  }
  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted">INFORME</p>
        <p className={"font-mono text-sm " + statusClass(report.status)}>{report.status}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{report.verification.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted">fase</dt>
          <dd>{report.phase}</dd>
        </div>
        <div>
          <dt className="text-muted">tareas</dt>
          <dd>
            {report.tasks.filter((task) => task.status === "completed").length}/{report.tasks.length}
          </dd>
        </div>
        <div>
          <dt className="text-muted">pasos</dt>
          <dd>{report.usage.steps}</dd>
        </div>
        <div>
          <dt className="text-muted">modo</dt>
          <dd>{report.mode}</dd>
        </div>
      </dl>
    </section>
  );
}

function Timeline({ report }: { report: ExecutionReport | null }) {
  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted">
        <ScrollText className="size-4" aria-hidden="true" />
        LÍNEA DE TIEMPO
      </p>
      {report ? (
        <ol className="mt-3 flex flex-col gap-3">
          {report.timeline.map((entry) => (
            <li key={entry.id} className="border-l border-line pl-3">
              <p className={"font-mono text-xs " + statusClass(entry.level)}>{entry.phase}</p>
              <p className="text-sm">{entry.title}</p>
              <p className="text-sm text-muted">{entry.detail}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-muted">La línea de tiempo se llena con la ejecución, no con pasos ficticios.</p>
      )}
    </section>
  );
}

function Sandbox({ report }: { report: ExecutionReport | null }) {
  const changes = report?.changes ?? [];
  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted">SANDBOX</p>
      {changes.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Ningún archivo escrito todavía. La escritura solo ocurre bajo sandbox/.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {changes.map((change) => (
            <li key={change.path}>
              <p className="font-mono text-xs text-signal">{change.path}</p>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-panel bg-bg p-3 font-mono text-xs text-muted">
                {change.after}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Graph({ report, onRun }: { report: ExecutionReport | null; onRun: () => void }) {
  if (!report) {
    return (
      <section className="rounded-panel border border-line bg-surface p-4">
        <p className="text-sm text-muted">No hay grafo hasta que ejecutes un objetivo.</p>
        <button type="button" onClick={onRun} className="mt-4 inline-flex h-11 items-center rounded-panel bg-signal px-4 text-sm font-semibold text-ink">
          Ejecutar
        </button>
      </section>
    );
  }
  const levels = depths(report.tasks);
  return (
    <ol className="flex flex-col gap-2">
      {report.tasks.map((task) => (
        <li key={task.id} className="rounded-panel border border-line bg-surface p-4" style={{ marginLeft: `${(levels[task.id] ?? 0) * 16}px` }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{task.title}</p>
            <p className={"font-mono text-xs " + statusClass(task.status)}>{task.status}</p>
          </div>
          <p className="mt-1 text-sm text-muted">{task.description}</p>
          <p className="mt-2 font-mono text-xs text-muted">
            {task.assignedRole ?? "sin rol"} · {task.operation}
            {task.dependencies.length > 0 ? ` · depende de ${task.dependencies.length}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

function Agents({ profileRoles }: { profileRoles: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ROLES.map((role) => {
        const active = profileRoles.includes(role.role);
        return (
          <li key={role.role} className={"rounded-panel border p-4 " + (active ? "border-signal bg-surface" : "border-line bg-bg")}>
            <p className="text-sm font-medium">{role.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{role.mission}</p>
            <p className="mt-2 font-mono text-xs text-muted">
              {role.filesystem} · red {role.network ? "sí" : "no"} · {active ? "en el perfil" : "fuera del perfil"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Policy({ rules }: { rules: string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {rules.map((rule) => (
        <li key={rule} className="rounded-panel border border-line bg-surface px-4 py-3 font-mono text-sm">
          {rule}
        </li>
      ))}
    </ol>
  );
}

function Contracts() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {CONTRACTS.map((contract) => (
        <li key={contract.schemaPath} className="rounded-panel border border-line bg-surface p-4">
          <p className="text-sm font-medium">{contract.name}</p>
          <p className="mt-1 text-sm text-muted">{contract.description}</p>
          <p className="mt-2 font-mono text-xs text-muted">{contract.schemaPath}</p>
        </li>
      ))}
    </ul>
  );
}

function Architecture() {
  return (
    <ul className="flex flex-col gap-2">
      {MODULES.map((module) => (
        <li key={module.id} className="rounded-panel border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{module.name}</p>
            <p className={"font-mono text-xs " + statusClass(module.status)}>{module.status}</p>
          </div>
          <p className="mt-1 text-sm text-muted">{module.responsibility}</p>
          <p className="mt-2 text-sm">No debe: {module.mustNot}</p>
        </li>
      ))}
    </ul>
  );
}
