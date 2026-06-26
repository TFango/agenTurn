const TZ = "America/Argentina/Buenos_Aires";

function getParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts: Record<string, string> = {};
  for (const { type, value } of formatter.formatToParts(date)) {
    parts[type] = value;
  }
  return parts;
}

export function todayAR(): string {
  const p = getParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function nowAR(): Date {
  const p = getParts(new Date());
  return new Date(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`);
}

export function getHoursAR(date: Date): number {
  const p = getParts(date);
  return parseInt(p.hour);
}

export function getMinutesAR(date: Date): number {
  const p = getParts(date);
  return parseInt(p.minute);
}

export function formatDateTimeAR(date: Date): string {
  const p = getParts(date);
  return `${p.day}/${p.month} ${p.hour}:${p.minute}hs`;
}
