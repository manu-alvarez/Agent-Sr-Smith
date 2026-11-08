import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createApplication } from "../../bootstrap/application.ts";
import type { ProfileId, RunInput } from "../../core/domain/index.ts";
import { PROFILES } from "../../agents/profiles/index.ts";
import { MODULES } from "../../meta/modules.ts";

export interface HttpServer {
  url: string;
  close(): Promise<void>;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

const PROFILE_IDS = new Set(PROFILES.map((profile) => profile.id));

export function startHttpServer(env?: Record<string, string | undefined>): Promise<HttpServer> {
  const app = createApplication(env);
  const host = app.container.config.httpHost;
  const port = app.container.config.httpPort;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://${host}:${port}`);
      if (req.method === "GET" && url.pathname === "/health") {
        send(res, 200, app.health());
        return;
      }
      if (req.method === "GET" && url.pathname === "/v1/profiles") {
        send(res, 200, PROFILES);
        return;
      }
      if (req.method === "GET" && url.pathname === "/v1/modules") {
        send(res, 200, MODULES);
        return;
      }
      if (req.method === "POST" && url.pathname === "/v1/runs") {
        const raw = await readBody(req);
        const body = raw ? (JSON.parse(raw) as Partial<RunInput>) : {};
        if (!body.objective || typeof body.objective !== "string") {
          send(res, 400, { error: { code: "invalid_objective", message: "objective es obligatorio" } });
          return;
        }
        if (body.profileId && !PROFILE_IDS.has(body.profileId)) {
          send(res, 400, { error: { code: "invalid_profile", message: "perfil desconocido" } });
          return;
        }
        const report = app.run({
          objective: body.objective,
          profileId: body.profileId as ProfileId | undefined,
          mode: body.mode,
          approvals: body.approvals,
          projectId: body.projectId,
        });
        send(res, report.status === "failed" && report.tasks.length === 0 ? 422 : 200, report);
        return;
      }
      send(res, 404, { error: { code: "not_found", message: "Ruta no registrada" } });
    } catch (error) {
      send(res, 500, {
        error: { code: "internal_error", message: error instanceof Error ? error.message : String(error) },
      });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actual = typeof address === "object" && address ? address.port : port;
      resolve({
        url: `http://${host}:${actual}`,
        close: () =>
          new Promise((done, fail) => {
            server.close((error) => (error ? fail(error) : done()));
          }),
      });
    });
  });
}
