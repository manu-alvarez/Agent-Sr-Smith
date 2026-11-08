import { useEffect, useMemo, useState } from "react";
import { Boxes, Download, FileJson, GitBranch, Play, ScrollText, Shield, Users } from "lucide-react";
import { buildMissionPackage } from "../../lib/mission-package";
import { MatrixRain } from "./matrix-rain";
import { AgentBuilder } from "./agent-builder";
import { OllamaBar, storedOllamaHost } from "./ollama-bar";
import { OLLAMA_SYSTEM, ollamaChat } from "../../lib/ollama";
import { FRAMEWORKS, IDES, MOBILE_APPS, projectSlug, type FrameworkId, type IdeId, type MobileId } from "../../lib/project-starter";
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
    id: "checkpoint",
    label: "Checkpoint",
    profile: "engineering",
    objective: "Implement a durable checkpoint store with checksum verification and resume.",
  },
  {
    id: "threat",
    label: "Amenazas",
    profile: "security",
    objective: "Audit tool permissions and produce a threat model for prompt injection and external delete.",
  },
  {
    id: "research",
    label: "Corpus",
    profile: "research",
    objective: "Research the local policy boundaries, sandbox contract and capability registry.",
  },
  {
    id: "full",
    label: "Plataforma",
    profile: "full",
    objective: "Design the local agent platform: architecture, sandbox change, tests, review and documentation.",
  },
];

