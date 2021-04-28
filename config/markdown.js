const markdownIt = require("markdown-it")
const markdownItAnchor = require("markdown-it-anchor")
const markdownItToc = require("markdown-it-table-of-contents")
const slugify = require("slugify")

module.exports = eleventyConfig => {
  function markdownSlugify(s) {
    return slugify(s, { lower: true, remove: /[:’'`,]/g })
  }

  let mdIt = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  })
    .disable('code')
    .use(markdownItAnchor, {
      permalink: true,
      slugify: markdownSlugify,
      permalinkBefore: false,
      permalinkClass: "direct-link",
      permalinkSymbol: "#",
      level: [1, 2, 3, 4]
    })
    .use(markdownItToc, {
      includeLevel: [1, 2, 3],
      slugify: markdownSlugify,
    })

  eleventyConfig.setLibrary("md", mdIt);
}
