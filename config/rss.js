const rss = require("@11ty/eleventy-plugin-rss")

module.exports = eleventyConfig => {
  eleventyConfig.addPlugin(rss)

  eleventyConfig.addFilter('htmlDateString', (date) => {
    return date.toISOString().slice(0, 10)
  });
}
