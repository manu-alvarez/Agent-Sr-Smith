export const MCP_STATUS = "contract" as const;

export interface McpSession {
  server: string;
  protocol: "mcp";
  connected: false;
  reason: string;
}

export function describeMcp(server: string): McpSession {
  return {
    server,
    protocol: "mcp",
    connected: false,
    reason: "El cliente MCP no se abre en el scaffolding. El manifiesto sí se normaliza.",
  };
}
