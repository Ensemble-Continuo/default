import Nunjucks from "nunjucks";
import crypto from "node:crypto";
import fs from "node:fs";

export default function (eleventyConfig) {
  // Concert times in performances.json are Pacific wall-clock times. Build in
  // that zone everywhere -- CI runs in UTC -- so they are read as authored.
  process.env.TZ = "America/Los_Angeles";

  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("videos");

  eleventyConfig.addExtension("ntk", { key: "njk" });

  // Footer copyright line; the site rebuilds nightly, so this stays current.
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  // Pages are written as /about.html but served and linked as /about.
  eleventyConfig.addFilter("cleanUrl", (url) => url.replace(/\.html$/, ""));

  // Stylesheets are cached by browsers for hours, pages for minutes. Add a
  // hash of the file's contents to its link ("/styles/main.css?v=1a2b3c4d")
  // so a changed stylesheet gets a new address and is fetched straight away,
  // instead of new pages being drawn with old styles.
  const fingerprints = new Map();
  eleventyConfig.addFilter("fingerprint", (url) => {
    if (!fingerprints.has(url)) {
      const contents = fs.readFileSync("." + url);
      const hash = crypto.createHash("sha256").update(contents).digest("hex");
      fingerprints.set(url, `${url}?v=${hash.slice(0, 8)}`);
    }
    return fingerprints.get(url);
  });

  let njkEnvironment = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader("_includes")
  );
  eleventyConfig.setLibrary("njk", njkEnvironment);

  ///////// PERFORMANCE LIST FILTERS /////////
  // Dates are parsed and categorised in _data/performances.js.
  eleventyConfig.addFilter("upcomingPerfs", (events) => {
    return events
      .filter(p => p.category === "upcoming")
      .sort((a, b) => a.startsAt - b.startsAt);
  });

  // 2. Recent Past: Last 2 years
  eleventyConfig.addFilter("recentPerfs", (events) => {
    return events
      .filter(e => e.category === "recent")
      .sort((a, b) => b.startsAt - a.startsAt); // Newest first
  });

  // 3. Archive: Older than 2 years
  eleventyConfig.addFilter("historicalPerfs", (events) => {
    return events
      .filter(e => e.category === "historical")
      .sort((a, b) => b.startsAt - a.startsAt);
  });

  eleventyConfig.addFilter("mmm_dd_yyyy", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  });

  // "Sat, Nov 14 · 7:00 pm" for the homepage's next-concert card.
  eleventyConfig.addFilter("concertWhen", (perf) => {
    const day = perf.startsAt.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
    if (perf.timeTBD) return day;
    const time = perf.startsAt.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit"
    }).toLowerCase();
    return `${day} · ${time}`;
  });

  ////////////////////////////////////////////////

  return {
    templateFormats: ["md", "njk", "html", "ntk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};


