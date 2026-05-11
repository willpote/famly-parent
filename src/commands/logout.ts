import { clearToken } from "../auth/store.js";
import { printJson } from "../util.js";

export async function logoutCommand(): Promise<void> {
  await clearToken();
  printJson({ status: "ok" });
}
