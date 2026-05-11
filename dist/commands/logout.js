import { clearToken } from "../auth/store.js";
import { printJson } from "../util.js";
export async function logoutCommand() {
    await clearToken();
    printJson({ status: "ok" });
}
//# sourceMappingURL=logout.js.map