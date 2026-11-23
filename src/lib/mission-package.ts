import { agentFiles, fullSelection } from "./agent-export.ts";
import type { AiProviderId } from "./ai-provider.ts";
import { strToU8, unzipSync, zipSync } from "fflate";
import { scanUntrusted } from "../../dsh-superagent-xlevel/src/governance/safety/index.ts";
import type { ExecutionReport, ProfileId } from "../../dsh-superagent-xlevel/src/public.ts";
import { FRAMEWORKS, IDES, MOBILE_APPS, starterFiles, type FrameworkId, type IdeId, type MobileId } from "./project-starter.ts";

import { publicUrl } from "./public-url.ts";

const SCAFFOLD_URL = publicUrl("/sr-smith-c57fdd3.zip");

export interface MissionPackage {
  blob: Blob;
  filename: string;
  fileCount: number;
  bytes: number;
}

export interface MissionInput {
  objective: string;
  profileId: ProfileId;
  profileName: string;
  roles: string[];
  report: ExecutionReport;
  projectName: string;
  framework: FrameworkId;
  ide: IdeId[];
  mobile?: MobileId[];
  expertNote?: string;
  generatedFiles?: Record<string, string>;
  aiProvider?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  agentTools?: string[];
  surface?: "computer" | "mobile";
}

export function composeMissionZip(
  scaffolding: Uint8Array,
  files: Record<string, string>,
): { bytes: Uint8Array; fileCount: number } {
  const entries = unzipSync(scaffolding);
  for (const [path, content] of Object.entries(files)) {
    entries[path] = strToU8(content);
  }
  const bytes = zipSync(entries, { level: 6 });
  const fileCount = Object.keys(entries).filter((path) => !path.endsWith("/")).length;
  return { bytes, fileCount };
}

