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
 * Loads every performance, validated, with its date parsed and a header
 * image guaranteed.
 *
 * @returns {Array<object>} the authored entries plus derived fields
 */
export default function () {
  const authored = JSON.parse(fs.readFileSync(SOURCE));
  return recycleMissingImages(authored.map(normalize));
}

// Fields every entry must carry, whatever else it does. imgUrl is not among
// them: an entry without one borrows a picture, see recycleMissingImages.
const REQUIRED_FIELDS = ["title", "date", "location"];

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
    category: categorize(startsAt),
    imageIsRecycled: false,
  };
}

// Which section of the performances page an entry belongs in.
function categorize(startsAt) {
  const ageInDays =
    (Date.now() - startsAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 0.5) {
    return "upcoming";
  }
  if (ageInDays < 500) {
    return "recent";
  }
  return "historical";
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

// Gives a header image to entries that do not name one, by borrowing a
// photograph from a concert old enough that its picture is no longer shown.
//
// Concerts drop out of the card grid after a couple of years into a text-only
// archive, so those images sit unused. Lending one means a concert can be
// announced the day it is booked, rather than waiting on somebody to make
// artwork -- which is the difference between a listing and no listing.
//
// Pictures are handed out by position, not at random, so a concert keeps the
// same one from build to build instead of reshuffling every night.
function recycleMissingImages(perfs) {
  const needy = perfs.filter(p => !p.imgUrl).sort(byNewestFirst);
  if (!needy.length) return perfs;

  const pool = recyclableImages(perfs);
  if (!pool.length) {
    reject(needy[0], 'has no "imgUrl", and no older concert has a picture ' +
      "free to lend it");
  }
  needy.forEach((perf, index) => {
    perf.imgUrl = pool[index % pool.length];
    perf.imageIsRecycled = true;
  });
  return perfs;
}

// Images belonging to concerts that have aged into the text-only archive and
// so appear nowhere on the page. Most recent first, on the reasoning that the
// newest archived photograph best resembles the ensemble today.
function recyclableImages(perfs) {
  const onScreen = new Set(
    perfs.filter(p => p.category !== "historical").map(p => p.imgUrl));

  const archived = perfs
    .filter(p => p.category === "historical" && p.imgUrl)
    .sort(byNewestFirst)
    .map(p => p.imgUrl)
    .filter(imgUrl => !onScreen.has(imgUrl));

  return [...new Set(archived)];
}

function byNewestFirst(a, b) {
  return b.startsAt - a.startsAt;
}

// Stops the build, naming the concert so the author knows which line to fix.
function reject(perf, problem) {
  const name = perf.title ? `"${perf.title}"` : "An untitled performance";
  throw new Error(`performances.json: ${name} ${problem}.`);
}

