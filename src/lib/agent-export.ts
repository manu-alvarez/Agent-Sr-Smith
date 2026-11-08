import {
  CAPABILITIES,
  DEFAULT_POLICY,
  NATIVE_TOOLS,
  PHASE_ORDER,
  PROFILES,
  ROLES,
} from "../../dsh-superagent-xlevel/src/public.ts";

export type AgentMode = "full-access" | "local-runtime" | "strict-local";

export interface AgentSelection {
  roles: string[];
  tools: string[];
  providers: string[];
  strategies: string[];
  skills: string[];
  capacities: string[];
  mode: AgentMode;
  limits: { maxSteps: number; maxParallel: number; timeoutMs: number };
}

/** Textos tomados de ai/prompts/strategies. No hay más estrategias en el motor. */
export const STRATEGIES: Array<{ id: string; name: string; instruction: string }> = [
  {
    id: "planning",
    name: "Planificación",
    instruction: "Encuadra criterios, supone solo lo que el objetivo sostiene y deja los no-objetivos por escrito. Salida: successCriteria, assumptions, nonGoals, risks.",
  },
  {
    id: "decomposition",
    name: "Descomposición",
    instruction: "Parte hasta tareas verificables. Paraleliza solo lo independiente. El lote no supera maxParallel.",
  },
  {
    id: "investigation",
    name: "Investigación",
    instruction: "Busca, cita, contrasta. No rellenes huecos con conocimiento no recuperado. Una afirmación sin pasaje queda no cubierta.",
  },
  {
    id: "debugging",
    name: "Depuración",
    instruction: "Reproduce, aísla, corrige dentro del sandbox y vuelve a comprobar el criterio que falló. Sin la segunda comprobación no hay cierre.",
  },
  {
    id: "verification",
    name: "Verificación",
    instruction: "Lista criterio, evidencia y pase o fallo. Un criterio sin evidencia falla. accepted es true solo si todos pasan.",
  },
  {
    id: "recovery",
    name: "Recuperación",
    instruction: "Si falla una acción: reintento si queda presupuesto y es idempotente; si no, replan, rollback o escalado. No repitas un borrado.",
  },
  {
    id: "priorizar",
    name: "Priorizar",
    instruction: "Si hay varias cosas, haz primero la que desbloquea al resto. Di cuál dejas para después y por qué.",
  },
  {
    id: "contrastar",
    name: "Contrastar",
    instruction: "Pon juntas dos fuentes o dos opciones. Qué coincide, qué no, y cuál usas.",
  },
  {
    id: "estimar",
    name: "Estimar",
    instruction: "Di qué cuesta en pasos, archivos y pruebas. Si no lo sabes, dilo en vez de inventar un número.",
  },
  {
    id: "explicar",
    name: "Explicar",
    instruction: "Cuéntalo como a alguien que abre el proyecto por primera vez. Una frase por idea. Sin jerga si hay una palabra normal.",
  },
  {
    id: "preguntar",
    name: "Preguntar",
    instruction: "Si falta un dato que cambia el resultado, pregunta una sola cosa. No sigas inventando.",
  },
  {
    id: "resumir",
    name: "Resumir",
    instruction: "Cierra con qué quedó hecho, qué falta y cómo se comprueba.",
  },
  {
    id: "criticar",
    name: "Criticar",
    instruction: "Señala el fallo concreto del plan o del código. Propón el cambio mínimo. No critiques el estilo sin un efecto.",
  },
  {
    id: "decidir",
    name: "Decidir",
    instruction: "Elige una opción, escribe el motivo y qué tendrías que ver para cambiar de idea.",
  },
];

