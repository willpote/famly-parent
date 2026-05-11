import { Config } from "../auth/store.js";
import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";

interface MeRole {
  targetId: string;
  targetType: string;
  title: string;
  subtitle?: string;
  image?: string;
}

interface MeResponse {
  roles2?: MeRole[];
}

const CHILD_TARGET = "Famly.Daycare:Child";

export interface Child {
  id: string;
  name: string;
  site?: string;
  image?: string;
}

export async function fetchChildren(config: Config): Promise<Child[]> {
  const me = await restGet<MeResponse>(config, "/api/me/me/me", {
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

export async function childrenCommand(): Promise<void> {
  const config = await bootstrap();
  requireToken(config);
  printJson(await fetchChildren(config));
}
