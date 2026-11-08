import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createApplication } from "../bootstrap/application.ts";
import { SqliteRepository } from "../persistence/repositories/index.ts";
import { startHttpServer } from "../api/http/server.ts";

interface Flags {
  command: string;
  objective?: string;
  profile?: string;
  mode?: string;
}

function parse(argv: string[]): Flags {
  const flags: Flags = { command: argv[0] ?? "help" };
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === "--objective" && next) {
      flags.objective = next;
      index += 1;
    } else if (token === "--profile" && next) {
      flags.profile = next;
      index += 1;
    } else if (token === "--mode" && next) {
      flags.mode = next;
      index += 1;
    }
  }
  return flags;
}

function help(): void {
  console.log(`Sr.Smith 1.0

Comandos:
  doctor                         Comprueba el runtime local
  demo                           Ejecuta un objetivo de referencia
  run --objective "..."          Ejecuta el ciclo y lo guarda en .dsh
  serve                          API HTTP local (127.0.0.1:8787 por defecto)
  help

Opciones de run: --profile engineering|research|autonomous|security|full|headless
                 --mode strict-local|local-runtime

Variables: SMITH_* tiene prioridad. DSH_* sigue aceptado como alias.
`);
}

async function main(): Promise<void> {
  const flags = parse(process.argv.slice(2));
  const app = createApplication();
  if (flags.command === "help" || flags.command === "--help") {
    help();
    return;
  }
  if (flags.command === "doctor") {
    const report = app.health();
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "ok") process.exitCode = 1;
    return;
  }
  if (flags.command === "serve") {
    const server = await startHttpServer();
    console.log(`Sr.Smith escuchando en ${server.url}`);
    return;
  }
  const objective =
    flags.objective ??
    (flags.command === "demo"
      ? "Implement a durable checkpoint store with checksum verification and resume."
      : "");
  if (flags.command !== "run" && flags.command !== "demo") {
    help();
    process.exitCode = 1;
    return;
  }
  if (!objective.trim()) {
    console.error("Falta --objective");
    process.exitCode = 1;
    return;
  }
  const profileId = (flags.profile ?? app.container.config.profileId) as typeof app.container.config.profileId;
  const mode = flags.mode === "local-runtime" ? "local-runtime" : "strict-local";
  const report = app.run({ objective, profileId, mode });
  const dir = resolve(app.container.config.dataDir);
  mkdirSync(dir, { recursive: true });
  const repo = new SqliteRepository(resolve(dir, "state.sqlite"));
  repo.saveExecution(report);
  repo.close();
  writeFileSync(resolve(dir, "last-report.json"), JSON.stringify(report, null, 2));
  console.log(`${report.status} ${report.executionId} tareas=${report.tasks.length} verificación=${report.verification.accepted}`);
  for (const entry of report.timeline) {
    console.log(`  [${entry.phase}] ${entry.title} — ${entry.detail}`);
  }
  if (report.status === "failed") process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
