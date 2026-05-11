import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";

export async function whoamiCommand(): Promise<void> {
  const config = await bootstrap();
  requireToken(config);
  const me = await restGet<unknown>(config, "/api/me/me/me", {
    deviceId: config.deviceId,
  });
  printJson(me);
}
