export const FRAMEWORKS = [
  {
    id: "cli",
    label: "Un comando",
    summary: "Un programa que se lanza en la terminal.",
    fits: "Cuando quieres escribir una orden y ver el resultado ahí mismo.",
    result: "npm start imprime el nombre y el objetivo. npm test comprueba que lo hace.",
  },
  {
    id: "api",
    label: "Un servidor en tu máquina",
    summary: "Una dirección web local a la que se le piden datos.",
    fits: "Cuando el navegador u otro programa tiene que llamar a este proyecto.",
    result: "npm start abre http://127.0.0.1:8788. La página de inicio devuelve el objetivo y /health dice si está vivo.",
  },
  {
    id: "library",
    label: "Una función para importar",
    summary: "Código que otro programa usa. No se abre solo.",
    fits: "Cuando esto es una pieza, no una aplicación ni un comando.",
    result: "Exporta createCard. npm test la comprueba. npm start solo muestra el resultado.",
  },
] as const;

export const IDES = [
  { id: "opencode", label: "OpenCode", summary: "opencode.json, agente y skill en .opencode/." },
  { id: "codex", label: "Codex", summary: "Lee AGENTS.md." },
  { id: "antigravity", label: "Antigravity", summary: "Lee AGENTS.md, GEMINI.md y .agents/rules." },
  { id: "windsurf", label: "Windsurf", summary: "Lee AGENTS.md." },
  { id: "copilot", label: "Copilot", summary: "Lee AGENTS.md y .github/copilot-instructions.md." },
  { id: "cline", label: "Cline", summary: "Lee AGENTS.md y .clinerules/." },
  { id: "trae", label: "Trae", summary: "Lee AGENTS.md y .trae/rules/." },
  { id: "claude", label: "Claude Code", summary: "Lee CLAUDE.md. Si existe, no usa AGENTS.md." },
  { id: "gemini", label: "Gemini CLI", summary: "Lee GEMINI.md." },
  { id: "cursor", label: "Cursor", summary: "Lee .cursor/rules y también AGENTS.md." },
  { id: "continue", label: "Continue", summary: "Lee .continue/rules." },
  { id: "vscode", label: "VS Code", summary: "Tareas y depuración en .vscode. No es un agente." },
] as const;

export const IDE_GROUPS = [
  {
    id: "agents",
    label: "AGENTS.md",
    members: "OpenCode, Codex, Antigravity, Windsurf, Copilot, Cline y Trae",
    ides: ["opencode", "codex", "antigravity", "windsurf", "copilot", "cline", "trae"],
    files: "AGENTS.md, y la carpeta propia de cada uno",
  },
  {
    id: "claude",
    label: "Claude Code",
    members: "Claude Code",
    ides: ["claude"],
    files: "CLAUDE.md",
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    members: "Gemini CLI y Antigravity también lo leen",
    ides: ["gemini"],
    files: "GEMINI.md",
  },
  {
    id: "cursor",
    label: "Cursor",
    members: "Cursor",
    ides: ["cursor"],
    files: ".cursor/rules/proyecto.mdc",
  },
  {
    id: "editor",
    label: "Editor",
    members: "VS Code y Continue",
    ides: ["vscode", "continue"],
    files: ".vscode/ y .continue/rules/",
  },
] as const;

export const MOBILE_APPS = [
  {
    id: "pocketpal",
    label: "PocketPal",
    file: "movil/pocketpal.pal.json",
    summary: "Un Pal asistente. PocketPal no abre carpetas: pega systemPrompt en Pals, o adjunta el JSON si tu versión lo permite.",
  },
  {
    id: "locally",
    label: "Locally",
    file: "movil/locally.md",
    summary: "Locally AI no compila. Adjunta este markdown al chat o úsalo como instrucción del sistema.",
  },
  {
    id: "enchanted",
    label: "Enchanted",
    file: "movil/enchanted.md",
    summary: "Enchanted guarda un system prompt por conversación. Pega este archivo ahí, o adjúntalo si el chat acepta documentos.",
  },
  {
    id: "lobehub",
    label: "LobeHub",
    file: "movil/lobehub.agent.json",
    summary: "Agente en el formato del índice de LobeHub. Importa el JSON o pega config.systemRole.",
  },
  {
    id: "edge",
    label: "Edge Gallery",
    file: "movil/edge-gallery.md",
    summary: "Edge Gallery importa modelos .task, no proyectos. Este archivo es el prompt para pegar en LLM Chat.",
  },
] as const;

