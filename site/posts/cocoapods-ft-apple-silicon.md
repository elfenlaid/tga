---
date: 2021-04-14
title: CocoaPods Setup ft. Apple Silicon
subtitle: Skimming over possible Ruby setups, gems, bundler, and common gotchas
tags:
  - CocoaPods
  - iOS
  - Apple Silicon
  - M1
  - Ruby
  - macOS
---

The article describes [CocoaPods](https://cocoapods.org/) setup for Apple Silicon (`arch64`) machines. We're going to skim over possible Ruby Environment setups, discuss why and how pin gems versions, and how to resolve common issues.

[[toc]]

## Ruby Management

{% callout "info" %}
**tl;dr:**
- If you can roll with old Ruby (`~2.6.3`) - checkout [System Ruby](#system-ruby) solution
- Otherwise, I recommend to use [asdf](#asdf) or [rbenv](#rbenv)
{% endcallout %}

[CocoaPods](https://cocoapods.org/) is a Ruby gem or package. Therefore we can't get much done without a proper Ruby setup. We'll kick off the tutorial by discussing our Ruby environment options.

### System Ruby

{% callout "info" %}
**tl;dr:**
- Set [GEM_HOME](#system-ruby-gem_home)
- Set [PATH](##system-ruby-path)
{% endcallout %}

Fortunately for us, macOS has Ruby on board. It's a `2.6.3` version on Big Sur `11.2.3` at the time of writing. It's an outdated version and all, but let's be honest here, for most iOS projects, it might be enough 😬

Just imagine for a second, no Ruby environment juggling, and you are ready to roll from the start with a minimal setup. I assure you, it's nothing wrong with using the system Ruby. Especially so with arm-based machines:

```bash
$ file /usr/bin/ruby

/usr/bin/ruby: Mach-O universal binary with 2 architectures: [x86_64:Mach-O 64-bit executable x86_64] [arm64e:Mach-O 64-bit executable arm64e]
/usr/bin/ruby (for architecture x86_64):	Mach-O 64-bit executable x86_64
/usr/bin/ruby (for architecture arm64e):	Mach-O 64-bit executable arm64e
```

See that `file` output with 2 architectures? It means that the binary can run either natively or under Rosetta (`arch -x86_64 ruby`) emulation.

Does it matter? Well, sometimes Rosetta fails. For example, launching `arch -x86_64` scripts under `arch -x86_64` mode will fail with `arch: posix_spawnp: ruby: Bad CPU type in executable`. You might think that the example is a bit contrived. Alas, libraries' support for `M1` is a mess at the time of writing. So you happen to find a strange workaround here and there.

Universal binaries don't matter much in terms of local Ruby setup, but I guess it's fewer things to worry about.

#### System Ruby: GEM_HOME

Probably the main issue you'll encounter with the system Ruby is that `gem install` requires `sudo` by default.

But we can easily fix this by providing `GEM_HOME` environment variable:

```bash
# ~/.bash_profile or ~/.zshrc
export GEM_HOME="~/.gem/ruby/2.6.3/"

# fish shell
set -x GEM_HOME "~/.gem/ruby/2.6.3/"
```

After sourcing the config (or opening a new terminal tab), `gem install` no longer needs `sudo`. Try it by installing [bundler](#bundler) (`gem install bundler`). You'll probably need it later :)

#### System Ruby: PATH

By the way, you'll also need to add `~/.gem/ruby/2.6.3/bin` to your  `$PATH`. It's the home of gem executables (`bundler`, `pods`, `fastlane`):

```bash
# ~/.bash_profile or ~/.zshrc
export PATH="~/.gem/ruby/2.6.3/bin${PATH:+:${PATH}}"

# fish shell
set -U fish_user_paths "~/.gem/ruby/2.6.3/bin" $fish_user_paths
```

{% callout "info" %}
[Fishshell](https://fishshell.com/) users, please checkout [path.fish](https://gist.github.com/elfenlaid/46f7f908d82bed0dd95e29c5ee618284) function to simplify `$PATH` handling.
{% endcallout %}

### Homebrew

{% callout "info" %}
**tl;dr:**
- Install [Homebrew](https://brew.sh/)
- `brew install ruby@3` and follow the provided instructions
{% endcallout %}

If you don't swap Ruby versions, but need something other than the [system Ruby version](#system-ruby), then [Homebrew](https://brew.sh/) is here for you.

[Homebrew](https://brew.sh/) has a [collection of precompiled Ruby versions](https://formulae.brew.sh/api/formula/ruby.json). The group included  `2.4, 2.5, 2.6, 2.7, 3.0` versions at the time of writing. You can specify version via:

```bash
$ brew install ruby@3.0

If you need to have ruby first in your PATH, run:
  echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
...
```

I'll leave you in the good hands of [Homebrew](https://brew.sh/) for the subsequent setup. All you need to do is to follow the provided instructions.

Mind that you can install as many versions as you need. Though the swapping between them is passable at best. Another downside of [Homebrew](https://brew.sh/) is its precompiled versions range. If your version is not on the list, well, `brew` won't help you here.

Also, specific Ruby versions are drift with time. For example, `ruby@3` installs `3.0.1` today, but tomorrow's `ruby@3` will install `3.0.2` or something entirely different.

Despite all the downsides and inconveniences, it's a sensible path to take to avert Ruby compilation (some [RVM](#rvm) hacks use this [Homebrew](https://brew.sh/) feature).

### RVM

{% callout "info" %}
**tl;dr:**
- Follow the official [RVM](https://rvm.io/) instructions
- Also, mind I interest you in switching to something [else](#asdf) 🤔
{% endcallout %}

[RVM](https://rvm.io/) stands for Ruby Version Manager and is considered a classical approach to managing the Ruby environment.

There're already tons of guides on installing [RVM](https://rvm.io/). Therefore I leave you here.

As far as Apple Silicon is concerned, you might find the [RVM](https://rvm.io/) ride to be a bit bumpy: [Unable to install any version of ruby on macOS Big Sur · Issue #5047 · rvm/rvm](https://github.com/rvm/rvm/issues/5047). Some workarounds, including installing [Homebrew](https://brew.sh/) versions, are specified in the discussion.

[RVM](https://rvm.io/) is more than capable of providing a decent Ruby environment. Nevertheless, my take is [RVM](https://rvm.io/) feels too hacky. It loads in the shell, overrides `cd`, or requires additional prompt mockery. I often find the [rbenv](#rbenv) or [asdf](#asdf) to be a better choice.

### rbenv

{% callout "info" %}
**tl;dr:**
- `brew install rbenv` and follow instructions
- [Custom installation instructions](https://github.com/rbenv/rbenv#installation)
{% endcallout %}

[rbenv](https://github.com/rbenv/rbenv) is yet Ruby environment manager. Alas, a less popular one. It works via `PATH` directories prioritization trick ([How `rbenv` works](https://github.com/rbenv/rbenv#how-it-works) it details). So, no side scripts and other shell override shenanigans in the background ([RVM](#rvm) 👀)

It also has a dedicated page for [`rbenv` vs `RVM` comparison](https://github.com/rbenv/rbenv/wiki/Why-rbenv%3F) if you are into it.

The main `rbenv`'s' drawback for `arm64` architecture is that some Ruby versions require [unconventional installation approach](https://github.com/rbenv/ruby-build/issues/1691). Nevertheless, `rbenv` is genuinely good. It was my Ruby environment manager before [asdf](#asdf).

### asdf

{% callout "info" %}
**tl;dr:**
- follow the [official install instructions](https://asdf-vm.com/#/core-manage-asdf?id=install)
- install Ruby plugin `asdf plugin-add ruby https://github.com/asdf-vm/asdf-ruby.git`
- install required version `asdf install ruby 3.0.0 && asdf ruby global 3.0.0`
{% endcallout %}

[asdf](https://github.com/asdf-vm/asdf) is an extendable version manager with support for [Ruby](https://github.com/asdf-vm/asdf-ruby), [Node.js](https://github.com/asdf-vm/asdf-nodejs), [Elixir](https://github.com/asdf-vm/asdf-elixir), [Erlang](https://github.com/asdf-vm/asdf-erlang), and [more](https://asdf-vm.com/#/plugins-all). The principle behind `asdf` is similar to `rbenv`, both use `PATH` directories prioritization.

[Official documentation](https://asdf-vm.com/#/core-manage-asdf?id=install) is genuinely good. Alas, an installation process might turn a bit cryptic, especially considering [Common Homebrew issues 🍻 · Issue #785](https://github.com/asdf-vm/asdf/issues/785). I'm personally using the plain `git clone` method here (don't forget to subscribe to [asdf releases on GitHub](https://github.com/asdf-vm/asdf))

[asdf Ruby plugin](https://github.com/asdf-vm/asdf-ruby) aside from managing Ruby environments, also can:
  - Install [default gems](https://github.com/asdf-vm/asdf-ruby#default-gems) right after installing a Ruby versions. Presumably, you want `bundler`, `pry`, or gems of your choice to be available on each and every installed Ruby version.
  - Help with [migrating from other Ruby version managers](https://github.com/asdf-vm/asdf-ruby#migrating-from-another-ruby-version-manager). Meaning it supports `.ruby-version` configuration file

[asdf](https://github.com/asdf-vm/asdf) seems to go well along M1 and builds most Ruby versions just fine. Alas, [there are nuances](https://github.com/asdf-vm/asdf-ruby/issues/210)

If you got tired of a never-ending stream of language managers, check out [asdf](https://github.com/asdf-vm/asdf). Despite a bit messy setup, it's dope!

## Gems Management

{% callout "info" %}
**tl;dr:** use [bundler](#bundler)
{% endcallout %}

At this point, I presume you have a working Ruby setup. Check out the [Ruby management](#ruby-management) chapter if it's not the case.

It's a great temptation to globally install [CocoaPods](https://cocoapods.org/)(`gem install cocoapods`) and jump straight into the project. But hear me out, knowing (version control) the exact gem version we work with is always a good idea.

I'm sure you want to get the same result from running `pod install` on your machine and on a college's machine or a build server. Even if you an indie developer, there's a notion of time. Your future self will have a different setup. Imagine how happy you'll be after enumerating [CocoaPods](https://cocoapods.org/) and Ruby versions for the whole day just to reproduce a particular build. The pinned or at least known version of tooling never harms.

With that out of the way, let's discuss how we can pin gem versions in the Ruby environment.

### Bundler

[bundler](https://bundler.io) is sort of [CocoaPods](https://cocoapods.org/) but for Ruby gems. From the side, [bundler](https://bundler.io) looks like a complete Xzibit thing: installing package manage to manage package manager while managing packages.

Alas, while sounding like insanity, it's a surprisingly reoccurring theme. For example, Python with `easy_install`, `pip`, and `pipenv` or Haskell and its `slack` + `cabal` pairing.

[CocoaPods](https://cocoapods.org/) is heavily inspired by [bundler](https://bundler.io), and indeed we can draw a lot of parallels between them:

- `Gemfile` is analog to `Podfile`
- `Gemfile.lock` is analog to `Podfile.lock`

By the way, [CocoaPods](https://cocoapods.org/) themselves [use bundler](https://github.com/CocoaPods/CocoaPods/blob/master/Gemfile). And as you can see, bundler doesn't the hardest setup: process:

1. Create a `Gemfile` (or use `bundle init`) and specify required dependencies. A typical iOS project `Gemfile`:

```ruby
# frozen_string_literal: true

source 'https://rubygems.org'

gem 'cocoapods'
gem 'fastlane'
```

2. Install specified dependencies with `bundle install`. At this stage `bundler` generates dependency tree in `Gemfile.lock` file:

```ruby
GEM
  remote: https://rubygems.org/
  specs:
    CFPropertyList (3.0.3)
    activesupport (5.2.4.5)
      concurrent-ruby (~> 1.0, >= 1.0.2)
      i18n (>= 0.7, < 2)
      minitest (~> 5.1)
...
```

Don't forget to check in `Gemfile.lock` to the source control or pin the exact gem versions in the `Gemfile`.

3. Run commands with `bundle exec` prefix:

```bash

$ bundle exec pod install

```

You might add an alias `alias be="bundle exec"` to avoid typing `bundle exec` over and over again:

```bash

$ be pod install

```

Also, most of the shells have a dedicated `bundler` plugin with completions:

- [ohmyzsh/plugins/bundler at master · ohmyzsh/ohmyzsh](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/bundler)
- [oh-my-fish/plugin-bundler: Use Ruby's Bundler automatically for some commands.](https://github.com/oh-my-fish/plugin-bundler)
- `brew` comes with a [bundler-completion formulae](https://formulae.brew.sh/formula/bundler-completion)

4. (Optional) `bundler` can pin [Ruby version](https://bundler.io/gemfile_ruby.html) as well:

```ruby
ruby '~> 2.6.0'
# or
ruby '3.0.1'
```

You might consider using this method, but it depends on your Ruby environment manager of choice. Some managers use `.ruby-version` or `.tool-versions` file mechanisms.

### Gemset

A lesser-known option of handling gem versions is a `gemset`. Gemset is a snapshot of globally installed gems. Both [RVM](https://rvm.io/gemsets) and [rbenv](https://github.com/jf/rbenv-gemset) support a gemset-like notion. Alas, [asdf Ruby plugin don't and won't have it](https://github.com/asdf-vm/asdf-ruby/issues/25)

From the first take, gemsets won't work well in "long-term" projects. Yet, it can be helpful in one-shot scripts or library tryouts. Nevertheless, I wholeheartedly recommend sticking to [bundler](#bundler). But if you have a `bundler` reckoning, I guess gemsets are better than nothing :)

## Pods Management

Hey, we're getting closer! At this point, I presume you have a working Ruby setup and installed [CocoaPods](https://cocoapods.org/) (either via [bundler](#bundler) or globally). It it's not the case, consider skimming through [Ruby environment management](#ruby-management) and [gems management](#gems-management) parts.

Aside from few quirks, there's nothing new to running [CocoaPods](https://cocoapods.org/) under Apple Silicon. Alas, [CocoaPods doesn't officially support Apple Silicon](https://github.com/CocoaPods/CocoaPods/issues/10408) at the moment of writing. With that said, CocoaPods run perfectly fine under Rosetta and times even natively.

Our end goal is a project setup that runs on both `arm64` and `x86` simulators. Such configuration allows a graceful migration without sacrificing simulator performance.

Firstly, we'll see that `pod install` works as expected. Secondly, we'll build a project and discuss possible build issues.

### Pod Install Quirks

If you are lucky enough, `pod install` or `bundle exec pod install` won't cause any issues on your machine. If that's the case, move along to the [project setup](#project-setup) chapter.

If not, well, here's the most common issue with [CocoaPods](https://cocoapods.org/) out there:

#### `ffi` error

`pod install` exists with a `ffi`-related exception:

```bash
$ bundle exec pod install
...
LoadError - dlsym(0x7fc182ca67b0, Init_ffi_c): symbol not found - /Library/Ruby/Gems/2.6.0/gems/ffi-1.14.2/lib/ffi_c.bundle
...
```

Turns out, `ffi` is also [waiting for M1 adoption](https://github.com/libffi/libffi/pull/621) and probably will get one in `3.4` version.

Depending on your setup, try the following steps if you're using [bundler](#bundler):

- Pin `ffi` in `Gemfile`: `gem 'ffi', '1.14.2'`
- Run `bundler install` (You'll probably need to delete `Gemfile.lock` beforehand)
- Run `pod install` under Rosetta: `arch -x86_64 bundle exec pod install`

If you have a global CocoaPods pod installed, the steps are mostly the same, but instead, you'll need to pin `ffi` globally: `gem install ffi -v 1.14.2`

### Project Setup

At last, it's time to build and run the project! Select iOS simulator target and launch the build process. Take my congratulations 🎉 if everything works fine. It was a long way. I wasn't that lucky and faced another bunch of issues.

First of all, if the project was create in Xcode 11 or older, make sure to get rid of `VALID_ARCHS` build setting:

- `VALID_ARCHS` is [no longer a thing in Xcode 12](https://developer.apple.com/documentation/xcode-release-notes/xcode-12-release-notes)
  - Remove it from build settings (in user-defined variables) and config files
- `VALID_ARCHS` setting was replaced by `EXCLUDED_ARCHS`. Update it accordingly or leave empty
- Optionally (but highly recommended) to have `ONLY_ACTIVE_ARCH = YES` for `Debug` builds
  - Make sure that it's set to `ONLY_ACTIVE_ARCH = NO` for `Release`. Xcode doesn't care about `ONLY_ACTIVE_ARCH` when assembling the `Release` for a general device. Yet, let's keep things explicit, shall we?

#### `EXCLUDED_ARCHS` shenanigans

You've built the project only to face the following error:

```bash
Showing Recent Errors Only
~/Work/quotes/Quotes/Sources/Scenes/Premium/PremiumScene.swift:5:8: Could not find module 'Analytics' for target 'arm64-apple-ios-simulator'; found: x86_64-apple-ios-simulator, x86_64
```

Some CocoaPods vendors add a nasty quick-fix to work around [Xcode 12 VALID_ARCHS](https://developer.apple.com/documentation/xcode-release-notes/xcode-12-release-notes) deprecation:

```ruby
Pod::Spec.new do |s|
  # ...
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
  s.pod_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
  # ...
end
```

These two lines force Xcode to skip assembling the `arm64` simulator slice and failing the build.

{% callout "info" %}
Tweaking `user_target_xcconfig` in a `Podspec` is a big NO-NO. Please, consider other methods.
{% endcallout %}

To fix the issues we're going to patch the project and libraries `.xcconfig` files:

```ruby
post_install do |pi|
  pi.target_installation_results.each do |result|
    result.each do |name, installation_result|
      target = installation_result.target
      installation_result.native_target.build_configurations.each do |config|
        config_path = target.xcconfig_path(config.name)
        next unless config_path.exist?

        config_data = config_path.read
        config_data.gsub!("EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64", "")
        File.write(config_path, config_data)
      end
    end
  end
end
```

I find it as a rather dirty solution, but that's the reality we live in. Also, keep in mind that tweaking `build_settings` alone won't cut here.

#### Missing `arm64` Simulator Slice

`pod install` runs just fine, but the project won't build with the following error:

```bash
ld: in ../../SpotifyiOS.framework/SpotifyiOS(MPMessagePackReader.o), building for iOS Simulator, but linking in object file built for iOS, file '../../SpotifyiOS.framework/SpotifyiOS' for architecture arm64
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

We've encountered a close-sourced (framework or library) dependency that doesn't have an `arm64` Simulator slice. Alas, we can't do much here unless [you're brave enough 🙈](https://github.com/bogo/arm64-to-sim)

The thing is, classic fat Mach-O libraries can't have two slices of `arm64` architecture. The trick works only with the new [XCFramework]([Distributing Binary Frameworks as Swift Packages | Apple Developer Documentation](https://developer.apple.com/documentation/swift_packages/distributing_binary_frameworks_as_swift_packages)). You can find more about XCFrameworks here:

- [Supporting XCFrameworks | PSPDFKit](https://pspdfkit.com/blog/2020/supporting-xcframeworks/)
- [XCFrameworks | kean.blog](https://kean.blog/post/xcframeworks-caveats)

The quick fix is to launch Xcode under Rosetta (`arch -x86_64 xed .`) and notify a third-party vendor.

## Conclusion (or Rant)

iOS package management is living through its wild west. The advent of new architecture surely doesn't make things easier either. For now, I hope that you found the guide helpful.

Despite all the rough edges, I can't thank the iOS community enough. [CocoaPods](https://cocoapods.org/) team deliver the best experience possible and even more. I only wish for Apple to stop pretending CocoaPods doesn't exist in the first place.

It's hard to make any calls but just imagine a graceful Swift Package Manager migration or proactively making CocoaPods support a new Xcode change. How cool would that be, huh? 🤔

You can make anything, till next time :)
