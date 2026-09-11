import Nunjucks from "nunjucks";

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

  ///////// PERFORMANCE LIST FILTERS /////////
  // Dates arrive already parsed as `startsAt`; see _data/performances.js.
  eleventyConfig.addFilter("upcomingPerfs", (events) => {
    return events
      .filter(p => classifyPerf(p) === "upcoming")
      .sort((a, b) => a.startsAt - b.startsAt);
  });

  // 2. Recent Past: Last 2 years
  eleventyConfig.addFilter("recentPerfs", (events) => {
    return events
      .filter(e => classifyPerf(e) === "recent")
      .sort((a, b) => b.startsAt - a.startsAt); // Newest first
  });

  // 3. Archive: Older than 2 years
  eleventyConfig.addFilter("historicalPerfs", (events) => {
    return events
      .filter(e => classifyPerf(e) === "historical")
      .sort((a, b) => b.startsAt - a.startsAt);
  });

  eleventyConfig.addFilter("mmm_dd_yyyy", (dateObj) => {
    return new Date(dateObj).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  });

  ////////////////////////////////////////////////

  return {
    templateFormats: ["md", "njk", "html", "ntk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};

// Determines which category a performance falls into. Dates are parsed and
// validated up front in _data/performances.js.
function classifyPerf(perf) {
  const ageInDays =
    (Date.now() - perf.startsAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageInDays < 0.5) {
    return "upcoming";
  }
  if (ageInDays < 500) {
    return "recent";
  }
  return "historical";
}