const NAV: Array<{ id: View; label: string; icon: typeof Play }> = [
  { id: "scaffold", label: "Scaffolding", icon: Download },
  { id: "mission", label: "Misión", icon: Play },
  { id: "graph", label: "Grafo", icon: GitBranch },
  { id: "agents", label: "Roles", icon: Users },
  { id: "policy", label: "Política", icon: Shield },
  { id: "contracts", label: "Contratos", icon: FileJson },
  { id: "architecture", label: "Módulos", icon: Boxes },
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
  const [ides, setIdes] = useState<IdeId[]>(["opencode"]);
  const [mobile, setMobile] = useState<MobileId[]>([]);
  const [view, setView] = useState<View>("mission");
  const [details, setDetails] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [ollamaHost, setOllamaHost] = useState(storedOllamaHost);
  const [ollamaModel, setOllamaModel] = useState("");
  const [expertNote, setExpertNote] = useState<string | null>(null);
  const [modelNote, setModelNote] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<ProfileId>("engineering");
  const [objective, setObjective] = useState(PRESETS[0]?.objective ?? "");
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packaging, setPackaging] = useState(false);
  const [packageNote, setPackageNote] = useState<string | null>(null);
  const profile = PROFILES.find((item) => item.id === profileId) ?? PROFILES[0];
  const rules = useMemo(() => explainPolicy(), []);
  const slug = projectSlug(projectName);
  const ready = projectName.trim().length > 0 && objective.trim().length > 0;
  const step: 1 | 2 | 3 = report ? 3 : 1;

  function goToStep(next: 1 | 2 | 3) {
    if (next === 2) {
      execute();
      document.getElementById("descarga")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById(next === 1 ? "elige" : "descarga")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (next === 1) document.getElementById("project-name")?.focus();
  }

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
    <main className="relative min-h-screen max-w-full overflow-x-hidden text-fg">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <img src={publicUrl("/sr-smith.jpg")} alt="" className="h-full w-full object-cover object-[center_18%]" />
        <div className="absolute inset-0 bg-[#070b09]/82" />
      </div>
      <MatrixRain className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <div className="relative z-10">
      <section className="relative min-h-[46vh] overflow-hidden border-b border-line">
        <img
          src={publicUrl("/sr-smith.jpg")}
          alt="Retrato de Sr.Smith, con código verde sobre el rostro."
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
        />
        <MatrixRain className="absolute inset-0 h-full w-full" fontSize={18} />
        <div className="matrix-scan absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b09] via-[#070b09]/45 to-[#070b09]/10" />
        <div className="relative mx-auto flex min-h-[46vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-16 sm:px-6">
          <p className="matrix-title font-mono text-xs tracking-widest text-signal">SR.SMITH · 1.0</p>
          <h1 className="matrix-title mt-2 max-w-xl text-4xl font-semibold tracking-tight text-signal sm:text-5xl">Crea tu proyecto y llévatelo</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#ebe6d6]/90">
            Elige qué construir, prepara el paquete y descárgalo. El ZIP trae el código, las pruebas y los archivos para abrirlo donde trabajas.
          </p>
        </div>
        <div className="matrix-line absolute inset-x-0 bottom-0" />
      </section>
      <header className="sticky top-0 z-10 border-b border-line bg-[#121614]/80 backdrop-blur-md">
        <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs tracking-widest text-signal">SR.SMITH</p>
            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
              <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                aria-pressed={agentOpen}
                onClick={() => {
                  setAgentOpen((open) => !open);
                  setDetails(false);
                  setView("mission");
                }}
                className={
                  "inline-flex h-11 items-center rounded-full border px-4 text-sm " +
                  (agentOpen ? "border-signal bg-signal text-ink" : "border-line bg-surface text-fg")
                }
              >
                {agentOpen ? "Volver al proyecto" : "Crear agente"}
              </button>
              <button
                type="button"
                aria-pressed={details}
                onClick={() => {
                  setAgentOpen(false);
                  setDetails((open) => !open);
                  setView("mission");
                }}
                className={
                  "inline-flex h-11 items-center rounded-full border px-4 text-sm " +
                  (details ? "border-signal bg-signal text-ink" : "border-line bg-surface text-fg")
                }
              >
                {details ? "Volver a tu proyecto" : "Ver cómo decide"}
              </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgentOpen(false);
                  setDetails(true);
                  setView("scaffold");
                }}
                className="text-left font-mono text-xs text-muted underline-offset-2 hover:underline"
              >
                Plano base, sin tu proyecto
              </button>
            </div>
          </div>
          {!agentOpen && (
          <ol className="grid grid-cols-3 gap-2" aria-label="Camino">
            {(
              [
                [1, "Elige", "El formulario"],
                [2, "Prepara", "Crea el paquete"],
                [3, "Descarga", "El ZIP"],
              ] as const
            ).map(([number, label, hint]) => (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => goToStep(number)}
                  className={
                    "h-auto w-full rounded-panel border px-3 py-2 text-left text-sm " +
                    (step === number ? "border-signal bg-signal text-ink" : "border-line bg-surface text-fg")
                  }
                >
                  <span className="font-mono text-xs">{number}</span> {label}
                  <span className={"mt-1 block text-xs " + (step === number ? "text-ink/80" : "text-muted")}>{hint}</span>
                </button>
              </li>
            ))}
          </ol>
          )}
          {details && (
          <nav className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Cómo decide">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm " +
                    (active ? "border-signal bg-signal text-ink" : "border-line bg-surface text-fg hover:bg-surface-2")
                  }
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          )}
        </div>
      </header>

      <div className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6">
        <OllamaBar host={ollamaHost} model={ollamaModel} onHost={setOllamaHost} onModel={setOllamaModel} />
        {modelNote && <p className="mt-3 text-sm text-muted">{modelNote}</p>}
        <div className="mt-4">
        {agentOpen ? (
          <AgentBuilder host={ollamaHost} model={ollamaModel} />
        ) : (
          <>
        {details && view === "scaffold" && <Scaffold />}
        {(!details || view === "mission") && (
          <section className="grid min-w-0 gap-4 lg:grid-cols-5">
            <div id="elige" className="flex min-w-0 scroll-mt-28 flex-col gap-4 lg:col-span-2">
              <div className="rounded-panel border border-line bg-surface p-4">
                <label htmlFor="project-name" className="text-xs font-medium tracking-wide text-muted">
                  NOMBRE
                </label>
                <input
                  id="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="mt-3 h-11 w-full rounded-panel border border-line bg-bg px-3 text-sm text-fg outline-none focus:border-signal"
                />
                <p className="mt-2 font-mono text-xs text-muted">proyectos/{slug}</p>
                <p className="mt-3 text-xs font-medium tracking-wide text-muted">QUÉ VAS A CONSTRUIR</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Es el primer código de tu carpeta, no el plano de control. Elige una sola forma.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {FRAMEWORKS.map((item) => {
                    const active = item.id === framework;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFramework(item.id)}
                        className={
                          "rounded-panel border px-3 py-3 text-left " +
                          (active ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
                        }
                      >
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className={"mt-1 block text-sm leading-relaxed " + (active ? "text-ink/85" : "text-muted")}>
                          {item.fits}
                        </span>
                        <span className={"mt-2 block text-xs leading-relaxed " + (active ? "text-ink/75" : "text-fg")}>
                          {item.result}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs font-medium tracking-wide text-muted">ENTORNO</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">OpenCode viene elegido. Puedes añadir Claude Code, Codex, Cursor o VS Code.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {IDES.map((item) => {
                    const active = ides.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setIdes((current) => {
                            if (current.includes(item.id)) {
                              return current.length === 1 ? current : current.filter((id) => id !== item.id);
                            }
                            return [...current, item.id];
                          })
                        }
                        className={
                          "h-11 rounded-full border px-3 text-sm " +
                          (active ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <ul className="mt-3 flex flex-col gap-1 text-sm leading-relaxed text-muted">
                  {IDES.filter((item) => ides.includes(item.id)).map((item) => (
                    <li key={item.id}>{item.summary}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs font-medium tracking-wide text-muted">MÓVIL</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Estas apps no abren la carpeta ni ejecutan npm. Cada botón genera el archivo que esa app sí puede pegar o adjuntar.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MOBILE_APPS.map((item) => {
                    const active = mobile.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setMobile((current) =>
                            current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
                          )
                        }
                        className={
                          "h-11 rounded-full border px-3 text-sm " +
                          (active ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <ul className="mt-3 flex flex-col gap-1 text-sm leading-relaxed text-muted">
                  {MOBILE_APPS.filter((item) => mobile.includes(item.id)).map((item) => (
                    <li key={item.id}>
                      {item.file}. {item.summary}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-panel border border-line bg-surface p-4">
                <p className="text-xs font-medium tracking-wide text-muted">PERFIL</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROFILES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProfileId(item.id)}
                      className={
                        "h-11 rounded-full border px-3 text-sm " +
                        (item.id === profileId ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
                      }
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{profile?.summary}</p>
              </div>
              <div className="rounded-panel border border-line bg-surface p-4">
                <label htmlFor="objective" className="text-xs font-medium tracking-wide text-muted">
                  OBJETIVO
                </label>
                <textarea
                  id="objective"
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  rows={6}
                  className="mt-3 w-full resize-y rounded-panel border border-line bg-bg p-3 text-sm leading-relaxed text-fg outline-none focus:border-signal"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESETS.map((preset) => {
                    const active = preset.objective === objective && preset.profile === profileId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setObjective(preset.objective);
                          setProfileId(preset.profile);
                        }}
                        className={
                          "h-11 rounded-full border px-3 text-sm " +
                          (active ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
                        }
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => execute()}
                  disabled={!ready}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-panel bg-signal px-4 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  <Play className="size-4" aria-hidden="true" />
                  Preparar mi proyecto
                </button>
                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
              </div>
            </div>
            <div id="descarga" className="flex min-w-0 scroll-mt-28 flex-col gap-4 lg:col-span-3">
              <MissionDownload report={report} packaging={packaging} note={packageNote} onDownload={async () => {
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
                      ide: ides,
                      mobile,
                      expertNote: expertNote ?? undefined,
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
              <StartGuide slug={slug} framework={framework} ide={ides} mobile={mobile} />
              {details && (
                <>
                  <ReportSummary report={report} />
                  <Timeline report={report} />
                  <Sandbox report={report} />
                </>
              )}
            </div>
          </section>
        )}
        {details && view === "graph" && <Graph report={report} onRun={() => execute()} />}
        {details && view === "agents" && <Agents profileRoles={profile?.roles ?? []} />}
        {details && view === "policy" && <Policy rules={rules} />}
        {details && view === "contracts" && <Contracts />}
        {details && view === "architecture" && <Architecture />}
          </>
        )}
        </div>
      </div>
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
}: {
  slug: string;
  framework: FrameworkId;
  ide: IdeId[];
  mobile: MobileId[];
}) {
  const frameworkLabel = FRAMEWORKS.find((item) => item.id === framework)?.label ?? framework;
  const ideLabel = IDES.filter((item) => ide.includes(item.id))
    .map((item) => item.label)
    .join(", ");
  const phones = MOBILE_APPS.filter((item) => mobile.includes(item.id));
  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="font-mono text-xs tracking-widest text-signal">ASÍ SE EMPIEZA</p>
      <ol className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
        <li>
          <span className="text-muted">Entorno · {ideLabel}.</span> Abre <span className="font-mono">proyectos/{slug}</span>.
        </li>
        <li>
          <span className="text-muted">Framework · {frameworkLabel}.</span>{" "}
          <span className="font-mono">npm install && npm test && npm start</span>
        </li>
        {phones.map((item) => (
          <li key={item.id}>
            <span className="text-muted">{item.label}.</span> {item.summary}{" "}
            <span className="font-mono">
              proyectos/{slug}/{item.file}
            </span>
          </li>
        ))}
        <li>
          <span className="text-muted">CLI.</span> En la raíz <span className="font-mono">sr-smith/</span>:{" "}
          <span className="font-mono">npm test</span> y <span className="font-mono">src/cli/index.ts doctor</span>
        </li>
      </ol>
    </section>
  );
}

function MissionDownload({
  report,
  packaging,
  note,
  onDownload,
}: {
  report: ExecutionReport | null;
  packaging: boolean;
  note: string | null;
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
        Incluye el código, las pruebas y EMPEZAR.md. Si elegiste una app móvil, su archivo va en proyectos/…/movil/. El teléfono no ejecuta el proyecto: ese archivo es lo que se pega o se adjunta.
      </p>
      <button
        type="button"
        onClick={onDownload}
        disabled={packaging}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-panel bg-signal px-4 text-sm font-semibold text-ink disabled:opacity-60"
      >
        <Download className="size-4" aria-hidden="true" />
        {packaging ? "Empaquetando…" : "Descargar mi proyecto"}
      </button>
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
