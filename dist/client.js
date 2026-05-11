import { randomUUID } from "node:crypto";
export const APP_BASE = "https://app.famly.co";
const PLATFORM = "famly-parent";
const VERSION = "0.1.0";
export class FamlyError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
    }
}
function baseHeaders(config, authed) {
    const headers = {
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
export async function restGet(config, path, query) {
    const url = new URL(path, APP_BASE);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v !== undefined)
                url.searchParams.set(k, String(v));
        }
    }
    const res = await fetch(url, { headers: baseHeaders(config, true) });
    return parseResponse(res);
}
export async function graphqlRequest(config, operationName, query, variables, authed = false) {
    const url = new URL(`/graphql?${operationName}`, APP_BASE);
    const res = await fetch(url, {
        method: "POST",
        headers: baseHeaders(config, authed),
        body: JSON.stringify({ operationName, variables, query }),
    });
    const json = await parseResponse(res);
    if (json.errors && json.errors.length > 0) {
        throw new FamlyError(`GraphQL error: ${JSON.stringify(json.errors)}`, res.status, json.errors);
    }
    if (!json.data) {
        throw new FamlyError("GraphQL response missing data", res.status, json);
    }
    return json.data;
}
async function parseResponse(res) {
    const text = await res.text();
    let body;
    try {
        body = text ? JSON.parse(text) : undefined;
    }
    catch {
        body = text;
    }
    if (!res.ok) {
        if (res.status === 401) {
            throw new FamlyError("Unauthorized — token missing or expired. Run: famly-parent login", 401, body);
        }
        throw new FamlyError(`HTTP ${res.status} ${res.statusText}`, res.status, body);
    }
    return body;
}
//# sourceMappingURL=client.js.map