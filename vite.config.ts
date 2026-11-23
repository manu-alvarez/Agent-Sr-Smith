import { readdirSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";
import { handleProviderProxy } from "./server/lib/provider-proxy.ts";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function ollamaProxyPlugin(): Plugin {
  const defaultUpstream = process.env.OLLAMA_UPSTREAM ?? "http://localhost:11434";
  const proxyAddress = process.env.OLLAMA_HTTP_PROXY;
  const proxy = proxyAddress ? new URL(proxyAddress) : null;
  if (proxy && (proxy.protocol !== "http:" || proxy.username || proxy.password)) throw new Error("OLLAMA_HTTP_PROXY must be an unauthenticated HTTP proxy URL.");
  return {
    name: "sr-smith:ollama-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/ollama-proxy/")) {
          next();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          const body = Buffer.concat(chunks);
          const requestedHost = String(req.headers["x-smith-ollama-host"] ?? defaultUpstream);
          let upstream: URL;
          try {
            upstream = new URL(requestedHost);
            const host = upstream.hostname;
            const privateIpv4 =
              /^10\./.test(host) ||
              /^192\.168\./.test(host) ||
              /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
              /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(host) ||
              /^127\./.test(host);
            if (upstream.protocol !== "http:" || upstream.username || upstream.password || !(host === "localhost" || host.endsWith(".local") || privateIpv4)) {
              throw new Error("Ollama upstream must be a local, private or Tailscale address.");
            }
          } catch {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "invalid_ollama_host" }));
            return;
          }
          const target = new URL(url.slice("/ollama-proxy".length), upstream);
          const localTarget = upstream.hostname === "localhost" || upstream.hostname === "127.0.0.1" || upstream.hostname === "::1";
          const useHttpProxy = !localTarget && proxy !== null;
          const preq = http.request(
            {
              host: useHttpProxy ? proxy!.hostname : upstream.hostname,
              port: useHttpProxy ? Number(proxy!.port || 80) : Number(upstream.port || 11434),
              method: req.method,
              path: useHttpProxy ? target.toString() : target.pathname + target.search,
              headers: {
                host: target.host,
                "content-type": req.headers["content-type"] ?? "application/json",
                "content-length": body.length,
              },
            },
            (pres) => {
              res.statusCode = pres.statusCode ?? 502;
              const type = pres.headers["content-type"];
              if (type) res.setHeader("content-type", type);
              pres.pipe(res);
            },
          );
          preq.on("error", () => {
            res.statusCode = 502;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "sin ruta a Ollama" }));
          });
          preq.end(body);
        });
      });
    },
  };
}

function providerApiProxyPlugin(): Plugin {
  return {
    name: "sr-smith:provider-api-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url ?? "").split("?", 1)[0] !== "/api/ai") { next(); return; }
        if ((req.method ?? "GET").toUpperCase() !== "POST") { res.statusCode = 405; res.end(); return; }
        const origin = req.headers.origin;
        if (origin) {
          try { if (new URL(origin).host !== String(req.headers.host ?? "")) { res.statusCode = 403; res.end(); return; } }
          catch { res.statusCode = 403; res.end(); return; }
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size <= 100_000) chunks.push(chunk);
        });
        req.on("end", async () => {
          if (size > 100_000) { res.statusCode = 413; res.end(); return; }
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            const response = await handleProviderProxy(payload);
            res.statusCode = response.status;
            res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
            res.setHeader("cache-control", "no-store");
            res.end(await response.text());
          } catch {
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "invalid_provider_request" }));
          }
        });
      });
    },
  };
}
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          );
          const proto = String(
            req.headers["x-forwarded-proto"] ??
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http"),
          );
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Ensure Host is the public preview host so Better Auth's dynamic
          // baseURL / redirect_uri match the popup origin.
          if (!requestHeaders.has("host")) requestHeaders.set("host", host);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

const pages = process.env.GITHUB_PAGES === "1";

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  base: pages ? "/Agent-Sr-Smith/" : "/",
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    pgliteBootstrapPlugin(),
    ollamaProxyPlugin(),
    providerApiProxyPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    // GitHub Pages is a static host and cannot serve that middleware.
    ...(pages ? [] : [grokPwaPlugin()]),
    tailwindcss(),
    tanstackStart(
      pages
        ? {
            prerender: { enabled: true, crawlLinks: false },
            pages: [{ path: "/", prerender: { outputPath: ".output/public.html" } }],
          }
        : undefined,
    ),
    ...(command === "build" || isPreview
      ? pages
        ? []
        : [
            nitro({
              preset: "vercel",
              // Auto-registers server/middleware/* (the PWA install page +
              // manifest + head-tag middleware). Nitro v3 defaults serverDir to
              // false, so removing this silently unwires /?install=1 on deploys.
              serverDir: "./server",
            }),
          ]
      : []),
    viteReact(),
  ],
}));
