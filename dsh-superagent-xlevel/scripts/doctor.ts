import { createApplication } from "../src/bootstrap/application.ts";
import { existsSync } from "node:fs";

const app = createApplication();
const report = app.health();
const required = ["schemas/orchestration/task.schema.json", "src/public.ts", "README.md"];
const missing = required.filter((path) => !existsSync(path));
const ok = report.status === "ok" && missing.length === 0 && Number(process.versions.node.split(".")[0]) >= 22;
console.log(JSON.stringify({ ...report, node: process.versions.node, missing, ok }, null, 2));
if (!ok) process.exitCode = 1;
