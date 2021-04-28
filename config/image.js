const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes) {
  let metadata = await Image(src, {
    widths: [655, 1310, 1965],
    formats: ["webp", "jpeg", "avif"],
    outputDir: "./_site/img/"
  })

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  }

  let options = {
    whitespaceMode: "inline",
  }

  return Image.generateHTML(metadata, imageAttributes, options)
}

async function assetShortcode(name, alt, sizes = "(min-width: 40ch) 90vw, (min-width: 65ch) 90vw, 100vw") {
  return imageShortcode('./site/assets/' + name, alt, sizes)
}

module.exports = eleventyConfig => {
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addNunjucksAsyncShortcode("asset", assetShortcode);
};
