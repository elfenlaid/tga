module.exports = eleventyConfig => {
  eleventyConfig.addPassthroughCopy({ "site/public/favicon.ico": "favicon.ico" })
  eleventyConfig.addPassthroughCopy({ "site/public/static": "static" })

  eleventyConfig.addCollection("bundles", col => {
    return {
      css: col.getFilteredByGlob("./site/css/css.njk")[0]
    }
  });

  eleventyConfig.addWatchTarget("./site/css/")
}
