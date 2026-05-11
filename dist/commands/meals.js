import { fetchCalendar } from "../api/calendar.js";
import { bootstrap, printJson, requireToken, resolveChildId, resolveDateRange } from "../util.js";
export async function mealsCommand(opts) {
    const config = await bootstrap();
    requireToken(config);
    const childId = await resolveChildId(config, opts.child);
    const { from, to } = resolveDateRange(opts);
    const days = await fetchCalendar(config, childId, from, to);
    printJson(days.flatMap((d) => d.meals));
}
//# sourceMappingURL=meals.js.map