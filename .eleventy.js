import Nunjucks from "nunjucks";
import fs from "fs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("videos");

  eleventyConfig.addExtension("ntk", { key: "njk" });

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

  ////////////////////////////////////////////////

  return {
    templateFormats: ["md", "njk", "html", "ntk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};

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