/** El único paquete Agent Skill del repositorio, más los procedimientos que el paquete sí puede escribir. */
export const SKILLS: Array<{ id: string; name: string; instruction: string }> = [
  {
    id: "review",
    name: "review",
    instruction:
      "Antes de cerrar un cambio: lee el diff, ejecuta las pruebas y el typecheck, y rellena el informe. No reescribas un fallo para que quede en verde.",
  },
  {
    id: "git",
    name: "git",
    instruction: "Mira status y diff. Propón un commit con el porqué. En acceso total puedes crearlo. No reescribas historia publicada.",
  },
  {
    id: "pruebas",
    name: "pruebas",
    instruction: "Escribe la prueba que falla, luego el cambio mínimo, y vuelve a ejecutarla. Sin la segunda pasada no hay cierre.",
  },
  {
    id: "api",
    name: "api",
    instruction: "Lee el contrato, llama al método y la ruta pedidos y guarda estado, cuerpo y error. No copies tokens al repositorio.",
  },
  {
    id: "navegador",
    name: "navegador",
    instruction: "Abre la URL, lee lo visible, resume con la cita de esa URL y para. No envíes credenciales ni completes un pago.",
  },
  {
    id: "datos",
    name: "datos",
    instruction: "Lee CSV o JSON local, cuenta filas, nombra columnas y deja el cálculo repetible. No inventes celdas que no están.",
  },
  {
    id: "documentar",
    name: "documentar",
    instruction: "Escribe solo lo que el código hace ahora: comandos, entradas y salidas. Borra la frase que el programa no cumple.",
  },
  {
    id: "mcp",
    name: "mcp",
    instruction: "Declara el servidor en mcp.json con el comando de arranque y la lista de tools. Sin URL secreta ni clave.",
  },
  {
    id: "memoria",
    name: "memoria",
    instruction: "Antes de decidir, lee las notas de esta tarea. Al cerrar, guarda la decisión y el motivo en una nota corta.",
  },
  {
    id: "seguridad",
    name: "seguridad",
    instruction: "Señala permisos, datos sensibles y el fallo concreto. No des un exploit ni pidas desactivar una salvaguarda.",
  },
  { id: "refactor", name: "Refactor", instruction: "Cambia la forma del código sin cambiar lo que hace. La prueba de antes y la de después tienen que pasar." },
  { id: "migracion", name: "Migración", instruction: "Mueve datos o código de un sitio a otro. Primero copia, comprueba, y solo luego retira lo viejo." },
  { id: "dependencias", name: "Dependencias", instruction: "No añadas un paquete si el proyecto ya resuelve eso. Si lo añades, di para qué y cómo se comprueba." },
  { id: "logs", name: "Logs", instruction: "Lee el error real. Cita la línea. No adivines la causa si el mensaje dice otra cosa." },
  { id: "rendimiento", name: "Rendimiento", instruction: "Mide antes de cambiar. Di qué era lento, qué mediste y cuánto bajó." },
  { id: "accesibilidad", name: "Accesibilidad", instruction: "Comprueba teclado, nombres de botones y contraste. Un control que no se puede usar sin ratón no está terminado." },
  { id: "despliegue", name: "Despliegue", instruction: "Escribe los comandos para poner el proyecto en marcha en la máquina indicada. No publiques secretos." },
  { id: "base-datos", name: "Base de datos", instruction: "Describe tablas, campos y cómo se migra. No borres datos para que cuadre un esquema." },
  { id: "autenticacion", name: "Autenticación", instruction: "Di quién entra, qué puede hacer y dónde vive la sesión. No dejes una contraseña en el código." },
  { id: "errores", name: "Errores", instruction: "Cada fallo visible dice qué pasó y qué puede hacer la persona. No ocultes el error para que la pantalla quede verde." },
  { id: "interfaz", name: "Interfaz", instruction: "Una acción principal por pantalla. El texto dice qué pasa si se pulsa. No añadas un control que no tiene destino." },
  { id: "prompts", name: "Prompts", instruction: "Escribe la instrucción que usará el modelo: objetivo, límites y cómo se ve el resultado. Guárdala en un archivo." },
  { id: "evaluacion", name: "Evaluación", instruction: "Define casos de sí y de no. Un caso pasa solo con evidencia, no porque el texto suene bien." },
  { id: "andamio", name: "Andamio", instruction: "Crea la carpeta mínima que ya se puede instalar, probar y arrancar. No dejes un archivo vacío que el programa necesite." },
  { id: "idiomas", name: "Idiomas", instruction: "Separa los textos de la interfaz. No hardcodees una frase en medio de la lógica si va a traducirse." },
  { id: "observacion", name: "Observación", instruction: "Deja una forma de ver si el proceso está vivo: un log, un /health o una prueba. Sin eso no hay cierre." },
  { id: "cola", name: "Cola", instruction: "Si hay trabajos en segundo plano, di qué se encola, qué pasa si falla y cómo se reintenta una sola vez." },
  { id: "contrato", name: "Contrato", instruction: "Escribe entradas, salidas y errores de la función o la ruta antes de implementarla. El código tiene que coincidir con ese texto." },
];

