const minifier = require("./config/minifier")
const markdown = require("./config/markdown")
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight")
const postCSS = require("./config/postcss")
const postTags = require("./config/post-tags")
const rss = require("./config/rss")
const image = require("./config/image")
const callout = require("./config/callout")
const dates = require("./config/dates")
const resources = require("./config/resources")

module.exports = function (eleventyConfig) {
  eleventyConfig.setDataDeepMerge(true)

  eleventyConfig.addPlugin(minifier)
  eleventyConfig.addPlugin(markdown)
  eleventyConfig.addPlugin(syntaxHighlight)
  eleventyConfig.addPlugin(postCSS)
  eleventyConfig.addPlugin(postTags)
  eleventyConfig.addPlugin(rss)
  eleventyConfig.addPlugin(image)
  eleventyConfig.addPlugin(callout)
  eleventyConfig.addPlugin(dates)
  eleventyConfig.addPlugin(resources)

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "site"
    }
  };
}
