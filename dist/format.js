let currentTz = systemTimezone();
let dateFmt = buildDateFmt(currentTz);
export function systemTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
export function setTimezone(tz) {
    const next = tz && isValidTimezone(tz) ? tz : systemTimezone();
    if (next === currentTz)
        return;
    currentTz = next;
    dateFmt = buildDateFmt(currentTz);
}
export function getTimezone() {
    return currentTz;
}
export function isValidTimezone(tz) {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    }
    catch {
        return false;
    }
}
export function todayLocalDate() {
    return dateFmt.format(new Date());
}
function buildDateFmt(tz) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}
//# sourceMappingURL=format.js.map