export function missionFiles(input: MissionInput): Record<string, string> {
  const safe = scanUntrusted(input.objective).sanitized;
  const id = input.report.executionId.replace(/[^a-z0-9_]/gi, "").slice(0, 24) || "mision";
  const base = `sr-smith/misiones/${id}`;
  const starter = starterFiles({
    name: input.projectName,
    objective: safe,
    framework: input.framework,
    ide: input.ide,
    mobile: input.mobile,
    surface: input.surface,
  });
  const framework = FRAMEWORKS.find((item) => item.id === input.framework)?.label ?? input.framework;
  const ide = IDES.filter((item) => input.ide.includes(item.id))
    .map((item) => item.label)
    .join(", ");
  const phones = MOBILE_APPS.filter((item) => input.mobile?.includes(item.id));
  const projectRoot = `sr-smith/proyectos/${starter.slug}`;
  const agentSelection = fullSelection();
  if (input.roles.length) agentSelection.roles = input.roles;
  if (input.agentTools?.length) agentSelection.tools = [...new Set([...input.agentTools, "workspace.list"])];
  const agentBundle = agentFiles(agentSelection, input.expertNote ?? undefined, {
    provider: (input.aiProvider as AiProviderId) || "ollama",
    baseUrl: input.aiBaseUrl || "http://localhost:11434",
    model: input.aiModel || "gemma4:latest",
    apiKey: "",
  });
  const tasks = input.report.tasks
    .map(
      (task, index) =>
        `${index + 1}. ${task.title} [${task.status}]\n   Rol: ${task.assignedRole ?? "sin asignar"}\n   Operación: ${task.operation}\n   Criterios: ${task.acceptanceCriteria.join(" | ")}`,
    )
    .join("\n");
  const reportJson = scanUntrusted(JSON.stringify(input.report, null, 2)).sanitized;
  const files: Record<string, string> = {
    "sr-smith/AGENTS.md": "# Sr. Smith workspace\n\nLee README.md y agente/AGENTE.md antes de trabajar. El agente y las herramientas MCP están en agente/. Mantén los cambios dentro de proyectos/ y no declares ejecutadas herramientas que no devuelvan evidencia.\n",
    "sr-smith/EMPEZAR.md": `# Empieza aquí

Proyecto: \`${starter.slug}\`
Framework: ${framework}
IDE: ${ide}
Perfil: ${input.profileName}

## 1. IDE

Abre \`proyectos/${starter.slug}\` en ${ide}.

## 2. Framework

\`\`\`bash
cd proyectos/${starter.slug}
npm install
npm test
npm start
\`\`\`

## 3. CLI de Sr.Smith

Desde esta carpeta \`sr-smith/\`:

\`\`\`bash
npm install
npm test
node --experimental-strip-types src/cli/index.ts doctor
\`\`\`

La misión de esta ejecución está en \`misiones/${id}/\`.
${
  phones.length
    ? `\n## 4. Móvil\n\nEl teléfono no ejecuta npm. Cada app tiene su archivo en \`proyectos/${starter.slug}/movil/\`.\n\n${phones.map((item) => `- ${item.label}: \`${item.file}\`. ${item.summary}`).join("\n")}\n`
    : ""
}`,
    [`${base}/OBJETIVO.md`]: `# Misión ${id}\n\nProyecto: ${starter.slug}\nFramework: ${framework}\nIDE: ${ide}\nPerfil: ${input.profileName} (${input.profileId})\nModo: ${input.report.mode}\nEstado: ${input.report.status}\n\n## Objetivo\n\n${safe}\n\n## Roles del perfil\n\n${input.roles.map((role) => `- ${role}`).join("\n")}\n\nEl código para desarrollar está en \`proyectos/${starter.slug}\`. Esta carpeta guarda el objetivo, el plan y el informe.\n`,
    [`${base}/perfil.json`]: JSON.stringify(
      {
        project: starter.slug,
        framework: input.framework,
        ide: input.ide,
        mobile: input.mobile ?? [],
        profileId: input.profileId,
        profileName: input.profileName,
        mode: input.report.mode,
        roles: input.roles,
      },
      null,
      2,
    ),
    [`${base}/plan.md`]: `# Plan\n\n${input.report.plan.summary}\n\n## Criterios\n\n${input.report.plan.successCriteria.map((item) => `- ${item}`).join("\n")}\n\n## Tareas\n\n${tasks || "Sin tareas."}\n`,
    [`${base}/informe.json`]: reportJson + "\n",
  };
  files["sr-smith/mcp.json"] = JSON.stringify({
    mcpServers: {
      "sr-smith": {
        command: "node",
        args: ["agente/src/mcp-server.mjs"],
        env: { SMITH_WORKSPACE: `proyectos/${starter.slug}`, SMITH_ALLOW_SHELL: "false" },
      },
    },
  }, null, 2) + "\n";
  files["sr-smith/EMPEZAR.md"] += `\n## Herramientas MCP\n\nConecta el mcp.json de esta raíz en tu IDE. El servidor trabaja dentro de proyectos/${starter.slug} y ofrece únicamente las herramientas implementadas y seleccionadas.\n`;
  files["sr-smith/MCP-CONFIG.md"] = `# MCP de Sr. Smith\n\nSi abres sr-smith como workspace, conecta mcp.json de esta raíz. Si abres proyectos/${starter.slug} como workspace, conecta proyectos/${starter.slug}/mcp.json.\nShell está desactivado por defecto. Para activarlo, establece SMITH_ALLOW_SHELL=true en env y reinicia el servidor. El shell hereda los permisos de tu usuario; no es un sandbox del sistema operativo. Úsalo solo en proyectos de confianza.\n`;
  files[`${projectRoot}/GENERATION-REPORT.md`] = [
    "# Informe de generación",
    "",
    "- Proveedor: " + (input.aiProvider || "sin LLM"),
    "- Modelo: " + (input.aiModel || "no especificado"),
    "- Archivos generados por IA: " + Object.keys(input.generatedFiles ?? {}).length,
    "- Plantilla base: " + input.framework,
    "",
    "El contenido generado se ha empaquetado sin ejecutar los archivos del proyecto ni afirmar que sus pruebas hayan pasado.",
    "Antes de desplegar, instala las dependencias y ejecuta las comprobaciones de aceptación del proyecto.",
  ].join("\n") + "\n";
  for (const [path, content] of Object.entries(agentBundle)) {
    files[`sr-smith/agente/${path}`] = content;
  }
  for (const [path, content] of Object.entries(starter.files)) {
    files[`${projectRoot}/${path}`] = content;
  }
  for (const [path, content] of Object.entries(input.generatedFiles ?? {})) {
    if (!path || path.startsWith("/") || path.split("/").some((part) => part === ".." || part === ".")) continue;
    if (/(^|\/)(\.env(?:\.|$)|package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|tsconfig\.json|\.gitignore)$/i.test(path)) continue;
    files[`${projectRoot}/${path}`] = content;
  }
  const projectInstructions = [
    agentBundle["AGENTS.md"] ?? agentBundle["AGENTE.md"] ?? "",
    "",
    "## Proyecto actual",
    "- Nombre: " + starter.slug,
    "- Framework: " + framework,
    "- Objetivo: " + safe,
    "- Perfil: " + input.profileName,
    "",
    "Trabaja dentro de este proyecto. Usa únicamente las herramientas MCP disponibles y verifica cada cambio con evidencia. No afirmes que has ejecutado pruebas que no hayas ejecutado.",
  ].join("\n");
  files[`${projectRoot}/AGENTS.md`] = projectInstructions + "\n";
  files[`${projectRoot}/CLAUDE.md`] = projectInstructions + "\n";
  files[`${projectRoot}/GEMINI.md`] = projectInstructions + "\n";
  files[`${projectRoot}/.cursor/rules/sr-smith.mdc`] = "---\ndescription: instrucciones del proyecto Sr. Smith\nalwaysApply: true\n---\n\n" + projectInstructions + "\n";
  const projectMcp = { mcpServers: { "sr-smith": { command: "node", args: ["../../agente/src/mcp-server.mjs"], env: { SMITH_WORKSPACE: ".", SMITH_ALLOW_SHELL: "false" } } } };
  for (const path of ["mcp.json", ".mcp.json", ".cursor/mcp.json"]) {
    files[`${projectRoot}/${path}`] = JSON.stringify(projectMcp, null, 2) + "\n";
  }
  const openCodePath = `${projectRoot}/opencode.json`;
  let openCodeConfig: Record<string, unknown> = {};
  try { openCodeConfig = JSON.parse(files[openCodePath] ?? "{}") as Record<string, unknown>; } catch { /* Replace an invalid generated config with a valid MCP config. */ }
  const existingMcp = openCodeConfig.mcp && typeof openCodeConfig.mcp === "object" ? openCodeConfig.mcp as Record<string, unknown> : {};
  files[openCodePath] = JSON.stringify({
    ...openCodeConfig,
    mcp: { ...existingMcp, "sr-smith": { type: "local", command: ["node", "../../agente/src/mcp-server.mjs"], enabled: true, environment: { SMITH_WORKSPACE: ".", SMITH_ALLOW_SHELL: "false" } } },
  }, null, 2) + "\n";
  files[`${projectRoot}/MCP-CONFIG.md`] = "Conecta mcp.json desde esta carpeta en tu IDE. El servidor se ejecuta desde la raíz del proyecto y mantiene las herramientas de workspace dentro de este proyecto.\nShell está desactivado por defecto. Si lo activas con SMITH_ALLOW_SHELL=true, ejecutará procesos con los permisos de tu usuario; no es un sandbox del sistema operativo.\n";
  if (input.expertNote?.trim()) {
    files[`${projectRoot}/DESDE-IA.md`] = `# Notas de generación\n\n${scanUntrusted(input.expertNote).sanitized}\n`;
  }
  for (const change of input.report.changes) {
    if (!change.path.startsWith("sandbox/") || change.path.includes("..")) continue;
    files[`${base}/${change.path}`] = change.after ?? "";
  }
  return files;
}

export async function buildMissionPackage(input: MissionInput): Promise<MissionPackage> {
  const response = await fetch(SCAFFOLD_URL);
  if (!response.ok) throw new Error(`No se pudo leer el scaffolding (${response.status}).`);
  const scaffolding = new Uint8Array(await response.arrayBuffer());
  const composed = composeMissionZip(scaffolding, missionFiles(input));
  const id = input.report.executionId.replace(/[^a-z0-9_]/gi, "").slice(0, 24) || "mision";
  const buffer = composed.bytes.buffer.slice(
    composed.bytes.byteOffset,
    composed.bytes.byteOffset + composed.bytes.byteLength,
  ) as ArrayBuffer;
  return {
    blob: new Blob([buffer], { type: "application/zip" }),
    filename: `sr-smith-${id}.zip`,
    fileCount: composed.fileCount,
    bytes: composed.bytes.byteLength,
  };
}
