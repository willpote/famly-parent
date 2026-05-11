import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";
const CHILD_TARGET = "Famly.Daycare:Child";
export async function fetchChildren(config) {
    const me = await restGet(config, "/api/me/me/me", {
        deviceId: config.deviceId,
    });
    return (me.roles2 ?? [])
        .filter((r) => r.targetType === CHILD_TARGET)
        .map((r) => ({
        id: r.targetId,
        name: r.title,
        site: r.subtitle,
        image: r.image,
    }));
}
export async function childrenCommand() {
    const config = await bootstrap();
    requireToken(config);
    printJson(await fetchChildren(config));
}
//# sourceMappingURL=children.js.map