export type FrameworkId = (typeof FRAMEWORKS)[number]["id"];
export type IdeId = (typeof IDES)[number]["id"];
export type MobileId = (typeof MOBILE_APPS)[number]["id"];

export interface StarterInput {
  name: string;
  objective: string;
  framework: FrameworkId;
  ide: IdeId[];
  mobile?: MobileId[];
  /** computer mezcla IDE y código. mobile solo entrega el archivo de cada app. */
  surface?: "computer" | "mobile";
}

export function projectSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "mi-proyecto";
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function packageJson(slug: string, framework: FrameworkId): string {
  const start =
    framework === "api"
      ? "node --experimental-strip-types src/server.ts"
      : framework === "library"
        ? "node --experimental-strip-types src/index.ts"
        : "node --experimental-strip-types src/main.ts";
  return json({
    name: slug,
    version: "1.0.0",
    private: true,
    type: "module",
    engines: { node: ">=22" },
    scripts: {
      start,
      test: "node --experimental-strip-types --test src/*.test.ts",
    },
    devDependencies: {
      "@types/node": "^22.16.5",
      typescript: "^5.7.0",
    },
  });
}

const TSCONFIG = json({
  compilerOptions: {
    target: "ES2022",
    module: "NodeNext",
    moduleResolution: "NodeNext",
    strict: true,
    noEmit: true,
    types: ["node"],
    skipLibCheck: true,
  },
  include: ["src"],
});

function quoted(value: string): string {
  return JSON.stringify(value);
}

function cliSources(slug: string, objective: string): Record<string, string> {
  return {
    "src/main.ts": `export function describeProject(name: string, objective: string): string {
  const title = name.trim();
  const goal = objective.trim();
  if (!title || !goal) throw new Error("El proyecto necesita nombre y objetivo.");
  return title + ": " + goal;
}

import { pathToFileURL } from "node:url";

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  console.log(describeProject(${quoted(slug)}, ${quoted(objective)}));
}
`,
    "src/main.test.ts": `import assert from "node:assert/strict";
import test from "node:test";
import { describeProject } from "./main.ts";

test("describe el proyecto elegido", () => {
  const text = describeProject(${quoted(slug)}, ${quoted(objective)});
  assert.match(text, new RegExp(${quoted(slug)}));
  assert.match(text, /\\S/);
});

test("rechaza un nombre vacío", () => {
  assert.throws(() => describeProject("  ", ${quoted(objective)}));
});
`,
  };
}

function apiSources(slug: string, objective: string): Record<string, string> {
  return {
    "src/app.ts": `export interface Reply {
  status: number;
  body: string;
}

export function handle(url: string, name: string, objective: string): Reply {
  if (url === "/health") return { status: 200, body: JSON.stringify({ ok: true, name }) };
  if (url === "/") return { status: 200, body: JSON.stringify({ name, objective }) };
  return { status: 404, body: JSON.stringify({ error: "not_found" }) };
}
`,
    "src/server.ts": `import { createServer } from "node:http";
import { handle } from "./app.ts";

const name = ${quoted(slug)};
const objective = ${quoted(objective)};
const port = Number(process.env.PORT ?? 8788);
const server = createServer((request, response) => {
  const reply = handle(request.url ?? "/", name, objective);
  response.writeHead(reply.status, { "content-type": "application/json; charset=utf-8" });
  response.end(reply.body);
});

server.listen(port, "127.0.0.1", () => {
  console.log("http://127.0.0.1:" + port);
});
`,
    "src/app.test.ts": `import assert from "node:assert/strict";
import test from "node:test";
import { handle } from "./app.ts";

test("la raíz devuelve el objetivo", () => {
  const reply = handle("/", ${quoted(slug)}, ${quoted(objective)});
  assert.equal(reply.status, 200);
  assert.equal(JSON.parse(reply.body).name, ${quoted(slug)});
});

test("una ruta desconocida responde 404", () => {
  assert.equal(handle("/no", ${quoted(slug)}, ${quoted(objective)}).status, 404);
});
`,
  };
}

