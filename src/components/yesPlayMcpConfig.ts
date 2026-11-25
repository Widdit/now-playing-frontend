export const MIN_MCP_PORT = 1024;
export const MAX_MCP_PORT = 65535;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function parseUrl(value: unknown): URL | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export function parseYesPlayMcpConfig(text: string) {
  const config = asRecord(JSON.parse(text));
  const server = asRecord(asRecord(config?.mcpServers)?.yesplaymusic);
  const url = parseUrl(server?.url);
  const port = Number(url?.port);

  if (
    !url ||
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.pathname !== "/mcp" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    port < MIN_MCP_PORT ||
    port > MAX_MCP_PORT
  ) {
    throw new Error("请复制 YesPlayMusic 的本机 Streamable HTTP JSON 配置");
  }

  const headers = asRecord(server?.headers);
  const auth = Object.entries(headers ?? {}).find(
    ([key]) => key.toLowerCase() === "authorization",
  );

  if (!auth) return { port, token: "" };

  const token =
    typeof auth[1] === "string" &&
    /^Bearer\s+([A-Za-z0-9._~+/\-]+=*)$/i.exec(auth[1].trim());

  if (!token) throw new Error("Authorization 必须是有效的 Bearer Token");

  return { port, token: token[1] };
}
