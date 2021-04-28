module.exports = eleventyConfig => {
  eleventyConfig.addFilter("shortDate", date => {
    return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short' })
  });
};
