const markdownIt = require('markdown-it')

module.exports = eleventyConfig => {
  let md = new markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).disable('code')

  eleventyConfig.addPairedShortcode("callout", function (content, level = "info", format = "html") {
    if (format === "md") {
      content = md.renderInline(content.trim())
    }

    function bgColor() {
      switch (level) {
        case "info":
          return "bg-blueGray-100 dark:bg-blueGray-700"
        case "warn":
          return "bg-orange-100 dark:bg-orange-700"
        default:
          return "bg-white"
      }
    }

    function icon() {
      switch (level) {
        case "info":
          return '<svg class="w-6 h-6 stroke-current text-sky-600 dark:text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        case "warn":
          return '<svg class="w-6 h-6 stroke-current text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
        default:
          return ""
      }
    }

    return `
    <div class="p-4 my-5 ${bgColor()} bg-opacity-100 dark:bg-opacity-30 rounded shadow-sm text-sm text-gray-600 dark:text-gray-400 flex items-center">
      ${icon()}
      <div class="unprose ml-4">
        ${content}
      </div>
    </div>
    `.replace(/^\s+|\s+$/g, '')
  })
}
