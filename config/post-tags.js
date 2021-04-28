module.exports = eleventyConfig => {
  let rejectedTags = new Set(["all", "nav", "posts"])

  eleventyConfig.addCollection("postTags", col => {
    let allTags = new Set()

    col.getAll().forEach(item => {
      (item.data.tags || [])
        .filter(tag => !rejectedTags.has(tag))
        .forEach(tag => allTags.add(tag))
    });

    return [...allTags]
  })

  eleventyConfig.addFilter("postTags", tags => {
    return tags.filter(tag => !rejectedTags.has(tag))
  })
}
