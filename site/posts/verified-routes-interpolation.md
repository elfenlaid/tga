---
date: 2024-08-20
title: Inside the Phoenix Verified Routes Sigil
subtitle: Sneak peek under the hood of the Phoenix Verified Routes sigil, focusing on string interpolations.
tags:
  - Elixir
  - Phoenix
---

Here I'm going to dive into `Phoenix.VerifiedRoutes` sigil and see how it handles paths string interpolations.

`~p` is a macro sigil that lives here [phoenix/lib/phoenix/verified_routes.ex](https://github.com/phoenixframework/phoenix/blob/e99f657f1cc9062fca0f2b8b79bc90659d8bd514/lib/phoenix/verified_routes.ex#L202).

[[toc]]

## Setting the Stage

By string interpolations I mean `#{something}` encountered in path strings. Here are a few examples.

Notice how the path segment containing `#{post}` is encoded as its `id` in the following example:

```elixir
get "/posts/:post_id", PostController, :show

defmodule Post do
  defstruct [:id]
end

post = %Post{id: 123}
~p"/posts/#{post}"
#=> "/posts/123"
```

Or here, how the sigil encodes query parameters:

```elixir
get "/posts", PostController, :list

params = %{page: 1, direction: "asc", search: "encode me"}
~p"/posts?#{params}"
#=> /posts?search=encode+me&direction=asc&page=1
```

Somehow the sigil knows how to transform structures and encode query parameters.

Let's remove the `?` character and see how the sigil behaves. The following snippet produces a warning during compilation and crashes during runtime:

```elixir
get "/posts", PostController, :list

params = %{page: 1, direction: "asc", search: "encode me"}
~p"/posts#{params}"

# Compiling 1 file (.ex)
#    warning: no route path for MyRouter.Router matches "/posts#{params}"
```

So, the sigil also checks if something resembling query parameters follows the `?` character, otherwise it treats it as a path segment.

It certainly lives up to its module name and verifies routes, but how exactly does it happen? Thankfully, we can take a sneak peek behind its implementation. But before doing that, let's take a quick detour to poke at Elixir's strings and sigils.

## String Interpolation

How does string interpolation work in Elixir? Well, there's a straightforward way to find out by quoting a string containing an interpolation and inspecting the result:

```elixir
quote do
  "/first/#{1234}/second"
end

{:<<>>, [],
 [
   "/first/",
   {:"::", [],
    [{{:., [], [Kernel, :to_string]}, [from_interpolation: true], [1234]}, {:binary, [], Elixir}]},
   "/second"
 ]}

# Which is this:

<<"/first", Kernel.to_string(1234), "/second">>
```

So, interpolations split strings into chunks, and these chunks are reassembled into a binary afterward. All  interpolated parts are cast to strings using `Kernel.to_string`.

Let's turn our attention to sigils now.

## Sigils

There's a few sigils that comes with Elixir: `~c` to define chartists or `~r` that defines regular expressions. But we can also define custom ones like this:

```elixir
defmodule MySigils do
  def sigil_f(string, _extra), do: dbg(string)
end

~f"/first/#{1234}/second"
# `dbg` outputs:
# string #=> "/first/1234/second"
```

Let's try the new sigil with something more complicated:

```elixir
params = %{page: 1, direction: "asc", search: "encode me"}
~f"/posts?#{params}"

# ** (Protocol.UndefinedError) protocol String.Chars not implemented for %{search: "encode me", page: 1, direction: "asc"} of type Map
```

Alas, it crashes. There's no output from the `dbg`, meaning that the sigil function didn't have a chance to run. The function should step in a bit earlier, before its arguments are "evaluated". That sounds like something a macro can do:

```elixir
defmodule MySigils do
  defmacro sigil_m(string, _extra), do: dbg(string)
end

params = %{page: 1, direction: "asc", search: "encode me"}
~m"/posts?#{params}"

# `dbg` outputs:
string #=> {:<<>>, [line: 2],
 [
   "/posts?",
   {:"::", [line: 2],
    [
      {{:., [line: 2], [Kernel, :to_string]},
       [from_interpolation: true, line: 2], [{:params, [line: 2], nil}]},
      {:binary, [line: 2], nil}
    ]}
 ]}

# ** (Protocol.UndefinedError) protocol String.Chars not implemented for %{search: "encode me", page: 1, direction: "asc"} of type Map
```

Still crashing, but this time `dbg` has actually printed something. And this something is an AST of an interpolated binary. Similar to one from the [string interpolation](#string-interpolation) section.

It appears that `Kernel.to_string` doesn't know how to turn maps into strings.

Here's a wild idea, how about we swap `Kernel.to_string` with a function that can convert maps to strings, for example `Kernel.inspect`?

```elixir
defmodule MySigils do
  defmacro sigil_m({:<<>>, meta, segments}, _extra) do
    processed_segments =
      for segment <- segments do
        case segment do
          {:"::", meta_1,
           [
             {{:., meta_2, [Kernel, :to_string]}, meta_3, args}, type
           ]} ->
            {:"::", meta_1,
             [
               {{:., meta_2, [Kernel, :inspect]}, meta_3, args}, type
             ]}
          segment ->
            segment
        end
      end
    {:<<>>, meta, processed_segments}
  end
end

params = %{page: 1, direction: "asc", search: "encode me"}
~m"/posts?#{params}"

# "/posts?%{search: \"encode me\", page: 1, direction: \"asc\"}"
```

Yay! It's not the prettiest code to follow, but swapping `Kernel.to_string` with `Kernel.inspect` did the job. Let's see the result AST:

```elixir
params = %{page: 1, direction: "asc", search: "encode me"}

macro = quote do
  ~m"/posts?#{params}"
end

Macro.expand_once(macro, __ENV__)

{:<<>>, [],
 [
   "/posts?",
   {:"::", [],
    [
      {{:., [], [Kernel, :inspect]}, [from_interpolation: true], [{:params, [], Elixir}]},
      {:binary, [], Elixir}
    ]}
 ]}
```

As you can see, somewhere in the midst of AST now there's `[Kernel, :inspect]` instead of `[Kernel, :to_string]`.

Cool, having a rough idea about what's going on with interpolation and sigils, let's eyeball the `sigil_p`'s implementation.

## `sigil_p` internals

Without further ado, here's the sigil's implementation:

```elixir
defmacro sigil_p({:<<>>, _meta, _segments} = route, extra) do
  validate_sigil_p!(extra)
  endpoint = attr!(__CALLER__, :endpoint)
  router = attr!(__CALLER__, :router)

  route
  |> build_route(route, __CALLER__, endpoint, router)
  |> inject_path(__CALLER__)
end
```

Ahem, there are more things going on aside from interpreting interpolations. But, drilling down a bit into `build_route > rewrite_path > verify_segment`, we can see how the function shapes passed arguments.

One thing to notice is that path segments and query parameters are encoded a bit differently. Here's where one of the `verify_segment`'s closures branches out:

```elixir
defp verify_segment(["/" <> _ = segment | rest], route, acc) do
    case {String.split(segment, "?"), rest} do
      {[segment], _} ->
        verify_segment(rest, route, [URI.encode(segment) | acc])

      {[segment, static_query], dynamic_query} ->
        {Enum.reverse([URI.encode(segment) | acc]),
         verify_query(dynamic_query, route, [static_query])}
    end
  end
```

Here's what happens with path segments, in other words `/#{value}`:

```elixir
defp verify_segment(
      [
        {:"::", m1, [{{:., m2, [Kernel, :to_string]}, m3, [dynamic]}, {:binary, _, _} = bin]}
        | rest
      ],
      route,
      [prev | _] = acc
    )
    when is_binary(prev) do
  rewrite = {:"::", m1, [{{:., m2, [__MODULE__, :__encode_segment__]}, m3, [dynamic]}, bin]}
  verify_segment(rest, route, [rewrite | acc])
end

# The function replaces:
#   {:"::", m1, [{{:., m2, [Kernel, :to_string]}, m3, [dynamic]}, {:binary, _, _}]}
# with:
#   {:"::", m1, [{{:., m2, [__MODULE__, :__encode_segment__]}, m3, [dynamic]}, bin]}
```

The function replaces `Kernel.to_string` with `__MODULE_.__encode_segment__`. Let's check it out:

```elixir
defp encode_segment(data) do
  data
  |> Phoenix.Param.to_param()
  |> URI.encode(&URI.char_unreserved?/1)
end
```

Aha, so segments are encoded with `Phoenix.Param.to_param()`. `Phoenix.Param`'s default implementation extracts the `id` field from a structure. Most `Ecto` schemas fit this description.

Circling back to query parameters interpolation. A very similar thing happens to them as well:

```elixir
defp verify_query(
      [
        {:"::", m1, [{{:., m2, [Kernel, :to_string]}, m3, [arg]}, {:binary, _, _} = bin]}
        | rest
      ],
      route,
      acc
    ) do
  rewrite = {:"::", m1, [{{:., m2, [__MODULE__, :__encode_query__]}, m3, [arg]}, bin]}
  verify_query(rest, route, [rewrite | acc])
end

# The function replaces:
#   {:"::", m1, [{{:., m2, [Kernel, :to_string]}, m3, [arg]}, {:binary, _, _}
# with:
#   {:"::", m1, [{{:., m2, [__MODULE__, :__encode_query__]}, m3, [arg]}
```

Instead of `Kernel.to_string`, query parameters are interpolated with `__MODULE_.__encode_query__`:

```elixir
def __encode_query__(dict) when is_list(dict) or (is_map(dict) and not is_struct(dict)) do
  case Plug.Conn.Query.encode(dict, &to_param/1) do
    "" -> ""
    query_str -> query_str
  end
end

def __encode_query__(val), do: val |> to_param() |> URI.encode_www_form()

defp to_param(int) when is_integer(int), do: Integer.to_string(int)
defp to_param(bin) when is_binary(bin), do: bin
defp to_param(false), do: "false"
defp to_param(true), do: "true"
defp to_param(data), do: Phoenix.Param.to_param(data)
```

As you can see, query parameters are encoded by the `Plug.Conn.Query.encode` function. The function knows how to transform maps and keyword lists into an encoded query.

Okay, let's stop here.

## Conclusion

In the end, we found out that the `~p` sigil encodes path segments, e.g. `~p/#{path}`, with `Phoenix.Param.to_param()` and query parameters with `Plug.Conn.Query.encode`.

Sigils may seem magical, but thanks to Elixir's transparency, we can tap into their internals basically at any point in their lifecycle.

I hope you find them as cool as I do. Thanks for reading, see ya.
