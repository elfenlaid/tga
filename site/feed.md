---
layout: layouts/post.njk
title: Subscribe via RSS
---

To subscribe to all {{ metadata.social.title }} articles via RSS, add the following URL to your feeds:

```bash
# Atom
{{ metadata.feed.path | url | absoluteUrl(metadata.url)}}

# JSONFeed
{{ metadata.jsonfeed.path | url | absoluteUrl(metadata.url)}}
```
