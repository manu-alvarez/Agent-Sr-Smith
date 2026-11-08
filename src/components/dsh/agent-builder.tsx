import { useMemo, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { CAPABILITIES, NATIVE_TOOLS, PHASE_ORDER, ROLES } from "../../../dsh-superagent-xlevel/src/public.ts";
import { AGENT_LIMITS, agentCode, agentSystem, fullSelection, type AgentMode, type AgentSelection } from "../../lib/agent-export";

export function AgentBuilder() {
  const [kind, setKind] = useState<"full" | "custom">("full");
  const [custom, setCustom] = useState<AgentSelection>(fullSelection);
  const [copied, setCopied] = useState<"code" | "system" | null>(null);
  const selection = kind === "full" ? fullSelection() : custom;
  const code = useMemo(() => agentCode(selection), [selection]);
  const system = useMemo(() => agentSystem(selection), [selection]);

  async function copy(value: string, which: "code" | "system") {
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
                {ROLES.length} roles, {NATIVE_TOOLS.length} herramientas, {CAPABILITIES.length} proveedores.
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
            {NATIVE_TOOLS.map((item) => (
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
              {(["strict-local", "local-runtime"] as AgentMode[]).map((mode) => (
                <Toggle
                  key={mode}
                  label={mode}
                  pressed={selection.mode === mode}
                  onClick={() => setCustom({ ...custom, mode })}
                />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              strict-local deniega la red. local-runtime la deja solo con aprobación. La política es Autonomía gobernada y no hay otra.
            </p>
          </div>
          <div className="rounded-panel border border-line bg-surface p-4">
            <p className="text-xs font-medium tracking-wide text-muted">PRESUPUESTO</p>
            <div className="mt-3 grid gap-3">
              <Limit
                label={`Pasos, máximo ${AGENT_LIMITS.maxSteps}`}
                value={selection.limits.maxSteps}
                max={AGENT_LIMITS.maxSteps}
                onChange={(maxSteps) => setCustom({ ...custom, limits: { ...custom.limits, maxSteps } })}
              />
              <Limit
                label={`En paralelo, máximo ${AGENT_LIMITS.maxParallel}`}
                value={selection.limits.maxParallel}
                max={AGENT_LIMITS.maxParallel}
                onChange={(maxParallel) => setCustom({ ...custom, limits: { ...custom.limits, maxParallel } })}
              />
              <Limit
                label={`Tiempo en ms, máximo ${AGENT_LIMITS.timeoutMs}`}
                value={selection.limits.timeoutMs}
                max={AGENT_LIMITS.timeoutMs}
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
            El JSON es el agente. El campo system es la instrucción si el destino solo acepta texto.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(code, "code")}
              className="inline-flex h-11 items-center gap-2 rounded-panel bg-signal px-4 text-sm font-semibold text-ink"
            >
              {copied === "code" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied === "code" ? "Copiado" : "Copiar código"}
            </button>
            <button
              type="button"
              onClick={() => copy(system, "system")}
              className="inline-flex h-11 items-center gap-2 rounded-panel border border-line bg-bg px-4 text-sm text-fg"
            >
              {copied === "system" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied === "system" ? "Copiado" : "Copiar instrucción"}
            </button>
          </div>
          <textarea
            readOnly
            value={code}
            rows={28}
            className="mt-4 w-full resize-y rounded-panel border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg outline-none"
          />
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