function librarySources(slug: string, objective: string): Record<string, string> {
  return {
    "src/index.ts": `export interface ProjectCard {
  name: string;
  objective: string;
  ready: true;
}

export function createCard(name: string, objective: string): ProjectCard {
  const title = name.trim();
  const goal = objective.trim();
  if (!title || !goal) throw new Error("El proyecto necesita nombre y objetivo.");
  return { name: title, objective: goal, ready: true };
}

import { pathToFileURL } from "node:url";

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  console.log(JSON.stringify(createCard(${quoted(slug)}, ${quoted(objective)})));
}
`,
    "src/index.test.ts": `import assert from "node:assert/strict";
import test from "node:test";
import { createCard } from "./index.ts";

test("la tarjeta queda lista", () => {
  const card = createCard(${quoted(slug)}, ${quoted(objective)});
  assert.equal(card.ready, true);
  assert.equal(card.name, ${quoted(slug)});
});
`,
  };
}

function selected(input: StarterInput, id: IdeId): boolean {
  return input.ide.includes(id);
}

function instructions(slug: string, objective: string): string {
  return `# ${slug}

Objetivo: ${objective}

Trabaja solo dentro de esta carpeta. No inventes servicios, claves ni archivos que este paquete no tiene. No añadas dependencias que no estén en package.json.

Comandos reales:

\`\`\`bash
npm install
npm test
npm start
\`\`\`
`;
}

function ideFiles(input: StarterInput, slug: string): Record<string, string> {
  const files: Record<string, string> = {};
  const objective = input.objective.trim();
  const guide = instructions(slug, objective);
  if (selected(input, "opencode") || selected(input, "codex") || selected(input, "antigravity") || selected(input, "windsurf") || selected(input, "copilot") || selected(input, "cline") || selected(input, "trae") || selected(input, "cursor")) {
    files["AGENTS.md"] = guide;
  }
  if (selected(input, "opencode")) {
    files["opencode.json"] = json({
      $schema: "https://opencode.ai/config.json",
      instructions: ["AGENTS.md"],
      command: {
        test: {
          description: "Ejecuta las pruebas de este proyecto",
          template: "Ejecuta `npm test`. Si falla, corrige solo el fallo que muestre la prueba. No añadas dependencias.",
          agent: "build",
        },
        start: {
          description: "Arranca este proyecto",
          template: "Ejecuta `npm start` y resume la salida. No cambies el puerto ni inventes rutas.",
          agent: "build",
        },
      },
    });
    files[".opencode/agents/builder.md"] = `---
description: Construye ${slug} sin salir del paquete
mode: primary
---

${guide}
`;
    files[".opencode/commands/test.md"] = `---
description: Ejecuta npm test
agent: build
---

Ejecuta \`npm test\` en este proyecto. Si falla, corrige solo el fallo que muestre la prueba. No añadas dependencias.
`;
    files[".opencode/skills/proyecto/SKILL.md"] = `---
name: proyecto
description: Límites y comandos del proyecto ${slug}
---

${guide}
`;
  }
  if (selected(input, "claude")) {
    files["CLAUDE.md"] = guide;
    files[".claude/settings.json"] = json({
      permissions: {
        allow: ["Bash(npm install)", "Bash(npm test)", "Bash(npm start)"],
      },
    });
  }
  if (selected(input, "vscode")) {
    files[".vscode/tasks.json"] = json({
      version: "2.0.0",
      tasks: [
        { label: "test", type: "shell", command: "npm test", group: { kind: "test", isDefault: true }, problemMatcher: [] },
        { label: "start", type: "shell", command: "npm start", group: "none", problemMatcher: [] },
      ],
    });
    files[".vscode/launch.json"] = json({
      version: "0.2.0",
      configurations: [
        {
          type: "node",
          request: "launch",
          name: input.framework === "api" ? "API" : "Start",
          runtimeArgs: ["--experimental-strip-types"],
          program:
            input.framework === "api"
              ? "${workspaceFolder}/src/server.ts"
              : input.framework === "library"
                ? "${workspaceFolder}/src/index.ts"
                : "${workspaceFolder}/src/main.ts",
          cwd: "${workspaceFolder}",
          skipFiles: ["<node_internals>/**"],
        },
      ],
    });
    files[".vscode/settings.json"] = json({
      "files.exclude": { node_modules: true },
    });
  }
  if (selected(input, "cursor")) {
    files[".cursor/rules/proyecto.mdc"] = `---
description: Proyecto ${slug} generado por Sr.Smith
alwaysApply: true
---

${guide}
`;
  }
  if (selected(input, "antigravity") || selected(input, "gemini")) {
    files["GEMINI.md"] = guide;
    files[".agents/rules/proyecto.md"] = guide;
  }
  if (selected(input, "trae")) files[".trae/rules/proyecto.md"] = guide;
  if (selected(input, "cline")) files[".clinerules/proyecto.md"] = guide;
  if (selected(input, "copilot")) files[".github/copilot-instructions.md"] = guide;
  if (selected(input, "continue")) files[".continue/rules/proyecto.md"] = guide;
  return files;
}

