import Nunjucks from "nunjucks";

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

  ////////////////////////////////////////////////

  return {
    templateFormats: ["md", "njk", "html", "ntk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};


