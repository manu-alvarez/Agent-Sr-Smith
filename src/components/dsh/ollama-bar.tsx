import { useEffect, useRef, useState } from "react";
import { DEFAULT_OLLAMA_HOST, listOllamaModels, type OllamaModel } from "../../lib/ollama";

const HOST_KEY = "sr-smith-ollama-host";
const MODEL_KEY = "sr-smith-ollama-model";

export function OllamaBar({
  host,
  model,
  onHost,
  onModel,
}: {
  host: string;
  model: string;
  onHost: (host: string) => void;
  onModel: (model: string) => void;
}) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [status, setStatus] = useState("Buscando modelos…");
  const onModelRef = useRef(onModel);
  onModelRef.current = onModel;

  useEffect(() => {
    const controller = new AbortController();
    listOllamaModels(host, controller.signal)
      .then((found) => {
        setModels(found);
        if (found.length === 0) {
          setStatus("Ollama respondió, pero no hay modelos.");
          return;
        }
        const saved = localStorage.getItem(MODEL_KEY);
        const next = found.find((item) => item.name === saved)?.name ?? found[0]!.name;
        onModelRef.current(next);
        localStorage.setItem(MODEL_KEY, next);
        setStatus(`${found.length} modelos en ${host}`);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setModels([]);
        setStatus("Sin ruta desde este navegador. Si Ollama está encendido, permite el origen con OLLAMA_ORIGINS=* y reinícialo.");
      });
    return () => controller.abort();
  }, [host]);

  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <p className="font-mono text-xs tracking-widest text-signal">OLLAMA</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        El modelo se carga en tu navegador y redacta el proyecto y el agente. Esta web no entra en tu red por su cuenta.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          aria-label="Dirección de Ollama"
          value={host}
          onChange={(event) => {
            onHost(event.target.value);
            localStorage.setItem(HOST_KEY, event.target.value);
          }}
          className="h-11 min-w-0 flex-1 rounded-panel border border-line bg-bg px-3 font-mono text-sm text-fg outline-none focus:border-signal"
        />
        <select
          aria-label="Modelo"
          value={model}
          onChange={(event) => {
            onModel(event.target.value);
            localStorage.setItem(MODEL_KEY, event.target.value);
          }}
          disabled={models.length === 0}
          className="h-11 rounded-panel border border-line bg-bg px-3 text-sm text-fg outline-none focus:border-signal disabled:opacity-60"
        >
          {models.length === 0 ? <option value="">Sin modelos</option> : null}
          {models.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-sm text-muted">{status}</p>
    </section>
  );
}

export function storedOllamaHost(): string {
  if (typeof localStorage === "undefined") return DEFAULT_OLLAMA_HOST;
  return localStorage.getItem(HOST_KEY) || DEFAULT_OLLAMA_HOST;
}
