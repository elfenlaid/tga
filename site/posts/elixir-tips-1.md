---
date: 2019-02-28
title: 'Elixir Tips & Tricks: Part 1'
tags:
  - Elixir
---

During my dwelling in Elixir I've gathered quite a few nifty tips and tricks.
I'm writing them down for a personal cookbook, but I hope it will help to spark interest in a platform. Here we go.

## Ecto Datetime Helpers

Let's start with `Ecto`. Not so long ago, I've discovered
`Ecto`'s datetime [query api](https://hexdocs.pm/ecto/Ecto.Query.API.html).

I'm talking about next functions:

> Date/time intervals: `datetime_add/3`, `date_add/3`, `from_now/2`, `ago/2`

What one can do with them:

```elixir
from s in Subscriptions, where s.expires_at < from_now(1, "week")
# or
from p in Post, where: p.published_at > ago(3, "month")
```

Complete list of supported intervals: year, month, week, day, hour,
minute, second, millisecond, and microsecond.

It definitely should save a couple of keystrokes which in turn makes requests easier to grasp.

## Interpolation in docs

Nobody likes outdated documentation. One trick to keep docs up to date is to reduce the amount of copy-pasting with docs interpolation:

```elixir
defmodule HTTPClient do
  @timeout 60_000

  @doc """
  Times out after #{@timeout} seconds
  """
  def get(url) do
  end
end
```

As you can see, I've directly used `#{@timeout}` in doc comment.

## IO.ANSI

If you ever wondered where `iex` got its stylish colors from, wonder no more.
The source of it is [IO.ANSI](https://hexdocs.pm/elixir/IO.ANSI.html) module.

It's quite easy to colorize our own logs with it:

```elixir
IO.puts(IO.ANSI.bright() <> "hello" <> IO.ANSI.red() <> " world")
```

Or one can proceed further and build reusable styles like in `IO.ANSI.Docs`.
Try and mimic `h` formatting:

```elixir
IO.ANSI.Docs.print_heading("Yokoso into Elixir Documentation")
```

## Summary

It's not that hard to stumble upon peculiar things, even in everyday APIs. You need to be curious in the first place. That's it for today.
Share your finding with me at [twitter]({{metadata.author.twitter}}).

You can make anything, till next time :)