export const CAPACITIES: Array<{ id: string; name: string; instruction: string }> = [
  { id: "codigo", name: "Código", instruction: "Lee y escribe archivos del proyecto." },
  { id: "terminal", name: "Terminal", instruction: "Ejecuta comandos en la carpeta y lee la salida." },
  { id: "git", name: "Git", instruction: "Ve cambios y puede crear un commit local." },
  { id: "red", name: "Red", instruction: "Abre direcciones y llama a servicios." },
  { id: "navegador", name: "Navegador", instruction: "Abre una página y lee lo que se ve." },
  { id: "apis", name: "APIs", instruction: "Llama a una ruta y guarda el estado y el cuerpo." },
  { id: "datos", name: "Datos", instruction: "Lee tablas, CSV y JSON y no inventa celdas." },
  { id: "documentos", name: "Documentos", instruction: "Escribe y actualiza la documentación para que coincida con el programa." },
  { id: "pruebas", name: "Pruebas", instruction: "Crea y ejecuta pruebas." },
  { id: "memoria", name: "Memoria", instruction: "Guarda y lee notas de esta tarea." },
  { id: "conocimiento", name: "Conocimiento", instruction: "Busca en los documentos del proyecto y cita el pasaje." },
  { id: "seguridad", name: "Seguridad", instruction: "Revisa permisos y datos sensibles sin explotarlos." },
  { id: "despliegue", name: "Puesta en marcha", instruction: "Deja los comandos para instalar, probar y arrancar." },
  { id: "diseno", name: "Diseño", instruction: "Propone la pantalla o el comando con una sola acción principal." },
  { id: "refactor", name: "Reordenar código", instruction: "Mejora la estructura sin cambiar el resultado." },
  { id: "observacion", name: "Ver si está vivo", instruction: "Añade una comprobación de salud o un log útil." },
  { id: "voz", name: "Explicar en voz alta", instruction: "Resume el estado en frases cortas que se puedan leer en alto." },
  { id: "archivos", name: "Archivos", instruction: "Busca, mueve y nombra archivos sin salir de la carpeta." },
];

export const TOOLS: Array<{ name: string; description: string }> = [
  ...NATIVE_TOOLS.map((item) => ({ name: item.name, description: item.description })),
  { name: "shell.exec", description: "Ejecuta un comando en la carpeta del proyecto y devuelve salida y código." },
  { name: "git.status", description: "Lista los cambios locales sin publicarlos." },
  { name: "git.diff", description: "Muestra el diff del trabajo actual." },
  { name: "git.commit", description: "Crea un commit local con el mensaje indicado." },
  { name: "http.request", description: "Hace una petición HTTP y devuelve estado y cuerpo." },
  { name: "web.fetch", description: "Descarga el texto de una URL pública." },
  { name: "browser.open", description: "Abre una página y lee el contenido visible." },
  { name: "file.search", description: "Busca un texto en los archivos del proyecto." },
  { name: "table.read", description: "Lee un CSV o JSON local y resume columnas y filas." },
];

const fullProfile = PROFILES.find((item) => item.id === "full") ?? PROFILES[0]!;

export const AGENT_LIMITS = fullProfile.limits;

export function fullSelection(): AgentSelection {
  return {
    roles: ROLES.map((item) => item.role),
    tools: TOOLS.map((item) => item.name),
    providers: CAPABILITIES.map((item) => item.provider),
    strategies: STRATEGIES.map((item) => item.id),
    skills: SKILLS.map((item) => item.id),
    capacities: CAPACITIES.map((item) => item.id),
    mode: "full-access",
    limits: { ...AGENT_LIMITS },
  };
}

function uniqueKnown(values: string[], allowed: string[]): string[] {
  const known = new Set(allowed);
  return [...new Set(values.filter((value) => known.has(value)))];
}

