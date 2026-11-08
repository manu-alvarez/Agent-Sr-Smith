import { useMemo, useState, type ReactNode } from "react";
import { Copy } from "lucide-react";
import { CAPABILITIES, PHASE_ORDER, ROLES } from "../../../dsh-superagent-xlevel/src/public.ts";
import { strToU8, zipSync } from "fflate";
import { agentFiles, agentSystem, fullSelection, SKILLS, STRATEGIES, TOOLS, type AgentMode, type AgentSelection } from "../../lib/agent-export";
import { OLLAMA_SYSTEM, ollamaChat } from "../../lib/ollama";

export function AgentBuilder({ host, model }: { host: string; model: string }) {
  const [kind, setKind] = useState<"full" | "custom">("full");
  const [custom, setCustom] = useState<AgentSelection>(fullSelection);
  const [copied, setCopied] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const selection = kind === "full" ? fullSelection() : custom;
  const files = useMemo(() => agentFiles(selection, draft ?? undefined), [selection, draft]);
  const system = useMemo(() => agentSystem(selection), [selection]);

  async function copy(value: string, which: string) {
    await navigator.clipboard.writeText(value);
    setCopied(which);
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-5">
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
        <div className="rounded-panel border border-line bg-surface p-4">
          <p className="font-mono text-xs tracking-widest text-signal">CREAR AGENTE SR. SMITH</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Full usa todo lo que el motor tiene ahora. Personalizada elige entre esas mismas piezas. El código se pega en cualquier sitio.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={kind === "full"}
              onClick={() => setKind("full")}
              className={
                "rounded-panel border px-3 py-3 text-left text-sm " +
                (kind === "full" ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
              }
            >
              <span className="block font-medium">Full</span>
              <span className={"mt-1 block text-xs leading-relaxed " + (kind === "full" ? "text-ink/80" : "text-muted")}>
                {ROLES.length} roles, {STRATEGIES.length} instrucciones, {SKILLS.length} skills, {TOOLS.length} herramientas. Acceso total.
              </span>
            </button>
            <button
              type="button"
              aria-pressed={kind === "custom"}
              onClick={() => setKind("custom")}
              className={
                "rounded-panel border px-3 py-3 text-left text-sm " +
                (kind === "custom" ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
              }
            >
              <span className="block font-medium">Personalizada</span>
              <span className={"mt-1 block text-xs leading-relaxed " + (kind === "custom" ? "text-ink/80" : "text-muted")}>
                Quitas lo que este agente no debe tener.
              </span>
            </button>
          </div>
        </div>
        <fieldset disabled={kind === "full"} className="flex flex-col gap-4 disabled:opacity-60">
          <ChoiceGroup title="Instrucciones">
            {STRATEGIES.map((item) => (
              <Toggle
                key={item.id}
                label={item.name}
                pressed={selection.strategies.includes(item.id)}
                onClick={() => setCustom({ ...custom, strategies: toggle(custom.strategies, item.id) })}
              />
            ))}
          </ChoiceGroup>
          <ChoiceGroup title="Skills">
            {SKILLS.map((item) => (
              <Toggle
                key={item.id}
                label={item.name}
                pressed={selection.skills.includes(item.id)}
                onClick={() => setCustom({ ...custom, skills: toggle(custom.skills, item.id) })}
              />
            ))}
          </ChoiceGroup>
          <ChoiceGroup title="Roles">
            {ROLES.map((item) => (
              <Toggle
                key={item.role}
                label={item.name}
                pressed={selection.roles.includes(item.role)}
                onClick={() => setCustom({ ...custom, roles: toggle(custom.roles, item.role) })}
              />
            ))}
          </ChoiceGroup>
          <ChoiceGroup title="Herramientas">
            {TOOLS.map((item) => (
              <Toggle
                key={item.name}
                label={item.name}
                pressed={selection.tools.includes(item.name)}
                onClick={() => setCustom({ ...custom, tools: toggle(custom.tools, item.name) })}
              />
            ))}
          </ChoiceGroup>
          <ChoiceGroup title="Proveedores">
            {CAPABILITIES.map((item) => (
              <Toggle
                key={item.provider}
                label={item.provider}
                pressed={selection.providers.includes(item.provider)}
                onClick={() => setCustom({ ...custom, providers: toggle(custom.providers, item.provider) })}
              />
            ))}
          </ChoiceGroup>
          <div className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs font-medium tracking-wide text-muted">MODO</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["full-access", "Acceso total"],
                  ["local-runtime", "Red con permiso"],
                  ["strict-local", "Sin red"],
                ] as const
              ).map(([mode, label]) => (
                <Toggle
                  key={mode}
                  label={label}
                  pressed={selection.mode === mode}
                  onClick={() => setCustom({ ...custom, mode })}
                />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Acceso total usa ficheros, terminal, git, red, navegador y APIs sin preguntar en cada paso. No guarda claves ni borra fuera del proyecto. Los otros dos modos sí preguntan o cortan la red.
            </p>
          </div>
          <div className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs font-medium tracking-wide text-muted">PRESUPUESTO</p>
            <div className="mt-3 grid gap-3">
              <Limit
                label={`Pasos, hasta 100000`}
                value={selection.limits.maxSteps}
                max={100_000}
                onChange={(maxSteps) => setCustom({ ...custom, limits: { ...custom.limits, maxSteps } })}
              />
              <Limit
                label="En paralelo, hasta 64"
                value={selection.limits.maxParallel}
                max={64}
                onChange={(maxParallel) => setCustom({ ...custom, limits: { ...custom.limits, maxParallel } })}
              />
              <Limit
                label="Tiempo en ms, hasta 3600000"
                value={selection.limits.timeoutMs}
                max={3_600_000}
                onChange={(timeoutMs) => setCustom({ ...custom, limits: { ...custom.limits, timeoutMs } })}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">Fases fijas: {PHASE_ORDER.join(" → ")}.</p>
          </div>
        </fieldset>
      </div>
      <div className="min-w-0 lg:col-span-3">
        <div className="rounded-panel border border-signal bg-surface p-4">
          <p className="font-mono text-xs tracking-widest text-signal">CÓDIGO DEL AGENTE</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Cada archivo se copia solo. El ZIP los lleva juntos. El modelo por defecto es ollama/gemma4:latest.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const entries: Record<string, Uint8Array> = {};
                for (const [path, content] of Object.entries(files)) entries[path] = strToU8(content);
                const bytes = zipSync(entries);
                const copy = new Uint8Array(bytes.byteLength);
                copy.set(bytes);
                const url = URL.createObjectURL(new Blob([copy], { type: "application/zip" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = "sr-smith-agente.zip";
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-panel bg-signal px-4 text-sm font-semibold text-ink"
            >
              <Copy className="size-4" aria-hidden="true" />
              Descargar agente
            </button>
            <button
              type="button"
              disabled={!model || drafting}
              onClick={() => {
                setDrafting(true);
                setDraftError(null);
                ollamaChat(host, model, OLLAMA_SYSTEM, `Amplía esta ficha a una instrucción de sistema completa, con archivos y criterios de aceptación.\n\n${system}`)
                  .then((text) => setDraft(text))
                  .catch((caught: unknown) => setDraftError(caught instanceof Error ? caught.message : "El modelo no respondió."))
                  .finally(() => setDrafting(false));
              }}
              className="inline-flex h-11 items-center gap-2 rounded-panel border border-signal px-4 text-sm text-signal disabled:opacity-60"
            >
              {drafting ? "Redactando…" : model ? `Redactar con ${model}` : "Carga un modelo"}
            </button>
          </div>
          {draftError && <p className="mt-3 text-sm text-danger">{draftError}</p>}
          <ul className="mt-4 flex max-h-[36rem] flex-col gap-2 overflow-auto">
            {Object.keys(files)
              .sort()
              .map((path) => (
                <li key={path} className="rounded-panel border border-line bg-bg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-fg">{path}</span>
                    <button
                      type="button"
                      onClick={() => copy(files[path] ?? "", path)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-3 text-xs text-fg"
                    >
                      {copied === path ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ChoiceGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Toggle({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        "h-11 rounded-full border px-3 text-sm " + (pressed ? "border-signal bg-signal text-ink" : "border-line bg-bg text-fg")
      }
    >
      {label}
    </button>
  );
}

function Limit({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-11 w-full rounded-panel border border-line bg-bg px-3 font-mono text-sm text-fg outline-none focus:border-signal"
      />
    </label>
  );
}
