import { useEffect, useState } from "react";
import {
  discoverProviderModels,
  AI_PROVIDER_STORAGE_KEY,
  PROVIDERS,
  type AiProviderConfig,
} from "../../lib/ai-provider";

export function OllamaBar({
  config,
  onConfig,
}: {
  config: AiProviderConfig;
  onConfig: (config: AiProviderConfig) => void;
}) {
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState("Configura el proveedor y consulta sus modelos.");
  const [loading, setLoading] = useState(false);
  const selected = PROVIDERS.find((item) => item.id === config.provider) ?? PROVIDERS[0]!;

  const { provider, baseUrl, apiKey, model } = config;
  useEffect(() => {
    const controller = new AbortController();
    const snapshot: AiProviderConfig = { provider, baseUrl, apiKey, model };
    if (provider !== "ollama" && !apiKey.trim()) {
      setModels([]);
      setStatus("Introduce la API key para consultar los modelos. La clave solo permanece en esta sesión.");
      return () => controller.abort();
    }
    setLoading(true);
    discoverProviderModels(snapshot, controller.signal)
      .then((found) => {
        setModels(found);
        const nextModel = found.includes(model) ? model : found[0] ?? "";
        if (nextModel !== model) onConfig({ ...snapshot, model: nextModel });
        setStatus(found.length ? found.length + " modelos disponibles." : "El proveedor respondió, pero no devolvió modelos.");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setModels([]);
        setStatus(error instanceof Error ? error.message : "No se pudo consultar el proveedor.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [provider, baseUrl, apiKey, model, onConfig]);

  function update(next: AiProviderConfig) {
    onConfig(next);
    try {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEY, JSON.stringify({
        provider: next.provider,
        baseUrl: next.baseUrl,
        model: next.model,
      }));
    } catch {
      // The provider remains usable for this session if storage is unavailable.
    }
  }

  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="font-mono text-xs tracking-widest text-signal">MODELO DE IA</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        El proveedor seleccionado redacta los artefactos del proyecto. Las claves API no se guardan ni se incluyen en el ZIP.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          aria-label="Proveedor de IA"
          value={config.provider}
          onChange={(event) => {
            const provider = event.target.value as AiProviderConfig["provider"];
            const preset = PROVIDERS.find((item) => item.id === provider)!;
            update({ provider, baseUrl: preset.baseUrl, apiKey: "", model: "" });
            setModels([]);
          }}
          className="h-11 min-w-0 rounded-panel border border-line bg-bg px-3 text-sm text-fg outline-none focus:border-signal"
        >
          {PROVIDERS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <input
          aria-label="Modelo de IA"
          list="sr-smith-models"
          value={config.model}
          onChange={(event) => update({ ...config, model: event.target.value })}
          placeholder={loading ? "Consultando modelos…" : "Selecciona o escribe un modelo"}
          className="h-11 min-w-0 rounded-panel border border-line bg-bg px-3 text-sm text-fg outline-none focus:border-signal"
        />
        <datalist id="sr-smith-models">
          {models.map((model) => <option key={model} value={model} />)}
        </datalist>
        <input
          aria-label="URL base del proveedor"
          value={config.baseUrl}
          onChange={(event) => update({ ...config, baseUrl: event.target.value })}
          placeholder="URL base del proveedor"
          className="h-11 min-w-0 rounded-panel border border-line bg-bg px-3 font-mono text-xs text-fg outline-none focus:border-signal sm:col-span-2"
        />
        {selected.keyRequired && (
          <input
            aria-label="API key"
            type="password"
            autoComplete="off"
            value={config.apiKey}
            onChange={(event) => onConfig({ ...config, apiKey: event.target.value })}
            placeholder="API key (solo memoria de esta sesión)"
            className="h-11 min-w-0 rounded-panel border border-line bg-bg px-3 font-mono text-xs text-fg outline-none focus:border-signal sm:col-span-2"
          />
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{status}</p>
      <p className="mt-1 text-xs text-muted">
        OpenAI, OpenRouter y NVIDIA usan API compatible. Claude y Gemini usan sus APIs nativas. Las APIs externas pueden generar cargos según el proveedor. Sr. Smith no añade créditos. Las claves permanecen en memoria de esta sesión y el proxy no las persiste. Los endpoints personalizados pueden requerir CORS. En despliegues sin proxy, permite el origen exacto de Sr. Smith en OLLAMA_ORIGINS y reinicia Ollama; evita * salvo pruebas.
      </p>
    </section>
  );
}
