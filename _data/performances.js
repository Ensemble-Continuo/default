/**
 * Concert data for the site.
 *
 * The authored list lives in performances.json at the repository root. This
 * module is the one place those human-written dates are interpreted, so every
 * template and filter downstream works from a single reading of them.
 *
 * Each entry keeps its authored fields and gains three derived ones:
 *   startsAt      a Date, for sorting and for deciding what is upcoming
 *   startDateIso  ISO 8601, for the schema.org Event markup
 *   timeTBD       whether the start time is deliberately unannounced
 *
 * Anything it cannot read with confidence throws, which fails the build
 * rather than publishing a concert on the wrong day.
 */

import fs from "node:fs";

const SOURCE = new URL("../performances.json", import.meta.url);

/**
 * Loads every performance, validated and with its date parsed.
 *
 * @returns {Array<object>} the authored entries plus derived date fields
 */
export default function () {
  return JSON.parse(fs.readFileSync(SOURCE)).map(normalize);
}

// Fields every entry must carry, whatever else it does.
const REQUIRED_FIELDS = ["title", "date", "location", "imgUrl"];

// Date shapes we refuse rather than guess at. Each of these parses without
// complaint in JavaScript, but not to the date a person meant -- which makes
// them more dangerous than the ones that fail outright.
const AMBIGUOUS_DATES = [
  {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    reason: "a bare ISO date is read as UTC, so in California it lands on " +
      "the previous evening",
  },
  {
    pattern: /\d\s*[-\u2013\u2014]\s*\d/,
    reason: "a date range parses to an unrelated year",
  },
  {
    pattern: /\b\d{1,2}\/\d{1,2}\/\d{2}\b/,
    reason: "a two-digit year could mean either century",
  },
];

const EXAMPLES = '"December 13, 2026 7:30 pm" or "Dec 13, 2026 19:30"';

// Validates one entry and returns it with its date resolved.
function normalize(perf) {
  for (const field of REQUIRED_FIELDS) {
    if (!perf[field]) reject(perf, `is missing "${field}"`);
  }
  const timeTBD = perf.timeTBD === true;
  const startsAt = parseDate(perf, timeTBD);
  return {
    ...perf,
    timeTBD,
    startsAt,
    startDateIso: toIsoString(startsAt, timeTBD),
  };
}

// Turns the authored date string into a Date, refusing anything ambiguous,
// unreadable, or missing a start time.
function parseDate(perf, timeTBD) {
  const authored = perf.date;
  for (const { pattern, reason } of AMBIGUOUS_DATES) {
    if (pattern.test(authored)) {
      reject(perf, `has an ambiguous date "${authored}" - ${reason}. ` +
        `Write it as ${EXAMPLES}`);
    }
  }

  const cleaned = tidy(authored);
  const parsed = new Date(cleaned);
  if (isNaN(parsed)) {
    reject(perf, `has an unreadable date "${authored}". ` +
      `Write it as ${EXAMPLES}`);
  }
  if (!timeTBD && !hasClockTime(cleaned)) {
    reject(perf, `has no start time: "${authored}". Visitors need to know ` +
      `when to arrive, so write it as ${EXAMPLES}. If the time genuinely ` +
      `is not settled yet, add "timeTBD": true to this entry`);
  }
  return parsed;
}

// Rewrites the harmless ways people write dates into the narrower set that
// JavaScript's parser accepts, so that authors are not made to memorise it.
// "Sunday, June 27th, 2026 at 7:00 p.m." becomes "June 27, 2026 7:00 pm".
function tidy(dateStr) {
  return dateStr
    .replace(/^\s*[A-Za-z]+day,?\s+/, "")
    .replace(/(\d)(st|nd|rd|th)\b/gi, "$1")
    .replace(/\bat\b/gi, " ")
    .replace(/\b([ap])\.m\.?/gi, "$1m")
    .replace(/\s+/g, " ")
    .trim();
}

// Whether a tidied date string names an hour as well as a day.
function hasClockTime(dateStr) {
  return /\d\s*:\s*\d|\d\s*[ap]m\b/i.test(dateStr);
}

// Formats a date for schema.org, as local wall-clock time.
//
// The UTC offset is deliberately omitted. Concert times are wall-clock times
// at the venue, but the build runs in UTC on CI and in Pacific time locally.
// Reading the date back with local getters recovers the authored time in
// either environment; appending an offset would shift every concert by
// however far the build machine happens to be from the venue.
function toIsoString(date, timeTBD) {
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}` +
    `-${pad(date.getDate())}`;
  if (timeTBD) return day;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

// Stops the build, naming the concert so the author knows which line to fix.
function reject(perf, problem) {
  const name = perf.title ? `"${perf.title}"` : "An untitled performance";
  throw new Error(`performances.json: ${name} ${problem}.`);
}
