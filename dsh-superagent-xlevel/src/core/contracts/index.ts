import { SCHEMA_VERSION } from "../domain/index.ts";

/** Contract registry. JSON Schema files under /schemas are the interoperability form. */
export interface ContractDescriptor {
  name: string;
  schemaVersion: typeof SCHEMA_VERSION;
  schemaPath: string;
  description: string;
}

export const CONTRACTS: ContractDescriptor[] = [
  ["AgentSpec", "schemas/agents/agent-spec.schema.json", "Identidad, herramientas y límites de un agente."],
  ["AgentMessage", "schemas/agents/agent-message.schema.json", "Mensaje intercambiado entre agentes."],
  ["AgentResult", "schemas/agents/agent-result.schema.json", "Resultado verificable de un agente."],
  ["Task", "schemas/orchestration/task.schema.json", "Unidad de trabajo con criterios de aceptación."],
  ["TaskGraph", "schemas/orchestration/task-graph.schema.json", "Grafo dirigido de tareas."],
  ["Plan", "schemas/orchestration/plan.schema.json", "Plan jerárquico y criterios de éxito."],
  ["Ticket", "schemas/orchestration/ticket.schema.json", "Unidad de trabajo externa asignable."],
  ["ModelRequest", "schemas/models/model-request.schema.json", "Solicitud normalizada al gateway."],
  ["ModelResponse", "schemas/models/model-response.schema.json", "Respuesta normalizada del gateway."],
  ["Capability", "schemas/models/capability.schema.json", "Capacidad declarada frente a verificada."],
  ["ToolManifest", "schemas/tools/tool-manifest.schema.json", "Herramienta independiente de su origen."],
  ["ToolCall", "schemas/tools/tool-call.schema.json", "Invocación de herramienta."],
  ["ToolResult", "schemas/tools/tool-result.schema.json", "Resultado de herramienta."],
  ["MemoryRecord", "schemas/memory/memory-record.schema.json", "Registro de memoria cognitiva."],
  ["Execution", "schemas/execution/execution.schema.json", "Ejecución persistente."],
  ["Checkpoint", "schemas/execution/checkpoint.schema.json", "Punto de restauración verificable."],
  ["Policy", "schemas/governance/policy.schema.json", "Reglas de autorización."],
  ["Approval", "schemas/governance/approval.schema.json", "Solicitud de operación sensible."],
  ["EventEnvelope", "schemas/events/event-envelope.schema.json", "Sobre de evento tipado."],
  ["Identifiers", "schemas/common/identifiers.schema.json", "Convenio de identificadores."],
  ["Timestamps", "schemas/common/timestamps.schema.json", "Fechas ISO-8601 UTC."],
  ["Metadata", "schemas/common/metadata.schema.json", "Metadatos abiertos controlados."],
  ["Errors", "schemas/common/errors.schema.json", "Error estructurado."],
].map(([name, schemaPath, description]) => ({
  name,
  schemaVersion: SCHEMA_VERSION,
  schemaPath,
  description,
}));

export const COMPATIBILITY_RULES = [
  "Todo contrato declara schemaVersion.",
  "Los adaptadores traducen formatos de proveedor; el dominio no los importa.",
  "Los campos específicos de un proveedor viven en metadata, no en el tipo de dominio.",
  "Un cambio incompatible incrementa el componente mayor de schemaVersion.",
  "Los identificadores usan el prefijo del agregado y un UUID.",
  "Las fechas son ISO-8601 en UTC.",
  "Los secretos no se serializan en checkpoints, eventos ni auditoría.",
] as const;
