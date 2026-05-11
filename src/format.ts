let currentTz: string = systemTimezone();
let dateFmt = buildDateFmt(currentTz);

export function systemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function setTimezone(tz: string | undefined): void {
  const next = tz && isValidTimezone(tz) ? tz : systemTimezone();
  if (next === currentTz) return;
  currentTz = next;
  dateFmt = buildDateFmt(currentTz);
}

export function getTimezone(): string {
  return currentTz;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function todayLocalDate(): string {
  return dateFmt.format(new Date());
}

function buildDateFmt(tz: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