function projectBrief(slug: string, objective: string, framework: FrameworkId, sources: Record<string, string>): string {
  const listing = Object.keys(sources)
    .sort()
    .map((path) => `- ${path}`)
    .join("\n");
  const bodies = Object.entries(sources)
    .filter(([path]) => path.startsWith("src/") || path === "package.json")
    .map(([path, content]) => `### ${path}\n\n\`\`\`\n${content.trim()}\n\`\`\``)
    .join("\n\n");
  return `Proyecto: ${slug}
Objetivo: ${objective}
Forma: ${framework}

No inventes servicios, claves ni dependencias. El código de abajo es el que hay que cambiar. En el ordenador, dentro de esta carpeta: npm install, npm test, npm start. En el móvil no se ejecutan esos comandos: propones el diff y el usuario lo aplica.

Archivos:
${listing}

${bodies}
`;
}

function mobileFiles(input: StarterInput, slug: string, sources: Record<string, string>): Record<string, string> {
  const chosen = MOBILE_APPS.filter((item) => input.mobile?.includes(item.id));
  if (chosen.length === 0) return {};
  const objective = input.objective.trim();
  const brief = projectBrief(slug, objective, input.framework, sources);
  const files: Record<string, string> = {};
  for (const app of chosen) {
    if (app.id === "pocketpal") {
      const systemPrompt = `Eres el asistente de desarrollo de ${slug}.\n\n${brief}`;
      files[app.file] = json({
        type: "assistant",
        name: slug,
        description: objective.slice(0, 180),
        systemPrompt,
        originalSystemPrompt: systemPrompt,
        isSystemPromptChanged: false,
        useAIPrompt: false,
        parameterSchema: [],
        source: "local",
        capabilities: { tools: true },
        parameters: {
          provider: "ollama",
          baseUrl: "http://100.100.2.10:11434",
          model: "gemma4:latest",
        },
      });
    } else if (app.id === "lobehub") {
      files[app.file] = json({
        author: "Sr.Smith",
        identifier: slug,
        locale: "es-ES",
        config: {
          systemRole: `Eres el agente de ${slug}. Trabajas el código que viene en este rol.\n\n${brief}`,
        },
        meta: {
          avatar: "🟢",
          title: slug,
          description: objective.slice(0, 180),
          tags: ["sr-smith", input.framework],
        },
      });
    } else {
      const where =
        app.id === "locally"
          ? "Locally AI: adjunta este archivo al chat o pégalo como instrucción del sistema."
          : app.id === "enchanted"
            ? "Enchanted: pega este archivo en el system prompt de la conversación."
            : "Edge Gallery: abre LLM Chat y pega este archivo como primer mensaje. La app no importa proyectos.";
      files[app.file] = `# ${slug} para ${app.label}\n\n${where}\n\n${brief}`;
    }
  }
  return files;
}

