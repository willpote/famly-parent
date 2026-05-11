import { fetchCalendar } from "../api/calendar.js";
import { todayLocalDate } from "../format.js";
import { bootstrap, printJson, requireToken, resolveChildId } from "../util.js";

export async function dayCommand(opts: { child?: string; date?: string }): Promise<void> {
  const config = await bootstrap();
  requireToken(config);
  const childId = await resolveChildId(config, opts.child);
  const date = opts.date ?? todayLocalDate();
  const days = await fetchCalendar(config, childId, date, date);
  printJson(days[0] ?? null);
}
