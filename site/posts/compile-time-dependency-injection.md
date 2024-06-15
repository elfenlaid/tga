---
date: 2024-06-13
title: Compile-time Dependency Injection
subtitle: How to define such dependencies, and why compile-time part is important
tags:
  - Elixir
  - Patterns
---

In [Building API Clients with Req - Wojtek Mach | ElixirConf EU 2024](https://www.youtube.com/watch?v=AexE5JKpNvA) talk, Wojtek shortly demonstrated how to test [Req](https://github.com/wojtekmach/req) clients using behaviours and dependency injection. I highly recommend the talk.

The post is a reminder to myself on how to define such dependencies, and discusses some of their nuances.

## How to define a dependency

The following snippet demonstrates how to model time dependency in the codebase. Subsequent sections go over its details.

```elixir
# app/clock.ex
defmodule Clock do
  @callback now() :: DateTime.t()

  @module Application.compile_env!(:my_app, :clock)

  defdelegate now, to: @module
end

# app/clock/system.ex
defmodule Clock.System do
  @behaviour Clock

  @impl Clock
  def now do
    DateTime.now!("Etc/UTC")
  end
end

# test/support/mocks.ex
Hammox.defmock(Clock.Mock, for: Clock)

# config/config.exs
config :app, :clock, Clock.System

# config/test.exs
config :app, :clock, Clock.Mock

# Tests
stub(Clock.Mock, :now, fn -> ~U[2024-06-13 09:18:06.497119Z] end)
```

## Behaviour

Behaviours create contract for `Clock` implementation, including the mock one. There's one downside to behaviours - they are stateless. The snippet's stub is frozen it time, but what if tests require "time travel"?

Agents is one of the ways to inject state in mocks:

```elixir
defmodule ManualClock do
  use Agent

  def start_link(datetime) do
    Agent.start_link(fn -> datetime end)
  end

  def now(clock) do
    Agent.get(clock, & &1)
  end

  def shift(clock, value, unit) do
    # Or use `DateTime.shift/3` on Elixir >= 1.17
    Agent.update(clock, &DateTime.add(&1, value, unit))
  end
end

# Using
time = start_supervised!({ManualClock, ~U[2024-06-13 09:18:06.497119Z]})
stub(Clock.Mock, :now, fn -> TestClock.now(time) end)

ManualClock.shift(time, 30, :minute)
```

## `Application.compile_env!`

Pros of the unsafe version of `Application.compile_env!` are important:

- Unsafe version verifies that the app's config injects a behaviour. It does so at compile time, shortening the error feedback cycle.
- Compile time injections are more performant. It may play a role in hot functions, especially if they previously were using `Application.fetch_env` on every call.
- Compile time injections prevents adding much overhead, aside from one indirect call. Growing the corpus of injected dependencies shouldn't cause performance issues.

## Hammox vs Mox

[Hammox](https://github.com/msz/hammox) adds runtime type checks for mocks. It does so by extracting types from behaviours' callback specs. I often forget to update a mock function after updating the behavior's callback. [Hammox](https://github.com/msz/hammox) throws error if the return type of the mock function doesn't match the callback's one.

[Hammox](https://github.com/msz/hammox) is built on top of [Mox](https://github.com/dashbitco/mox), it does the same thing as [Mox](https://github.com/dashbitco/mox), it fully replicates [Mox](https://github.com/dashbitco/mox)'s API, and even use [Mox](https://github.com/dashbitco/mox) under the hood. Which makes it an ideal candidate for gradual drop-in replacement of [Mox](https://github.com/dashbitco/mox).

## Test Mocks

Notice that the example defines test mocks in `test/support/mocks.ex`, when usually code bases do that in `test/test_helper.exs`.

The reason is that a call to `Application.compile_env` happens, well, during compilation time. While `test_helpers.exs` content is interpreted together with tests in runtime, which is too late.

Having configuration for mocks in `config/test.exs` : `config :app, :clock, Clock.Mock` makes Elixir compiler to emit warning of unknown `Clock.Mock` if you forget to transfer it to `test/support/` directory.

To level up the configuration game, one can define mocks per environment:

```elixir
# config/config.exs
config :app, :clock, Clock.Unimplemented

# config/dev.exs
config :app, :clock, Clock.System

# config/prod.exs
config :app, :clock, Clock.System

# config/test.exs
config :app, :clock, Clock.Mock
```

In this case, compiling the Clock module for test environment will emit a warning that module `Clock.Unimplemented is not available or is yet to be defined`. The trick prevents  live dependencies from leaking to tests.
