import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";
export async function whoamiCommand() {
    const config = await bootstrap();
    requireToken(config);
    const me = await restGet(config, "/api/me/me/me", {
        deviceId: config.deviceId,
    });
    printJson(me);
}
//# sourceMappingURL=whoami.js.map