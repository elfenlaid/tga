---
date: 2023-02-03
title: Exploring Default Argument Values
subtitle: Navigating default argument values and avoiding common oversights
tags:
  - Swift
  - iOS
---

# Exploring Default Argument Values

It's 2023 and I'm not sure that comparing Objective-C with Swift is still relevant, but I'll go with it anyway. Unlike Objective-C, Swift is blessed with a handy feature of default argument values. The feature is quite a life improvement and it feels awkward when a programming language does't support it.

Nevertheless, there are times when default argument values can get in the way. Alas, in a rather mischievous manner. Changing a default argument value is a subtle enterprise. Especially so in libraries and frameworks, e.g. when you aren't the library's interface consumer and can't be sure how it's used.

There are multiple occasions when changing default argument values can bite you. The first occasion is function overloads. Swift supports similar function signatures, but with tweaked arguments or a return value:

```swift
func render(_ content: String, newlineStyle: LineEndingStyle = .linux) -> Markdown {
  // ...
}

func render(_ content: String, newlineStyle: LineEndingStyle = .linux) -> HTML {
  // ...
}
```

The second occasion is wrapping a function with default arguments, but leaving a way to pass the argument down to the function:

```swift
func prettify(_ content: String, newlineStyle: LineEndingStyle = .linux) -> Markdown {
  // ...
  render(prettyContent, newlineStyle: newlineStyle)
}
```

In both cases it seems reasonable to provide a default value for the `newlineStyle` argument. What's more, the default value is visible in autocompletion. In other words, it works great... unless we need to change the default value.

As you might have noticed, we would need to change the default value in multiple places. Some can be colocated in the same source file, whole others might reside in neighbor files or in different projects. And it might happen that one such place could be overlooked.

## Optional Default Values

Well, that's awkward, but what can be done about it? I would argue that optional nil default arguments might be a solution we are after:

```swift
// Instead of this:
func render(_ content: String, newlineStyle: LineEndingStyle = .linux) -> HTML {
  // ...
}

// One would do this:
func render(_ content: String, newlineStyle: LineEndingStyle? = nil) -> Markdown {
  let newlineStyle = newlineStyle ?? .linux
  // ...
}
```

There are certainly downsides. For example, the default value won't longer show up in code completion and probably would need a mention in a function's documentation. Oof, that sounds like another can of worms and I agree.

But at least it removes the burden of tracking down changed default values from code consumers. So, technically it adds a bit more longevity to consumers' code.

One more thing that this approach doesn't tackle is... we might forget to pass the default argument down from a wrapper function to an actual function. E.g. forget to pass the `prettify's newlineStyle` argument to the `render` function. That's especially true when there are more than one such arguments.

## Structured Default Arguments

So, is there anything we can do to help with trickling down default arguments? One way to mitigate it  is by composing arguments in a struct. `UIButton.Configuration` is a good example of the said technique. Returning to our samples this might look like this:

```swift
// Instead of this:
func render(_ content: String, newlineStyle: LineEndingStyle = .linux) -> HTML {
  // ...
}

// One would do this:
struct Configuration {
  var newlineStyle: LineEndingStyle = .newlineStyle
}

func render(_ content: String, configuration: Configuration = .init()) -> Markdown {
  // ...
}
```

Even tho it stands as [not the most revered UIKit's API](https://mastodon.social/@marcoarment/109761392536752965), but it does the job. On the other hand, there's so much more to the struct technique that it unavoidably feels cumbersome for tiny interfaces. What's more, it still doesn't solve the trickling down arguments problem.

## Warnings to the rescue

This section is somewhat dragged by the ears and doesn't strictly relate to the default arguments discussion. Nevertheless, I would argue that it's a good tool to have in any codebase.

I'm speaking about unused function arguments warning. I can't recall how many times I was saved by this warning. Unfortunately, it doesn't work out-of-box in Swift. There are some discussions around adding it to Swift [Add warnings for unused function arguments by default - Evolution / Discussion - Swift Forums](https://forums.swift.org/t/add-warnings-for-unused-function-arguments-by-default/47271/24), but it feels like it won't happen.

For now we can use tools like [peripheryapp/periphery: A tool to identify unused code in Swift projects](https://github.com/peripheryapp/periphery) to help us track down unused arguments. It might sound somewhat as an overkill just for that warning and I agree.

But my favorite is [nicklockwood/SwiftFormat: A command-line tool and Xcode Extension for formatting Swift code](https://github.com/nicklockwood/SwiftFormat). SwiftFormatter has a linter mode, that would warn about unused variables instead of replacing them with underscores. Just be certain to `--disable unusedArguments` in automatic formatting. This way unused arguments would stay in the code and the linter mode would have a chance to surface them

## Unconclusion

I can't say any the mentioned method is particularly elegant. Personally, the one with optional default values has the most favorable set of tradeoffs. Tho, it's subjective and not universally applicable.

On the other hand, I find it fascinating how such tiny things can impact code longevity. I wonder how many steps language designers need to foresee to come up with a well rounded solution?

Anyway, please let me know if there's have a better option on the table.

You can make anything, till next time :)
