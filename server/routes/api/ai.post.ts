import { readBody, defineEventHandler } from "h3";
import { handleProviderProxy } from "../../lib/provider-proxy";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
  return handleProviderProxy(await readBody(event));
});
