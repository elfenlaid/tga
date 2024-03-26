---
layout: layouts/home.njk
title: About
---

<div class="max-w-lg dark:text-gray-500 space-y-4 text-md">

    Hello 👋 I'm {{ metadata.author.name }}, past denial, anger, and bargaining phases iOS developer. Nowadays, I'm dealing mostly with depression, acceptance, and Elixir :)

  I write or plan to write about <a class="underline" href="{{ '/tags/iOS' | url }}">iOS</a>, <a class="underline" href="{{ '/tags/Elixir' | url }}">Elixir</a>, and <a class="underline" href="{{ '/tags/' | url }}">tech</a>.

  <div class="pt-8 inline-flex flex-row space-x-4 dark:text-white">
    <a class="border-indigo-400 hover:bg-indigo-400 hover:text-white border-2 px-6 py-2" href="{{ metadata.author.mastodon }}" target="_blank" rel="me">Mastodon</a>
    <a class="border-gray-900 dark:border-gray-300 hover:bg-gray-900 dark:hover:bg-gray-300 hover:text-white dark:hover:text-gray-900 border-2 px-6 py-2" href="{{ metadata.author.github }}" target="_blank">Github</a>
  </div>
</div>
