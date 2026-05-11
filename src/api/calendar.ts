import { Config } from "../auth/store.js";
import { restGet } from "../client.js";

interface RawInvitee {
  type: string;
  id: string;
  title?: string;
}

interface RawMealItem {
  amount: number;
  unit?: string | null;
  unitAmount?: number | null;
  foodItem?: { title?: string };
}

interface RawEvent {
  originator: { type: string; id: string };
  invitees: RawInvitee[];
  title: string;
  subtitle?: string;
  from: string;
  to: string | null;
  embed: Record<string, unknown> & {
    type?: string;
    actionType?: string;
    diaperingType?: string;
    note?: string | null;
    occuredOn?: string;
    mealItems?: RawMealItem[];
    lastUpdatedBy?: { name?: string };
    createdBy?: { name?: string } | null;
  };
}

interface RawDay {
  day: string;
  day_localdate: string;
  events: RawEvent[];
}

interface RawCalendarResponse {
  period: { from: string; to: string };
  days: RawDay[];
}

export type EventKind =
  | "nap"
  | "meal"
  | "nappy"
  | "checkin"
  | "checkout"
  | "event"
  | "other";

export interface NapEvent {
  kind: "nap";
  start: string;
  end: string;
  durationMinutes: number;
  loggedBy?: string;
}

export interface MealEvent {
  kind: "meal";
  time: string;
  meal: string; // "Breakfast" | "Lunch" | "Afternoon Snack" | ...
  items: { food: string; amount: number }[];
  loggedBy?: string;
}

export type NappyKind = "wet" | "bm" | "wet_bm" | "dry" | "other";

export interface NappyEvent {
  kind: "nappy";
  time: string;
  diaperingType: NappyKind;
  rawType: string;
  note?: string;
  loggedBy?: string;
}

export interface CheckinEvent {
  kind: "checkin" | "checkout";
  time: string;
  location?: string;
}

export interface CalendarEvent {
  kind: "event";
  title: string;
  start: string;
  end?: string;
  audience?: string;
}

export interface OtherEvent {
  kind: "other";
  title: string;
  time: string;
  raw: RawEvent;
}

export type ParsedEvent =
  | NapEvent
  | MealEvent
  | NappyEvent
  | CheckinEvent
  | CalendarEvent
  | OtherEvent;

export interface ParsedDay {
  date: string; // YYYY-MM-DD
  naps: NapEvent[];
  meals: MealEvent[];
  nappies: NappyEvent[];
  checkins: CheckinEvent[];
  events: CalendarEvent[];
  other: OtherEvent[];
}

export async function fetchCalendar(
  config: Config,
  childId: string,
  fromDate: string,
  toDate: string,
): Promise<ParsedDay[]> {
  const res = await restGet<RawCalendarResponse[]>(config, "/api/v2/calendar", {
    type: "RANGE",
    day: fromDate,
    to: toDate,
    childId,
  });
  const period = res[0];
  if (!period) return [];
  return period.days.map(parseDay);
}

function parseDay(day: RawDay): ParsedDay {
  const out: ParsedDay = {
    date: day.day_localdate,
    naps: [],
    meals: [],
    nappies: [],
    checkins: [],
    events: [],
    other: [],
  };
  for (const ev of day.events) {
    const parsed = parseEvent(ev);
    switch (parsed.kind) {
      case "nap":
        out.naps.push(parsed);
        break;
      case "meal":
        out.meals.push(parsed);
        break;
      case "nappy":
        out.nappies.push(parsed);
        break;
      case "checkin":
      case "checkout":
        out.checkins.push(parsed);
        break;
      case "event":
        out.events.push(parsed);
        break;
      default:
        out.other.push(parsed);
    }
  }
  return out;
}

function parseEvent(ev: RawEvent): ParsedEvent {
  switch (ev.originator.type) {
    case "Famly.Daycare:Nap":
      return parseNap(ev);
    case "Famly.Daycare:MealRegistration":
      return parseMeal(ev);
    case "Famly.Daycare:Action":
      if (ev.embed.actionType === "DIAPERCHANGE") return parseNappy(ev);
      return otherEvent(ev);
    case "Famly.Daycare:ChildCheckin":
      return parseCheckin(ev);
    case "Famly.Daycare:Event":
      return {
        kind: "event",
        title: ev.title,
        start: ev.from,
        end: ev.to ?? undefined,
        audience: ev.subtitle,
      };
    default:
      return otherEvent(ev);
  }
}

function parseNap(ev: RawEvent): NapEvent {
  const start = new Date(ev.from).getTime();
  const end = ev.to ? new Date(ev.to).getTime() : start;
  return {
    kind: "nap",
    start: ev.from,
    end: ev.to ?? ev.from,
    durationMinutes: Math.round((end - start) / 60000),
    loggedBy: ev.embed.createdBy?.name,
  };
}

function parseMeal(ev: RawEvent): MealEvent {
  // title format: "<child>: <meal>" e.g. "Alex: Breakfast"
  const meal = ev.title.includes(": ") ? ev.title.split(": ").slice(1).join(": ") : ev.title;
  const items = (ev.embed.mealItems ?? []).map((m) => ({
    food: m.foodItem?.title ?? "(unknown)",
    amount: m.amount,
  }));
  return {
    kind: "meal",
    time: ev.from,
    meal,
    items,
    loggedBy: ev.embed.lastUpdatedBy?.name,
  };
}

function parseNappy(ev: RawEvent): NappyEvent {
  const raw = (ev.embed.diaperingType ?? "").toUpperCase();
  let diaperingType: NappyKind = "other";
  if (raw === "WET") diaperingType = "wet";
  else if (raw === "BM") diaperingType = "bm";
  else if (raw === "WET_BM") diaperingType = "wet_bm";
  else if (raw === "DRY") diaperingType = "dry";
  return {
    kind: "nappy",
    time: ev.embed.occuredOn ?? ev.from,
    diaperingType,
    rawType: raw,
    note: ev.embed.note ?? undefined,
    loggedBy: ev.embed.createdBy?.name,
  };
}

function parseCheckin(ev: RawEvent): CheckinEvent {
  const isOut = ev.embed.type === "CHECK_OUT";
  // title: "<time>: <child> signed into <room>" / "<time>: <child> signed out of <room>"
  const m = ev.title.match(/signed (?:into|out of) (.+)$/);
  return {
    kind: isOut ? "checkout" : "checkin",
    time: ev.from,
    location: m ? m[1] : undefined,
  };
}

function otherEvent(ev: RawEvent): OtherEvent {
  return { kind: "other", title: ev.title, time: ev.from, raw: ev };
}
