import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";

export async function summaryCommand(opts: { child: string }): Promise<void> {
  const config = await bootstrap();
  requireToken(config);
  const res = await restGet<unknown>(
    config,
    `/api/v2/children/${encodeURIComponent(opts.child)}/summary`,
  );
  printJson(res);
}
