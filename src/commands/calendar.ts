import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";

export async function calendarCommand(opts: {
  child: string;
  from?: string;
  to?: string;
}): Promise<void> {
  const config = await bootstrap();
  requireToken(config);
  const today = new Date().toISOString().slice(0, 10);
  const res = await restGet<unknown>(config, "/api/v2/calendar", {
    type: "RANGE",
    day: opts.from ?? today,
    to: opts.to ?? today,
    childId: opts.child,
  });
  printJson(res);
}
