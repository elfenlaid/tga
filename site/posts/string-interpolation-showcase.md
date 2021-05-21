---
date: 2021-05-21
title: "Swift String Showcase: Privacy Logs"
subtitle: How to create a custom String Interpolation Type
tags:
  - iOS
  - Swift
---

Here I'm (a year late to the party 🥲) explaining what Swift String Interpolations is all about and showcasing a custom string interpolation type.

Here's the [full implementation][full-implementation] and bits of context to follow along.

[[toc]]

## Introduction to String Interpolation

According to [Rich Hickey's vibes][Rick Hickey], we're up to look for interpolation's definition. Without further ado:

> 1. the insertion of something of a different nature into something else
>    - "the interpolation of songs into the piece"
> 2. a remark interjected in a conversation
>      - "as the evening progressed their interpolations became more ridiculous"

`A remark interjected in a conversation` 🧐? Voila, a thing to interpolate in the everyday dandy dictionary.

Anyway, talking about the definitions, we're going to concern ourselves with the first one. Most modern programming languages support string interpolation in some way:

- Rust `println!("The {species}'s name is {name}.");`
- JS ```console.log(`The ${species}'s name is {name}.`);```
- Elixir `IO.puts("The #{species}'s name is #{name}.")`
- Swift `print("The \(species)'s name is \(name).")`
- You have the idea...

Nothing particularly new here, right? Except here is Swift 5's custom string interpolations [SE-0228][SE-0228] proposal. In case you've missed it completely, it gives control over the default string interpolation. Here are the proposed potential uses:

```swift
// Use printf-style format strings:
"The price is $\(cost, format: "%.2f")"

// Use UTS #35 number formats:
"The price is \(cost, format: "¤###,##0.00")"

// Use Foundation.NumberFormatter, or a new type-safe native formatter:
"The price is \(cost, format: moneyFormatter)"

// Mimic String.init(_:radix:uppercase:)
"The checksum is 0x\(checksum, radix: 16)"
```

What I did a year ago - I've checked said uses, which are totally rad, thought, "yeah, that's cool," and was off with it. **But** I've entirely missed the way of said proposal to land - custom interpolation types.

Don't be me, read to the end, or review or revise the [proposal][SE-0228], or [some][NSHipster] [other][SwiftLee] explanation.

## Extend String Interpolation

Before we talk about [custom interpolation types](#custom-string-interpolation-type), I want to mention that types are not the only available extension point. Most of the time, it's much quicker to drop a `String.StringInterpolation` extension.

Let's have a look at what it takes to implement the purposed use cases:

```swift
let 🇺🇸 = Locale(identifier: "en_US")

extension String.StringInterpolation {
    // Use printf-style format strings:
    mutating func appendInterpolation(_ value: Double, format: String) {
        appendInterpolation(String(format: format, value))
    }

    // Use UTS #35 number formats: http://www.unicode.org/reports/tr35/tr35-numbers.html#Number_Format_Patterns
    mutating func appendInterpolation(_ value: NSNumber, format: String) {
        let formatter = NumberFormatter()
        formatter.locale = 🇺🇸
        formatter.format = format // .format @available(macOS 10.0, *)
        appendInterpolation(formatter.string(from: value)!)
    }

    // Use Foundation.NumberFormatter, or a new type-safe native formatter:
    mutating func appendInterpolation(_ value: Double, format: NumberFormatter) {
        appendInterpolation(format.string(from: value as NSNumber)!)
    }

    // Mimic String.init(_:radix:uppercase:)
    mutating func appendInterpolation<Value: BinaryInteger>(_ value: Value, radix: Int, uppercase: Bool = false) {
        appendInterpolation(String(value, radix: radix, uppercase: uppercase))
    }
}

let moneyFormatter = NumberFormatter()
moneyFormatter.locale = 🇺🇸
moneyFormatter.numberStyle = .currency
moneyFormatter.maximumFractionDigits = 2

let cost = 12.8
"The price is $\(cost, format: "%.2f")" // The price is $12.80
"The price is \(cost as NSNumber, format: "¤###,##0.00")" // The price is $12.80
"The price is \(cost, format: moneyFormatter)" // The price is $12.80

let checksum = 123123123
"The checksum is 0x\(checksum, radix: 16)" // The checksum is 0x756b5b3
```

Well, it wasn't that complicated or horrible (aside from [emoji locales][NSHipster-locale]). Oh, you can find more examples of  `StringInterpolation` extensions [here][SwiftLee].

If you follow along with the implementation, you may notice that things kind of become messy with every override of `appendInterpolation`. We were forced to juggle with types (`NSNumber/Double`) and compromise on APIs, far from optimal. That's where custom string interpolation types come into play.

## Custom String Interpolation Type

Aside from reducing String type clutter, custom string interpolation types rein how and what is out to be interpolated. But to think about it, where can it be useful?

Well... How about logs? Logging is a pain point on iOS (and we're clearly not there [yet][steipete]). The post's idea emerged while I was lurking around [Peter's post][steipete] and stumbled upon the next lines:

```swift
let logger = Logger(subsystem: "com.steipete.LoggingTest", category: "main")
logger.info("Logging \(obj.description, privacy: .public)")
```

Aha `(obj.description, privacy: .public)`! Clearly, a custom string interpolation is in play. I immediately went off to check its implementation at [Apples' Swift Log repo][swift-log]. Alas, this is not a complete `os.Logger` implementation, and it misses interpolation details.

I guess we have no choice but to try and implement our own logs privacy policy :) Let's define an API surface:

```swift
func log(_ message: Message) { print(message) }

log("Hello, \("World!", privacy: .public)")   // Hello, world!
log("Hello, \("Secret!", privacy: .private)") // Hello, ******!
log("Static strings say whatever they want") // Static strings say whatever they want
```

By the way, `Logger`'s '`privacy:` is set to `.auto`. All of that without saying that [`OSLogPrivacy`][OSLogPrivacy] is way more intricate than our example implementation:

```swift
struct Message {
    enum Privacy {
        case `public`
        case `private`
    }

    var value: String
}
```

So, we already can log `Message` instances:

```swift
log(Message(value: "Hello, World!")) // Message(value: "Hello, World!")
```

But they aren't looking pretty, are they? Thankfully we are one protocol conformance away from fixing the situation:

```swift
extension Message: CustomStringConvertible {
    var description: String { value }
}

log(Message(value: "Hello, World!")) // Hello, World!
```

How about dealing with static strings or string literals before tackling interpolations? Plus `ExpressibleByStringLiteral` conformance is a requirement for `ExpressibleByStringInterpolation` anyway.

```swift
extension Message: ExpressibleByStringLiteral {
    init(stringLiteral value: StringLiteralType) {
        self.init(value: value)
    }
}

log("Hello, World!") // Hello, World!
```

Now we're ready to deal with the whole interpolation thing:

```swift
extension Message: ExpressibleByStringInterpolation {
    init(stringInterpolation: StringInterpolation) {
        self.init(value: stringInterpolation.string)
    }

    struct StringInterpolation: StringInterpolationProtocol {
        var string = ""

        init(literalCapacity: Int, interpolationCount: Int) {
            string.reserveCapacity(literalCapacity)
        }

        mutating func appendLiteral(_ literal: String) {
            string.append(literal)
        }

        mutating func appendInterpolation<T>(_ value: T, privacy: Privacy = .private) where T: CustomStringConvertible {
            switch privacy {
            case .public:
                string.append(value.description)
            case .private:
                string.append(
                    Array(repeating: "*", count: value.description.count).joined()
                )
            }
        }
    }
}
```

The main workhorse of `ExpressibleByStringInterpolation` is `Message.StringInterpolation` type and its `appendInterpolation` implementation. You can check out [full implementation here][full-implementation].

## `Logger` Nuances

As I've mentioned before, an actual `Logger` implementation is way more intricate. We can get some insights into how things work by checking the `os` interface:

```swift
public struct Logger {
  public func log(_ message: OSLogMessage)
}

public struct OSLogMessage : ExpressibleByStringInterpolation, ExpressibleByStringLiteral {
    public init(stringInterpolation: OSLogInterpolation)
}
```

So, `OSLogInterpolation` is an analogue to our `Message.StringInterpolation` type. By digging further, we can see tons of overrides of `appendInterpolation`:

```swift
//..
public mutating func appendInterpolation(
  _ argumentString: @autoclosure @escaping () -> String,
  align: OSLogStringAlignment = .none,
  privacy: OSLogPrivacy = .auto
)

logger.info(
  "Hello, \("World!",
  align: OSLogStringAlignment.right(columns: 20))"
)
// > Hello,               World!

public func appendInterpolation(
  _ number: @autoclosure @escaping () -> Double,
  format: OSLogFloatFormatting = .fixed,
  align: OSLogStringAlignment = .none,
  privacy: OSLogPrivacy = .auto
)

logger.info("\(123.123, format: .exponential)")
// > 1.231230e+02
```

First of all, arguments are following `@autoclosure @escaping () -> T` signature. In that way, some arguments won't be computed when logs are switched off (either overall or reduced by a log level).

Secondly, formatting parameters like `.format` and `.align` to tune output meessages. [The official `OSLogInterpolation`'s documentation][OSLogInterpolation] covers more of them.

Thirdly, there are many overrides for concrete types like `UInt8/UInt16/UInt32/UInt64/etc.`. I presume it speeds up either compilation or method resolution for specified types 🤔

## Conclusion

As you can see, Swift String Interpolation is a hilarious feature that might be easily overlooked, as it feels so at home with the current implementation.

You may find a much more detailed explanation of [`ExpressibleByStringInterpolation` at NSHipster][NSHipster], which covers yet another [custom interpolation type example][NSHipster-example].

Know more cases of `ExpressibleByStringInterpolation`? Don't hesitate to hit me up on [Twitter]({{ metadata.author.twitter }})!

You can make anything, till next time :)

[Rick Hickey]: https://en.wikipedia.org/wiki/Rich_Hickey
[SE-0228]: https://github.com/apple/swift-evolution/blob/master/proposals/0228-fix-expressiblebystringinterpolation.md
[SwiftLee]: https://www.avanderlee.com/swift/string-interpolation/
[NSHipster-locale]: https://nshipster.com/formatter/#locale-awareness
[steipete]: https://steipete.com/posts/logging-in-swift/
[swift-log]: https://github.com/apple/swift-log
[OSLogPrivacy]: https://developer.apple.com/documentation/os/oslogprivacy#
[OSLogInterpolation]: https://developer.apple.com/documentation/os/osloginterpolation#
[full-implementation]: https://gist.github.com/elfenlaid/568168ea4b2068aee2305752443a366f
[NSHipster]: https://nshipster.com/expressiblebystringinterpolation/
[NSHipster-example]: https://nshipster.com/expressiblebystringinterpolation/#implementing-a-custom-string-interpolation-type
