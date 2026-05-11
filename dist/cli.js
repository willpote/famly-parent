import { Command } from "commander";
import { checkPermissions } from "./auth/store.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { whoamiCommand } from "./commands/whoami.js";
import { childrenCommand } from "./commands/children.js";
import { feedCommand } from "./commands/feed.js";
import { calendarCommand } from "./commands/calendar.js";
import { summaryCommand } from "./commands/summary.js";
import { napsCommand } from "./commands/naps.js";
import { mealsCommand } from "./commands/meals.js";
import { nappiesCommand } from "./commands/nappies.js";
import { dayCommand } from "./commands/day.js";
import { FamlyError } from "./client.js";
await checkPermissions();
const program = new Command();
program
    .name("famly-parent")
    .description("Unofficial CLI for parents to read their child's data from Famly. Always outputs JSON.")
    .version("0.1.0");
program
    .command("login")
    .description("Log in with Famly email + password")
    .option("--email <email>", "skip the email prompt")
    .option("--tz <iana>", "set timezone non-interactively (e.g. America/Chicago)")
    .action(wrap(loginCommand));
program
    .command("logout")
    .description("Clear the stored access token")
    .action(wrap(logoutCommand));
program
    .command("whoami")
    .description("Current user profile")
    .action(wrap(whoamiCommand));
program
    .command("children")
    .description("Children visible to the current user")
    .action(wrap(childrenCommand));
program
    .command("feed")
    .description("News-feed posts (newest first)")
    .option("--limit <n>", "max items", (v) => parseInt(v, 10))
    .option("--pages <n>", "max pages of pagination to fetch", (v) => parseInt(v, 10), 5)
    .option("--author <name>", "filter to posts whose sender name contains this string")
    .option("--mentions <name>", "filter to posts whose receivers contain this string (e.g. child or class name)")
    .action(wrap(feedCommand));
program
    .command("day")
    .description("Combined report for one day (default: today)")
    .option("--child <id>", "child id (default: only child if exactly one)")
    .option("--date <YYYY-MM-DD>", "date to fetch (default: today)")
    .action(wrap(dayCommand));
addRangeCommand("naps", "Naps with start/end and duration", napsCommand);
addRangeCommand("meals", "Meal registrations with food items and amounts", mealsCommand);
addRangeCommand("nappies", "Diaper changes with type and note", nappiesCommand);
program
    .command("calendar")
    .description("Raw calendar/activity range for a child")
    .requiredOption("--child <id>", "child id (see: famly-parent children)")
    .option("--from <YYYY-MM-DD>", "range start (default: today)")
    .option("--to <YYYY-MM-DD>", "range end (default: today)")
    .action(wrap(calendarCommand));
program
    .command("summary")
    .description("Raw per-child summary")
    .requiredOption("--child <id>", "child id")
    .action(wrap(summaryCommand));
await program.parseAsync(process.argv);
function addRangeCommand(name, desc, fn) {
    program
        .command(name)
        .description(desc)
        .option("--child <id>", "child id (default: only child if exactly one)")
        .option("--from <YYYY-MM-DD>", "range start (default: today - 4 days)")
        .option("--to <YYYY-MM-DD>", "range end (default: today)")
        .option("--days <n>", "shortcut: last N days ending at --to (default: 5)", (v) => parseInt(v, 10))
        .action(wrap(fn));
}
function wrap(fn) {
    return async (opts) => {
        try {
            await fn(opts);
        }
        catch (err) {
            if (err instanceof FamlyError) {
                const payload = { error: err.message };
                if (err.status !== undefined)
                    payload.status = err.status;
                if (process.env.FAMLY_DEBUG && err.body !== undefined)
                    payload.body = err.body;
                process.stderr.write(JSON.stringify(payload) + "\n");
                process.exit(1);
            }
            process.stderr.write(JSON.stringify({ error: err.message ?? String(err) }) + "\n");
            process.exit(1);
        }
    };
}
//# sourceMappingURL=cli.js.map