import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";
export async function summaryCommand(opts) {
    const config = await bootstrap();
    requireToken(config);
    const res = await restGet(config, `/api/v2/children/${encodeURIComponent(opts.child)}/summary`);
    printJson(res);
}
//# sourceMappingURL=summary.js.map