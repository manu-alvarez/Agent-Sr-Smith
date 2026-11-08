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
  });
  const framework = FRAMEWORKS.find((item) => item.id === input.framework)?.label ?? input.framework;
  const ide = IDES.filter((item) => input.ide.includes(item.id))
    .map((item) => item.label)
    .join(", ");
  const phones = MOBILE_APPS.filter((item) => input.mobile?.includes(item.id));
  const projectRoot = `sr-smith/proyectos/${starter.slug}`;
  const tasks = input.report.tasks
    .map(
      (task, index) =>
        `${index + 1}. ${task.title} [${task.status}]\n   Rol: ${task.assignedRole ?? "sin asignar"}\n   Operación: ${task.operation}\n   Criterios: ${task.acceptanceCriteria.join(" | ")}`,
    )
    .join("\n");
  const reportJson = scanUntrusted(JSON.stringify(input.report, null, 2)).sanitized;
  const files: Record<string, string> = {
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
  for (const [path, content] of Object.entries(starter.files)) {
    files[`${projectRoot}/${path}`] = content;
  }
  if (input.expertNote?.trim()) {
    files[`${projectRoot}/DESDE-OLLAMA.md`] = `# Redactado por el modelo\n\n${scanUntrusted(input.expertNote).sanitized}\n`;
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
