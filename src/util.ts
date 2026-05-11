import { Config, loadConfig } from "./auth/store.js";
import { fetchChildren } from "./commands/children.js";
import { setTimezone, todayLocalDate } from "./format.js";

export function printJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value) + "\n");
}

export function failJson(payload: Record<string, unknown>, exitCode = 1): never {
  process.stderr.write(JSON.stringify(payload) + "\n");
  process.exit(exitCode);
}

export function requireToken(config: Config): asserts config is Config & { accessToken: string } {
  if (!config.accessToken) {
    failJson({ error: "no_access_token", hint: "Run: famly-parent login" }, 2);
  }
}

export async function bootstrap(): Promise<Config> {
  const config = await loadConfig();
  setTimezone(config.timezone);
  return config;
}

export async function resolveChildId(
  config: Config,
  childOpt: string | undefined,
): Promise<string> {
  if (childOpt) return childOpt;
  const children = await fetchChildren(config);
  if (children.length === 1) return children[0].id;
  if (children.length === 0) {
    failJson({ error: "no_children", hint: "Run: famly-parent children" }, 2);
  }
  failJson(
    {
      error: "multiple_children",
      hint: "Pass --child <id>",
      children: children.map((c) => ({ id: c.id, name: c.name })),
    },
    2,
  );
}

export interface DateRangeOpts {
  from?: string;
  to?: string;
  days?: number;
}

const DEFAULT_DAYS = 5;

export function resolveDateRange(opts: DateRangeOpts): { from: string; to: string } {
  const today = todayLocalDate();
  const explicit = opts.from !== undefined || opts.to !== undefined;
  const days = opts.days ?? (explicit ? undefined : DEFAULT_DAYS);
  if (days && days > 0) {
    const to = opts.to ?? today;
    const from = subtractDays(to, days - 1);
    return { from, to };
  }
  return { from: opts.from ?? today, to: opts.to ?? today };
}

function subtractDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