export function starterFiles(input: StarterInput): { slug: string; files: Record<string, string> } {
  if (input.surface === "mobile") return mobileSurface(input);
  const slug = projectSlug(input.name);
  const objective = input.objective.trim();
  const sources =
    input.framework === "api" ? apiSources(slug, objective) : input.framework === "library" ? librarySources(slug, objective) : cliSources(slug, objective);
  const framework = FRAMEWORKS.find((item) => item.id === input.framework) ?? FRAMEWORKS[0];
  const chosen = IDES.filter((item) => input.ide.includes(item.id));
  const phones = MOBILE_APPS.filter((item) => input.mobile?.includes(item.id));
  const ideLabel = chosen.map((item) => item.label).join(", ") || "OpenCode";
  const ideFilesHint = [
    input.ide.includes("opencode") ? "`opencode.json`, `.opencode/` y `AGENTS.md`" : "",
    input.ide.includes("claude") ? "`CLAUDE.md`" : "",
    input.ide.includes("codex") && !input.ide.includes("opencode") ? "`AGENTS.md`" : "",
    input.ide.includes("cursor") ? "`.cursor/rules/proyecto.mdc`" : "",
    input.ide.includes("vscode") ? "`.vscode/`" : "",
  ]
    .filter(Boolean)
    .join(", ");
  const readme = `# ${slug}

${framework.summary}

Objetivo: ${objective}

## Entorno

Abre esta carpeta (\`sr-smith/proyectos/${slug}\`) con ${ideLabel}. Archivos: ${ideFilesHint}.
${input.ide.includes("opencode") ? "\nOpenCode es el entorno principal: `opencode` en esta carpeta lee `opencode.json` y `AGENTS.md`.\n" : ""}
## Framework

Este directorio es el proyecto. No depende del plano de control para ejecutarse.

\`\`\`bash
npm install
npm test
npm start
\`\`\`

${input.framework === "api" ? "La API escucha en http://127.0.0.1:8788. \`PORT\` cambia el puerto.\n" : ""}${
    phones.length
      ? `## Móvil\n\n${phones.map((item) => `- ${item.label}: \`${item.file}\`. ${item.summary}`).join("\n")}\n\n`
      : ""
  }## CLI del plano de control

Desde la raíz \`sr-smith/\`, no desde aquí:

\`\`\`bash
npm install
npm test
node --experimental-strip-types src/cli/index.ts doctor
\`\`\`
`;
  const files: Record<string, string> = {
    "package.json": packageJson(slug, input.framework),
    "tsconfig.json": TSCONFIG,
    ".gitignore": "node_modules/\ndist/\n",
    "README.md": readme,
    ...sources,
    ...ideFiles({ ...input, objective }, slug),
    ...mobileFiles({ ...input, objective }, slug, {
      "package.json": packageJson(slug, input.framework),
      ...sources,
    }),
  };
  const skill = files[".opencode/skills/proyecto/SKILL.md"] ?? files["AGENTS.md"] ?? files["CLAUDE.md"];
  if (skill) {
    files[".agents/skills/proyecto/SKILL.md"] = skill;
    files[".grok/skills/proyecto/SKILL.md"] = skill;
    if (input.ide.includes("claude")) files[".claude/skills/proyecto/SKILL.md"] = skill;
    if (input.ide.includes("cursor")) files[".cursor/skills/proyecto/SKILL.md"] = skill;
  }
  const standing = files["AGENTS.md"] ?? files["CLAUDE.md"];
  if (standing) files["GEMINI.md"] = standing;
  files["mcp.json"] = json({
    mcpServers: {},
    note: "Aquí se declara un servidor MCP cuando el proyecto tenga uno. Este archivo no lleva secretos.",
  });
  files["evals/aceptacion.json"] = json({
    cases: [
      { id: "objetivo", check: "El resultado nombra el objetivo", expect: objective.slice(0, 160) },
      { id: "pruebas", check: "npm test termina en cero", expect: "exit 0" },
      { id: "arranque", check: "npm start hace lo que dice el README", expect: framework.result },
    ],
  });
  if (input.framework === "api") {
    files["DESIGN.md"] = `# ${slug}\n\nUna página de texto en la raíz y \`/health\`. Sin marca nueva ni assets.\n`;
    files["llms.txt"] = `# ${slug}\n\n> ${objective}\n\n- [README](README.md)\n`;
  }
  return { slug, files };
}

function mobileSurface(input: StarterInput): { slug: string; files: Record<string, string> } {
  const slug = projectSlug(input.name);
  const objective = input.objective.trim();
  const nested = mobileFiles({ ...input, objective, framework: input.framework }, slug, {
    "README.md": `# ${slug}\n\n${objective}\n`,
  });
  const files: Record<string, string> = {
    "LEEME.md": `# ${slug} en el móvil\n\nCada archivo es para una app. El teléfono no ejecuta npm ni abre esta carpeta.\nEl modelo remoto, si la app lo permite, es gemma4:latest en http://100.100.2.10:11434.\n`,
  };
  for (const [path, content] of Object.entries(nested)) {
    files[path.replace(/^movil\//, "")] = content;
  }
  return { slug, files };
}
