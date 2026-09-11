import Nunjucks from "nunjucks";
import fs from "fs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("videos");

  eleventyConfig.addExtension("ntk", { key: "njk" });

  // Footer copyright line; the site rebuilds nightly, so this stays current.
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  let njkEnvironment = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader("_includes")
  );
  eleventyConfig.setLibrary("njk", njkEnvironment);

  checkPerformancesFile();

  ///////// PERFORMANCE LIST FILTERS /////////
  eleventyConfig.addFilter("upcomingPerfs", (events) => {
    return events
      .filter(p => classifyPerf(p) === "upcoming")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  // 2. Recent Past: Last 2 years
  eleventyConfig.addFilter("recentPerfs", (events) => {
    return events
      .filter(e => classifyPerf(e) === "recent")
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
  });

  // 3. Archive: Older than 2 years
  eleventyConfig.addFilter("historicalPerfs", (events) => {
    return events
      .filter(e => classifyPerf(e) === "historical")
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  eleventyConfig.addFilter("mmm_dd_yyyy", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  });

  // ISO 8601 for schema.org Event markup.
  eleventyConfig.addFilter("isoDateTime", toLocalIsoDateTime);

  ////////////////////////////////////////////////

  return {
    templateFormats: ["md", "njk", "html", "ntk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};

// Formats a performance date as a local-time ISO 8601 string, e.g.
// "June 27, 2026 7:00 pm" -> "2026-06-27T19:00:00".
//
// Entries that give no clock time yield a date only, e.g.
// "July 2, 2023" -> "2023-07-02", rather than asserting a midnight start.
//
// The UTC offset is deliberately omitted. Dates in performances.json are
// wall-clock times at the venue, but the build runs in UTC on CI and locally
// in Pacific time. Reading the date back with local getters recovers the
// original wall-clock time in either environment; appending an offset would
// shift every concert by however many hours the build machine happens to be
// from the venue.
function toLocalIsoDateTime(dateStr) {
  const date = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}` +
    `-${pad(date.getDate())}`;
  if (!/\d\s*:\s*\d|\d\s*[ap]\.?m/i.test(dateStr)) return day;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

// Determines which category a performance falls into
function classifyPerf(perf) {
  try {
    const perfAgeInDays = (new Date().getTime() - new Date(perf.date).getTime()) / (1000 * 60 * 60 * 24);

    if (perfAgeInDays < 0.5) {
      return "upcoming";
    }
    if (perfAgeInDays < 500) {
      return "recent";
    }
    return "historical";
  } catch (e) {
    console.log(e);
    throw e;
  }
}

function checkPerformancesFile() {
  const perfs = JSON.parse(
    fs.readFileSync(new URL("./_data/performances.json", import.meta.url))
  );
  for (const perf of perfs) {
    if (!perf.title) {
      throw new Error('Performance is missing a title: ' + JSON.stringify(perf));
    }
    if (!perf.date) {
      throw new Error('Performance is missing a date: ' + JSON.stringify(perf));
    }
    if (!perf.location) {
      throw new Error('Performance is missing a location: ' + JSON.stringify(perf));
    }
    if (!perf.imgUrl) {
      throw new Error('Performance is missing an image: ' + JSON.stringify(perf));
    }
    const date = new Date(perf.date);
    if (!(date instanceof Date) || isNaN(date)) {
      throw new Error('Performance date is invalid: ' + JSON.stringify(perf));
    }
  }
}
