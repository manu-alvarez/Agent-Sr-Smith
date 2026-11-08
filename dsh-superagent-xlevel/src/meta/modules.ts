import type { ModuleDescriptor } from "../core/domain/index.ts";

export const MODULES: ModuleDescriptor[] = [
  { id: "core", name: "Core", status: "implemented", responsibility: "Contratos, identidades, eventos y errores.", mustNot: "Invocar modelos o herramientas." },
  { id: "orchestration", name: "Orchestration", status: "implemented", responsibility: "Planificar, enrutar y coordinar el grafo.", mustNot: "Ejecutar herramientas privilegiadas." },
  { id: "agents", name: "Agent runtime", status: "reference", responsibility: "Ciclo de vida, roles y perfiles.", mustNot: "Persistir por su cuenta ni saltarse políticas." },
  { id: "intelligence", name: "Intelligence", status: "reference", responsibility: "Análisis, estrategia y presupuesto de contexto.", mustNot: "Afirmar capacidades no verificadas." },
  { id: "models", name: "Model gateway", status: "reference", responsibility: "Normalizar proveedores. El de referencia es determinista.", mustNot: "Inventar respuestas si el proveedor falla." },
  { id: "knowledge", name: "Knowledge", status: "reference", responsibility: "Corpus local, troceo y recuperación léxica.", mustNot: "Presentar un índice vectorial inexistente como activo." },
  { id: "memory", name: "Memory", status: "implemented", responsibility: "Memoria de trabajo, episódica, semántica y procedimental.", mustNot: "Sustituir el estado transaccional." },
  { id: "tools", name: "Tool fabric", status: "reference", responsibility: "Manifiestos nativos y ejecución autorizada.", mustNot: "Autorizarse a sí mismo." },
  { id: "workers", name: "Workers", status: "reference", responsibility: "Sandbox virtual con frontera de rutas.", mustNot: "Aprobar su propio resultado." },
  { id: "verification", name: "Verification", status: "implemented", responsibility: "Comprobar criterios con evidencia.", mustNot: "Dar por bueno el estado declarado por el worker." },
  { id: "recovery", name: "Recovery", status: "implemented", responsibility: "Diagnosticar, reintentar o escalar.", mustNot: "Repetir efectos no idempotentes a ciegas." },
  { id: "governance", name: "Governance", status: "implemented", responsibility: "Políticas, aprobaciones, auditoría y presupuestos.", mustNot: "Delegar la autorización en el modelo." },
  { id: "persistence", name: "Persistence", status: "reference", responsibility: "Repositorios en memoria y SQLite local.", mustNot: "Guardar secretos." },
  { id: "observability", name: "Observability", status: "reference", responsibility: "Línea de tiempo, métricas y trazas de la ejecución.", mustNot: "Alterar el resultado." },
  { id: "triggers", name: "Triggers", status: "contract", responsibility: "Contratos para GitHub, CI, ficheros y webhooks.", mustNot: "Abrir red en strict-local." },
  { id: "api", name: "API", status: "reference", responsibility: "HTTP local del plano de control.", mustNot: "Acceder a infraestructura saltándose el dominio." },
  { id: "cli", name: "CLI", status: "implemented", responsibility: "doctor, validate y run en local.", mustNot: "Publicar o desplegar." },
  { id: "plugins", name: "Plugins", status: "contract", responsibility: "Manifiesto y reglas de compatibilidad.", mustNot: "Cargarse sin validar versión y permisos." },
];
