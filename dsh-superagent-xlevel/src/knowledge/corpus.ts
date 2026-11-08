export interface CorpusDocument {
  id: string;
  title: string;
  source: string;
  body: string;
}

/** Curated local corpus. Research hits must cite these passages; they are not web results. */
export const CORPUS: CorpusDocument[] = [
  {
    id: "doc-boundaries",
    title: "Límites de dominio",
    source: "docs/002-architecture.md",
    body: "El Core no importa SDKs de proveedores. El Planner produce planes y no ejecuta código. Verification no acepta el resultado declarado por el worker. La memoria no sustituye la persistencia transaccional. Toda operación tiene identidad, estado, trazabilidad y política.",
  },
  {
    id: "doc-autonomy",
    title: "Autonomía gobernada",
    source: "docs/016-governance.md",
    body: "Investigar, editar el sandbox y ejecutar tests es automático. Los commits dependen de la política. Publicar, producción, secretos y borrados externos exigen autorización o están denegados. La autonomía no anula la autorización. No hay bucles infinitos: cada ejecución tiene presupuesto de pasos, tiempo y reintentos.",
  },
  {
    id: "doc-capabilities",
    title: "Capacidades declaradas y verificadas",
    source: "docs/008-capability-registry.md",
    body: "Una capacidad declarada por un proveedor no es una capacidad comprobada. El registro separa contexto máximo declarado, tool calling, visión, salida estructurada y restricciones. El proveedor de referencia no es un modelo neuronal. strict-local impide inferencia de red.",
  },
  {
    id: "doc-mcp",
    title: "Tool Fabric y MCP",
    source: "docs/012-mcp.md",
    body: "Las herramientas MCP, nativas y plugins se normalizan a ToolManifest. El manifiesto declara red, sistema de archivos, shell y si exige aprobación. Tool Fabric no se autoriza a sí mismo: Governance decide. Los argumentos no confiables se escanean contra inyección de instrucciones.",
  },
  {
    id: "doc-recovery",
    title: "Checkpoints y recuperación",
    source: "docs/015-recovery.md",
    body: "Cada transición relevante persiste un checkpoint con checksum. Un checkpoint alterado no se restaura. Las acciones no idempotentes no se repiten sin comprobar estado. Si el presupuesto de recuperación se agota, el sistema escala con evidencia en lugar de declarar éxito.",
  },
  {
    id: "doc-sandbox",
    title: "Sandbox y worktrees",
    source: "docs/013-execution-sandbox.md",
    body: "El aislamiento de referencia es un workspace virtual con frontera de rutas. Git worktrees y contenedores son adaptadores. El worker no aprueba su propio resultado. Los secretos no se escriben en el estado serializado.",
  },
  {
    id: "doc-levels",
    title: "Tres niveles de madurez",
    source: "docs/025-roadmap.md",
    body: "Nivel 1 es la fundación arquitectónica: contratos, roles, motor de referencia, pruebas y CI. Nivel 2 es el runtime funcional con modelos reales, MCP y workers de sistema. Nivel 3 es la plataforma de ingeniería autónoma de larga duración. El scaffolding no debe presentarse como el nivel 3.",
  },
];
