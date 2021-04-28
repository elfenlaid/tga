const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const tailwindcss = require('tailwindcss')

module.exports = eleventyConfig => {
  eleventyConfig.addNunjucksAsyncFilter("postCSS", function (code, callback) {
    postcss([
      autoprefixer,
      tailwindcss
    ])
      .process(code, { from: undefined })
      .then(function (result) {
        callback(null, result.css);
      });
  });
}
