import { getPublicOrigin } from "@/lib/oauth/config";

export class AdminApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function callAdminApi<T>({
  path,
  token,
  method = "GET",
  body,
}: {
  path: string;
  token: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}): Promise<T> {
  if (!path.startsWith("/api/admin/")) {
    throw new Error("MCP tools may only call portfolio admin APIs");
  }

  const response = await fetch(`${getPublicOrigin()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : `Admin API returned ${response.status}`;
    throw new AdminApiError(message, response.status, payload);
  }
  return payload as T;
}
