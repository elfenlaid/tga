---
layout: layouts/home.njk
title: About
---

<div class="max-w-lg dark:text-gray-400 space-y-4 text-md">

Hello 👋 I'm {{ metadata.author.name }}, past denial, anger, and bargaining phases iOS developer. Nowadays, I'm dealing mostly with depression and acceptance :)

I write or plan to write about <a class="underline" href="{{ '/tags/iOS' | url }}">iOS</a>, <a class="underline" href="{{ '/tags/Elixir' | url }}">Elixir</a>, and <a class="underline" href="{{ '/tags/' | url }}">tech</a>.

Oh, I'm also an <a class="underline" href="https://exercism.io/mentor/dashboard/your_solutions">Exercism Swift Track mentor</a>, come join us.

  <div class="pt-8 inline-flex flex-row space-x-4 dark:text-white">
    <a class="border-blue-400 hover:bg-blue-400 hover:text-white border-2 px-6 py-2" href="{{ metadata.author.twitter }}" target="_blank">Visit Twitter</a>
    <a class="border-gray-900 dark:border-gray-300 hover:bg-gray-900 hover:dark:bg-gray-300 hover:text-white hover:dark:text-gray-900 border-2 px-6 py-2" href="{{ metadata.author.github }}" target="_blank">Visit Github</a>
  </div>
</div>