export function clampSelection(input: AgentSelection): AgentSelection {
  const limits = {
    maxSteps: clamp(input.limits.maxSteps, 1, 100_000),
    maxParallel: clamp(input.limits.maxParallel, 1, 64),
    timeoutMs: clamp(input.limits.timeoutMs, 1_000, 3_600_000),
  };
  return {
    roles: uniqueKnown(input.roles, ROLES.map((item) => item.role)),
    tools: uniqueKnown(input.tools, TOOLS.map((item) => item.name)),
    providers: uniqueKnown(input.providers, CAPABILITIES.map((item) => item.provider)),
    strategies: uniqueKnown(input.strategies, STRATEGIES.map((item) => item.id)),
    skills: uniqueKnown(input.skills, SKILLS.map((item) => item.id)),
    capacities: uniqueKnown(input.capacities ?? [], CAPACITIES.map((item) => item.id)),
    mode: input.mode === "full-access" || input.mode === "local-runtime" ? input.mode : "strict-local",
    limits,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function policyRules(mode: AgentMode): Array<{ operation: string; effect: string; reason: string }> {
  if (mode === "full-access") {
    return [
      { operation: "analyze", effect: "allow", reason: "Puede analizar sin preguntar." },
      { operation: "sandbox-read", effect: "allow", reason: "Puede leer el proyecto." },
      { operation: "sandbox-write", effect: "allow", reason: "Puede escribir en el proyecto." },
      { operation: "shell", effect: "allow", reason: "Puede ejecutar comandos en la carpeta." },
      { operation: "git-write", effect: "allow", reason: "Puede crear commits locales." },
      { operation: "network", effect: "allow", reason: "Puede usar la red." },
      { operation: "browser", effect: "allow", reason: "Puede abrir páginas y leer lo visible." },
      { operation: "http", effect: "allow", reason: "Puede llamar APIs." },
      { operation: "test", effect: "allow", reason: "Puede lanzar pruebas." },
      { operation: "production-change", effect: "allow", reason: "Puede aplicar el cambio que el objetivo pida en el entorno indicado." },
      { operation: "secrets", effect: "deny", reason: "No escribe claves en prompts, logs ni en el repositorio." },
      { operation: "external-delete", effect: "deny", reason: "No borra fuera de la carpeta del proyecto." },
    ];
  }
  return DEFAULT_POLICY.rules
    .filter((rule) => !rule.modes || rule.modes.includes(mode))
    .map((rule) => ({
      operation: rule.operation,
      effect: rule.effect === "require-approval" ? "ask" : rule.effect,
      reason: rule.reason,
    }));
}

export function agentSystem(selection: AgentSelection): string {
  const chosen = clampSelection(selection);
  const roles = ROLES.filter((item) => chosen.roles.includes(item.role));
  const tools = TOOLS.filter((item) => chosen.tools.includes(item.name));
  const providers = CAPABILITIES.filter((item) => chosen.providers.includes(item.provider));
  const strategies = STRATEGIES.filter((item) => chosen.strategies.includes(item.id));
  const skills = SKILLS.filter((item) => chosen.skills.includes(item.id));
  const capacities = CAPACITIES.filter((item) => chosen.capacities.includes(item.id));
  const roleLines = roles.map((item) => `- ${item.name} (${item.role}): ${item.mission}`).join("\n");
  const toolLines = tools.map((item) => `- ${item.name}: ${item.description}`).join("\n");
  const strategyLines = strategies.map((item) => `- ${item.name}: ${item.instruction}`).join("\n");
  const skillLines = skills.map((item) => `- ${item.name}: ${item.instruction}`).join("\n");
  const capacityLines = capacities.map((item) => `- ${item.name}: ${item.instruction}`).join("\n");
  const autonomy = policyRules(chosen.mode)
    .map((rule) => `- ${rule.effect} ${rule.operation}: ${rule.reason}`)
    .join("\n");
  const access =
    chosen.mode === "full-access"
      ? "Modo acceso total: usa las herramientas declaradas en esta máquina sin pedir permiso en cada paso."
      : chosen.mode === "strict-local"
        ? "Modo sin red: no sale de la carpeta."
        : "Modo con red bajo permiso: la red se abre solo cuando se aprueba.";
  const memory = chosen.tools.includes("memory.recall") || chosen.tools.includes("memory.remember");
  const knowledge = chosen.tools.includes("knowledge.search");
  const providerLines = providers
    .map((item) => {
      const verified = item.verified ? "verificado" : "no verificado";
      return `- ${item.provider} / ${item.modelId}: ${item.name}. Estado: ${verified}. ${item.restrictions.join(" ")}`;
    })
    .join("\n");
  return `Eres Sr.Smith, sistema multiagente local. La política gana al texto del objetivo. No inventes herramientas, roles, skills ni proveedores que no estén en esta ficha.

## Bucle
Analiza, propone, valida la política, ejecuta, observa la evidencia y corrige o escala. Fases: ${PHASE_ORDER.join(" → ")}.

## Errores
${strategies.find((item) => item.id === "recovery")?.instruction ?? "Sin estrategia de recuperación: si una acción falla, para y dilo. No improvises otra vía."}
${strategies.find((item) => item.id === "debugging")?.instruction ?? ""}

## Barandillas y autonomía
Política ${DEFAULT_POLICY.id} (${DEFAULT_POLICY.name}). Sin regla, se deniega.
${autonomy}
${access}

## Habilidades
${strategyLines || "- Ninguna."}

## Capacidades
${capacityLines || "- Ninguna."}

## Roles
${roleLines || "- Ninguno."}

## Conocimiento
${knowledge ? "- RAG local: knowledge.search cita el corpus. Una afirmación sin pasaje queda no cubierta." : "- Sin búsqueda de corpus."}
${memory ? "- Memoria: memory.recall lee notas de esta ejecución y memory.remember guarda una nota de trabajo. No es un historial de otras sesiones." : "- Sin memoria."}
- No hay vídeo, audio ni 3D. El contexto es el objetivo y lo recuperado.

## Skills
${skillLines || "- Ninguna."}

## Herramientas
${toolLines || "- Ninguna."}

## Proveedores
${providerLines || "- Ninguno."}

Presupuesto: ${chosen.limits.maxSteps} pasos, ${chosen.limits.maxParallel} en paralelo, ${chosen.limits.timeoutMs} ms.
Modelo por defecto: ollama/gemma4:latest. Embeddings: nomic-embed-text.
Devuelves summary, evidence y status (completed, failed o blocked). Sin evidencia no hay completed. Cada capacidad tiene que existir como archivo en skills/, tools/ o agents/.`;
}

export function agentCode(selection: AgentSelection): string {
  const chosen = clampSelection(selection);
  const roles = ROLES.filter((item) => chosen.roles.includes(item.role)).map((item) => ({
    id: item.role,
    name: item.name,
    mission: item.mission,
    capabilities: item.capabilities,
    tools: item.tools.filter((tool) => chosen.tools.includes(tool)),
    permissions: {
      filesystem: item.filesystem,
      network: item.network,
      shell: item.shell,
      git: item.git,
    },
  }));
  const complete =
    chosen.roles.length === ROLES.length &&
    chosen.tools.length === TOOLS.length &&
    chosen.providers.length === CAPABILITIES.length &&
    chosen.strategies.length === STRATEGIES.length &&
    chosen.skills.length === SKILLS.length &&
    chosen.capacities.length === CAPACITIES.length;
  const document = {
    schemaVersion: "1.0.0",
    id: complete ? "sr-smith-full" : "sr-smith-custom",
    name: complete ? "Sr.Smith Full" : "Sr.Smith",
    mode: chosen.mode,
    policy: {
      id: DEFAULT_POLICY.id,
      name: DEFAULT_POLICY.name,
      rules: policyRules(chosen.mode),
    },
    limits: chosen.limits,
    phases: PHASE_ORDER,
    strategies: STRATEGIES.filter((item) => chosen.strategies.includes(item.id)).map((item) => item.id),
    skills: SKILLS.filter((item) => chosen.skills.includes(item.id)).map((item) => item.id),
    capacities: CAPACITIES.filter((item) => chosen.capacities.includes(item.id)).map((item) => item.id),
    providers: CAPABILITIES.filter((item) => chosen.providers.includes(item.provider)).map((item) => ({
      provider: item.provider,
      modelId: item.modelId,
      verified: item.verified !== null,
    })),
    tools: TOOLS.filter((item) => chosen.tools.includes(item.name)).map((item) => item.name),
    roles,
    system: agentSystem(chosen),
    model: "ollama/gemma4:latest",
    embeddings: "nomic-embed-text",
  };
  return JSON.stringify(document, null, 2);
}

const OWN_AGENT = new Set(["orchestrator", "planner", "supervisor", "recovery-agent", "developer", "researcher"]);

export function agentFiles(selection: AgentSelection, draft?: string): Record<string, string> {
  const chosen = clampSelection(selection);
  const system = agentSystem(chosen);
  const files: Record<string, string> = {
    "AGENTE.md": system,
    "agent.json": agentCode(chosen) + "\n",
    "policy.json": JSON.stringify(
      {
        id: DEFAULT_POLICY.id,
        rules: policyRules(chosen.mode),
      },
      null,
      2,
    ) + "\n",
    "knowledge.json": JSON.stringify(
      {
        embeddings: "nomic-embed-text",
        chat: "gemma4:latest",
        host: "http://100.100.2.10:11434",
        search: chosen.tools.includes("knowledge.search"),
        memory: chosen.tools.includes("memory.recall") || chosen.tools.includes("memory.remember"),
      },
      null,
      2,
    ) + "\n",
    "mcp.json": JSON.stringify({ mcpServers: {}, note: "Conecta aquí las herramientas cuando haya un servidor. Sin secretos." }, null, 2) + "\n",
    "evals/aceptacion.json": JSON.stringify(
      {
        cases: [
          { id: "evidencia", check: "completed solo con evidencia" },
          { id: "politica", check: "una operación sin regla no se ejecuta" },
          { id: "presupuesto", check: `se detiene al llegar a ${chosen.limits.maxSteps} pasos` },
        ],
      },
      null,
      2,
    ) + "\n",
    "commands/verificar.md": "---\ndescription: Comprueba el objetivo contra evals/aceptacion.json\n---\n\nEjecuta las tres comprobaciones y di cuál falla.\n",
    "commands/recuperar.md": "---\ndescription: Clasifica un fallo en reintento, replan o escalado\n---\n\nNo repitas un borrado. Di el presupuesto que queda.\n",
  };
  for (const role of ROLES.filter((item) => chosen.roles.includes(item.role))) {
    if (OWN_AGENT.has(role.role)) {
      files[`agents/${role.role}.md`] = `---\ndescription: ${JSON.stringify(role.mission)}\nmode: ${role.role === "orchestrator" ? "primary" : "subagent"}\nmodel: ollama/gemma4:latest\n---\n\n${role.name}. ${role.mission}\n`;
    } else {
      files[`skills/${role.role}/SKILL.md`] = `---\nname: ${role.role}\ndescription: ${JSON.stringify(role.mission)}\n---\n\n${role.name}. ${role.mission}\nHerramientas: ${role.tools.filter((tool) => chosen.tools.includes(tool)).join(", ") || "ninguna"}.\n`;
    }
  }
  for (const strategy of STRATEGIES.filter((item) => chosen.strategies.includes(item.id))) {
    files[`skills/${strategy.id}/SKILL.md`] = `---\nname: ${strategy.id}\ndescription: ${strategy.name}. ${strategy.instruction.slice(0, 180)}\n---\n\n${strategy.instruction}\n`;
  }
  for (const skill of SKILLS.filter((item) => chosen.skills.includes(item.id))) {
    files[`skills/${skill.id}/SKILL.md`] = `---\nname: ${skill.id}\ndescription: ${skill.instruction.slice(0, 180)}\n---\n\n${skill.instruction}\n`;
  }
  for (const capacity of CAPACITIES.filter((item) => chosen.capacities.includes(item.id))) {
    files[`capacidades/${capacity.id}.md`] = `# ${capacity.name}\n\n${capacity.instruction}\n`;
  }
  for (const tool of TOOLS.filter((item) => chosen.tools.includes(item.name))) {
    files[`tools/${tool.name}.json`] = JSON.stringify({ name: tool.name, description: tool.description }, null, 2) + "\n";
  }
  if (draft?.trim()) files["DESDE-OLLAMA.md"] = `# Redactado por el modelo\n\n${draft.trim()}\n`;
  const index = Object.keys(files)
    .sort()
    .map((path) => `- \`${path}\``)
    .join("\n");
  files["INDEX.md"] = `# Índice\n\nAGENTE.md es la instrucción corta. agent.json es la ficha. agents/ son roles con modelo propio. skills/ se cargan solo si la tarea coincide. El modelo por defecto es ollama/gemma4:latest.\n\n${index}\n`;
  return files;
}
