import { randomUUID } from "node:crypto";
import { Config } from "./auth/store.js";

export const APP_BASE = "https://app.famly.co";

const PLATFORM = "famly-parent";
const VERSION = "0.1.0";

export class FamlyError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

function baseHeaders(config: Config, authed: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json, */*",
    "content-type": "application/json",
    "x-famly-installationid": config.installationId,
    "x-famly-platform": PLATFORM,
    "x-famly-version": VERSION,
    "x-famly-request-uuid": randomUUID(),
    "user-agent": `famly-parent/${VERSION}`,
  };
  if (authed && config.accessToken) {
    headers["x-famly-accesstoken"] = config.accessToken;
  }
  return headers;
}

export async function restGet<T>(
  config: Config,
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(path, APP_BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, { headers: baseHeaders(config, true) });
  return parseResponse<T>(res);
}

export async function graphqlRequest<T>(
  config: Config,
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  authed = false,
): Promise<T> {
  const url = new URL(`/graphql?${operationName}`, APP_BASE);
  const res = await fetch(url, {
    method: "POST",
    headers: baseHeaders(config, authed),
    body: JSON.stringify({ operationName, variables, query }),
  });
  const json = await parseResponse<{ data?: T; errors?: unknown[] }>(res);
  if (json.errors && json.errors.length > 0) {
    throw new FamlyError(
      `GraphQL error: ${JSON.stringify(json.errors)}`,
      res.status,
      json.errors,
    );
  }
  if (!json.data) {
    throw new FamlyError("GraphQL response missing data", res.status, json);
  }
  return json.data;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new FamlyError(
        "Unauthorized — token missing or expired. Run: famly-parent login",
        401,
        body,
      );
    }
    throw new FamlyError(
      `HTTP ${res.status} ${res.statusText}`,
      res.status,
      body,
    );
  }
  return body as T;
}
