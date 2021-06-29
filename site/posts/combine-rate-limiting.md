---
date: 2021-06-17
title: Combine Rate Limiting
subtitle: Custom Combine Publisher Showcase
tags:
  - Combine
  - iOS
  - Swift
---

Combine, Apple's take on the reactive programming paradigm. Despite that `AsyncSequence` [is a new kid in town reactive town](https://forums.swift.org/t/swift-concurrency-reactive-programming/49547), it's safe to say that Combine is here to stay. Ah, I already can see how the said is aging like milk 🥲

Let me suggest a quick stroll through Combine's avenues. Behind well-polished facades, right to the shady custom publishers' back alleys. To places which decent youtuber-traveler would visit straightway.

Though, you might as well check out the end implementation [elfenlaid/rate-limiter](https://github.com/elfenlaid/rate-limiter)

[[toc]]

## Under Pressure

[Reactive programming](https://en.wikipedia.org/wiki/Reactive_programming) is one of those well-brewed paradigms that outgrew initial hype and became classics. Heck, [Rx](http://reactivex.io/) specification will celebrate its 10th birthday this year.

The Apple platform is not an exception here. There're tons and tons of reactive and reactive-like frameworks available for it. Here are the honorable mentions: [ReactiveCocoa](https://github.com/ReactiveCocoa/ReactiveCocoa)/[ReactiveSwift](https://github.com/ReactiveCocoa/ReactiveSwift) has been here since 2012, [ReactiveSwift](https://github.com/ReactiveCocoa/ReactiveSwift)'s initial release dates to 2015.

But in 2019, Apple comes off with [Combine](https://developer.apple.com/documentation/combine). It will take another 20 years and a retired Apple veteran to spin a tale of Combine's origins and why 2019 was the year.

For now, let's distract ourselves by scrutinizing the framework. By mere coincidence, Combine looks suspiciously Rx-like. The good ol' *asynchronous* *stream of values over time* concept. Though, with one, and significant, distinction. Combine included the **backpressure** mechanism.

The backpressure concept coordinates a *consumer's demand* (values processing) and a *producer's supply* (values generating). Thus, you can't send more events than consumers can, well, consume.

From the UI standpoint, backpressure doesn't seem like a groundbreaking concept. UI is rarely demand-bounded and generally concerned only about the latest values. However, your best friends - throttle and debounce, are here to carry the weight when it comes to that.

And indeed, all shipped Combine consumers (`sink` and `assign`) are rolling with unlimited demand. That's somewhat ironic and also makes backpressure a bit underrepresented citizen.

But don't forget that Combine is a general framework. Aside from User Interface, there are a lot of cases where you'll find backpressure useful. In system design, backpressure is a well-known and honored concept. Take for example [Fred Hebert](https://twitter.com/mononcqc/)'s classics [Queues Don't Fix Overload](https://ferd.ca/queues-don-t-fix-overload.html) and [Handling Overload](https://ferd.ca/handling-overload.html). Frameworks like [GenStage](https://hexdocs.pm/gen_stage/GenStage.html) are purely demand-driven.

Though, the before-mentioned examples are mostly from the backend side of things. But backpressure is not only a safeguard from overflow but also introduces the point of concurrency and parallelization. Imagine an intelligent Combine's `map` that would parallelize workload if given 20 or more items (like `AsyncSequence` 🙈).

## Behind the Facades

So, Combine not only helps to build message pipelines. Combine goes even further and orchestrates the data flow itself, twirls a pipeline's valves, keeps the system safe from overflows.

If the orchestration process sounds like an intimidating chore, well, it is. It's much more pleasant to interact with a well-polished facade and never dig to the pipeline's internals for sure:

- First of all, there are so many moving parts: `Publisher, Publishers, Subscriber, Subscription, Cancellable, Scheduler`.
- Secondly, Combine is (surprise-surprise) a closed-source project. Only a handful of people know its internals. The rest are left to speculations. For example, we still don't know how to build [thread-safe Publishers](https://twitter.com/a_grebenyuk/status/1388880562228809730) 🙈

It would be a minefield walk if not for [OpenCombine](https://github.com/OpenCombine/OpenCombine) and [CombineExt](https://github.com/CombineCommunity/CombineExt). Don't get me wrong, it still is a minefield walk, with explosion leftovers, body parts scattered here and there, smokes from the production builds. But this time, a smiling sergeant is marching ahead of you. Which is nothing but relieving, I guess.

## To the limit

Okay-okay, back to the business. Let's actually build the rate limiter :) By the way, what the heck is a rate limiter, and where can it be used? Say that you are ingesting large portions of data. It might be for the sake of data scrapping or a part of [Extract, transform, load](https://en.wikipedia.org/wiki/Extract,_transform,_load) process. Whatever it is, you certainly want to keep your appetites in check and don't accidentally DDoS your data sources.

That's why most public APIs are often rate-limited. So, rate limiting is an omnipresent system design pattern that keeps clients' traffic at bay. By the way, let's check out some real-world limit examples:

> The API is limited to 5 requests per second per base
> – [Airtable API](https://airtable.com/api/meta)

and

> You can make up to 5,000 requests per hour.
> – [Github API](https://docs.github.com/en/rest/reference/rate-limit)

How about expressing the limits in Combine's pipeline terms. We are dealing with a request count per a given time unit metric. Let's plan the rate limiter interface accordingly:

```swift
//Airtable's constraint
publisher.rateLimited(by: 5, per: .second(1))

// Github's constraint
publisher.rateLimited(by: 5000, per: .hour(1))

// Oh, let's drop a `scheduler` to count the passing time
publisher.rateLimited(by: 100, per: .second(30), scheduler: .main)
```

By the way, limits won't be limits if they never hit. So the next step of designing the rate limiter's interface is to know how to handle the limit hit. The plan is to queue the client's demand while the rate limit is on cooldown:

```swift
publisher.rateLimited(by: 5000, per: .hour(1), queue: .fifo)
```

A sound solution, though, something is not quite right here. I think that the `.fifo` is an acceptable strategy for most cases. But at the same time, it's a too opinionated solution. Perhaps `.filo` is a more appropriate strategy, what about timeout, oh, and don't forget queue priorities... 🥲 It's a tough choice to make, so let's work around it by providing the library's first extension point!

One can summarize a rate limiter as middleware between `Upstream` and `Downstream` that controls the pipeline's throughput. And we're looking for means to abstract the control behavior. And what can abstract concepts better than protocols? The end protocol might look like this:

```swift
protocol ThroughputStrategy {
    typealias Action = () -> Void
    func requestThroughput(_ action: @escaping Action)
}
```

I've decided to implicitly constraint the throughput rate by one value per action. I.e., `Downstream` can't demand 10 values in one go. It certainly reduces the interface's generality but drastically simplifies its implementation. As a side note, [CombineExt](https://github.com/CombineCommunity/CombineExt) has a superb example of a [demand buffer handling](https://github.com/CombineCommunity/CombineExt/blob/main/Sources/Common/DemandBuffer.swift) that can help us in the future.

Let's take the new protocol for a spin:

```swift
final class QueueStrategy: ThroughputStrategy { }

let strategy = QueueStrategy(rate: 2, interval: .seconds(1), scheduler: scheduler)

publisher.rateLimited(by: strategy)
```

Explicitly defined strategies are also sharable. The previous interface `.rateLimited(by:_ per:_ scheduler:_)` served as a single API's entry point. That might do for a globally constrained API (like [Airtable API](https://airtable.com/api/meta)). But for complex APIs with different sets of constraints, the single API entry point won't do. Check out the complete limits set of limits for the Github API 🤯

```swift
final class GithubClient {
    private lazy var unauthenticatedLimiter = QueueThroughputStrategy(
        rate: 60, interval: .minute(1), scheduler: scheduler
    )

    private lazy var authenticatedLimiter = QueueThroughputStrategy(
        rate: 5000, interval: .hour(1), scheduler: scheduler
    )

    private lazy var tokenApiLimiter = QueueThroughputStrategy(
        rate: 1000, interval: .hour(1), scheduler: scheduler
    )

    private lazy var searchAuthenticatedLimiter = QueueThroughputStrategy(
        rate: 30, interval: .minute(1), scheduler: scheduler
    )

    private lazy var searchUnauthenticatedLimiter = QueueThroughputStrategy(
        rate: 10, interval: .minute(1), scheduler: scheduler
    )

    // ...
}
```

## The Implementation

I'll spare you from the implementation details as you might check them [here](https://github.com/elfenlaid/rate-limiter). Though, I should brag that at last I've used [Swift Collections](https://github.com/apple/swift-collections)'s `Deque`! Also big shot-out to [Point Free](https://www.pointfree.co/) with [combine-schedulers](https://github.com/pointfreeco/combine-schedulers#testscheduler) package. Life would be much more difficult without the `TestScheduler` (yet another missed standard Combine class 🙈):

```swift
(1...5).publisher
    .rateLimited(by: strategy)
    .sink(receiveValue: { values.append($0) })
    .store(in: &cancellables)

(1...5).publisher
    .rateLimited(by: strategy)
    .sink(receiveValue: { values.append($0) })
    .store(in: &cancellables)

scheduler.advance(by: .seconds(0))

// Rate limiter starts immediately, and throughputs events up to the initial capacity:
print(values) // [1,1]

// Now the limiter waits for its interval to pass...
scheduler.advance(by: .seconds(1))

// ... to get another round of values
print(values) // [1,1, 2,2]
```

Also, times it's hard to wrap your head around custom publishers due to hairy implementation details. Sincerely speaking, I failed to come up with a better custom publisher's guide than "follow the example and see what happens." [`AnyPublisher.create`](https://github.com/CombineCommunity/CombineExt/blob/main/Sources/Operators/Create.swift) is a decent reference source.

## Here be Dragons

A word of warning, though. The current implementation is quite naive. It doesn't account for Upstream's shenanigans. For example, the rate limiter assumes that an `Upstream` issues only one request per demand unit. But it might be not true, say a network retry gets in a way, or DNS resolution took way too long and throttled the issued requests, or the `Upstream` might issue multiple requests by design.

Whatever it is, make sure that you've planned the limit hit scenario. Never mind the pattern (circuit breaker, delayed retry, etc.), make sure that it's there and, if possible, in the `Downstream`.

It's also hard to say whether the implementation is thread-safe. I've used it in my personal projects without noticeable issues. Though it might not be the case for you.

## Conclusion

That concludes the rate limiter showcase. As you can see, Combine's backpressure mechanics is quite a peculiar thing. It's a pity that most of the built-in publishers sorta ignore it and start with `unlimited` demand right off the bat.

Overall, if you think that Rx is an excellent reactive interface specification, you would also like Combine. But, unfortunately, it's not exactly my case. Don't get me wrong, Combine is a decent framework and certainly does its job. But, alas, it's a so PITA to work with. Not only due to custom publishers state, but even simple operations like retry can be [deceptively tricky to implement](https://twitter.com/DonnyWals/status/1389900253638406146).

It's ridiculous how many pain points a single decent official custom publisher example can help with. But we are not there yet. To be honest, WWDC 2021 wasn't a great year for Combine. High hopes for WWDC 2022, I guess 🤞

You can make anything, till next time :)
