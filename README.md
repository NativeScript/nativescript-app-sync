# NativeScript plugin for CodePush

This plugin provides client-side integration for the [CodePush service](http://codepush.tools),
allowing you to easily add a dynamic update experience to your NativeScript app(s).

> BEWARE: Sometime June 2017 it is expected you can no longer create new CodePush apps anymore. Apps created beforehand will continue to work for the foreseeable future though. The exact date? Unknown, but you'll notice when trying to create an app with the CodePush CLI.

> UPDATE june 19 2017: The aforementioned change has been made; sadly no new CodePush NativeScript apps can be created. See [this issue](https://github.com/Microsoft/code-push/pull/435) for details.

> 📣 📣 📣 UPDATE may 9 2019: we're considering rebooting our efforts. Stay tuned!

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push
[npm-image]:http://img.shields.io/npm/v/nativescript-code-push.svg
[npm-url]:https://npmjs.org/package/nativescript-code-push
[downloads-image]:http://img.shields.io/npm/dm/nativescript-code-push.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

## How does it work?
A NativeScript app is composed of XML/HTML, CSS and JavaScript files and any accompanying images, which are bundled together by the NativeScript CLI and distributed as part of a platform-specific binary (i.e. an .ipa or .apk file). Once the app is released, updating either the code (e.g. making bug fixes, adding new features) or image assets, requires you to recompile and redistribute the entire binary, which of course, includes any review time associated with the store(s) you are publishing to.

The CodePush plugin helps get product improvements in front of your end users instantly, by keeping your code and images synchronized with updates you release to the CodePush server. This way, your app gets the benefits of an offline mobile experience, as well as the "web-like" agility of side-loading updates as soon as they are available. It's a win-win!

In order to ensure that your end users always have a functioning version of your app, the CodePush plugin maintains a copy of the previous update, so that in the event that you accidentally push an update which includes a crash, it can automatically roll back. This way, you can rest assured that your newfound release agility won't result in users becoming blocked before you have a chance to roll back on the server. It's a win-win-win!

_To confuse you even more, have a diagram:_

<img src="https://github.com/EddyVerbruggen/nativescript-code-push/raw/master/media/NativeScript%20CodePush%20landscape.png" width="570px" height="508px">

### What can be CodePushed?
- Anything inside your `/app` folder.
- Anything inside your `/node_modules` folder.

### What can't (and won't):
- NativeScript platform updates. Example: bumping `tns-android` from version 2.5.1 to 2.5.2.
- Plugins updates that also require a different version of a native library it depends on.

So as long as you don't change versions of dependencies and tns platforms in your `package.json` you
can push happily. And if you do bump a version of a dependency make sure there are no changed platform libraries.

## Getting Started
TODO test this workflow!

#### Globally install the NativeScript-compatible CodePush CLI

```shell
npm i -g nativescript-code-push-cli
```

#### Login or register with the service

Log in if you already have an account:

```shell
nativescript-code-push login
```

Register if you don't have an account yet:

```shell
nativescript-code-push register
```

#### Register your app with the service
Create an app for each OS you target:

```shell
nativescript-code-push app add MyApp-IOS ios nativescript
nativescript-code-push app add MyApp-Android android nativescript
```

> This will show you your deployment keys you'll need when connecting to the CodePush server.

#### List your registered apps

```shell
nativescript-code-push app ls
```

#### Add this plugin to your app

```shell
tns plugin add nativescript-code-push
```

> If you're restricting access to the internet from within your app, make sure you whitelist `https://nativescript-codepush-server.herokuapp.com`.

## Checking for updates
With the CodePush plugin installed and configured, the only thing left is to add the necessary code to your app to control when it checks for updates.

If an update is available, it will be silently downloaded, and installed the next time the app is restarted
(so a cold boot, triggered either explicitly by the end user or by the OS),
which ensures the least invasive experience for your end users.
In the future we may add an option to reload the app instantly or upon resuming.

> Also check out the [demo](/demo) for a solid example.

```typescript
// import the main plugin classes
import { CodePush } from "nativescript-code-push";

// and at some point in your app:
CodePush.sync({
  deploymentKey: "your-deployment-key"
});
```

If you have an iOS and Android app, and want some feedback during the sync, you can use this more elaborate version instead:

```typescript
import { CodePush, InstallMode, SyncStatus } from "nativescript-code-push";
import { isIOS } from "tns-core-modules/platform";

CodePush.sync({
    deploymentKey: isIOS ? "your-ios-deployment-key" : "your-android-deployment-key",
    installMode: InstallMode.ON_NEXT_RESTART, // this is the default, and at this moment the only option
    serverUrl: "https://your-backend.server"  // by default this is our shared cloud hosted backend server
  }, (syncStatus: SyncStatus): void => {
    console.log("CodePush syncStatus: " + syncStatus);
    if (syncStatus === SyncStatus.UP_TO_DATE) {
      console.log("CodePush: no pending updates; you're running the latest version!");
    } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
      console.log("CodePush: update installed - it will be activated upon next cold boot");
    }
});
```

It's recommended to check for updates more than once in a cold boot cycle, so it may be easiest to
tie this check to the `resume` event:

```typescript
import * as application from "tns-core-modules/application";

// add this in some central place that's executed once in a lifecycle
application.on(application.resumeEvent, () => {
  CodePush.sync(...);
});
```

## Releasing updates
Once your app has been configured and distributed to your users, and you've made some code and/or asset changes,
it's time to instantly release them!

The easiest way to do this is to use the `release-nativescript` command in our CodePush CLI. Its (most relevant) options are:

|param|alias|default|description
|---|---|---|---
|deploymentName|d|Staging|Deploy to either "Staging" or "Production".
|description|des||Description of the changes made to the app with this release.
|targetBinaryVersion|t||Semver expression that specifies the binary app version(s) this release is targeting (e.g. 1.1.0, ~1.2.3).
|rollout|r|100%|Percentage of users this release should be available to. The `%` sign is optional.

### iOS

```shell
nativescript-code-push release-nativescript <codepush-ios-appname> ios # deploy to Staging
nativescript-code-push release-nativescript <codepush-ios-appname> ios --d Production # deploy to Production (default: Staging)
nativescript-code-push release-nativescript <codepush-ios-appname> ios --targetBinaryVersion ~1.0.0 # release to users running any 1.x version (default: the exact version in Info.plist)
nativescript-code-push release-nativescript <codepush-ios-appname> ios --rollout 25 --description "My awesome iOS version" # percentage of users this release should be immediately available to (default: 100) 
```

### Android

```shell
nativescript-code-push release-nativescript <codepush-android-appname> android # deploy to Staging
nativescript-code-push release-nativescript <codepush-android-appname> android --d Production # deploy to Production (default: Staging)
nativescript-code-push release-nativescript <codepush-android-appname> android --targetBinaryVersion ~1.0.0 # release to users running any 1.x version (default: the exact version in AndroidManifest.xml)
```

### Tips
> Make sure to create a release build first, so use the same command that you'd use for app store distribution, just don't send it to the AppStore. You can even webpack bundle and uglify your app, it's all transparent to this plugin. 

> When releasing updates to CodePush, you do not need to bump your app's version since you aren't modifying the app store version at all. CodePush will automatically generate a "label" for each release you make (e.g. `v3`) in order to help identify it within your release history.

### Did folks install the update?
Using a command like this will tell you how many apps have the update installed:

```shell
nativescript-code-push deployment history <codepush-ios-appname> Staging
```

## Testing CodePush packages during development
You may want to play with CodePush before using it in production (smart move!).
Perform these steps once you've pushed an update and added the `sync` command to your app:

- `$ tns run <platform>`. On an iOS device add the `--release` flag so LiveSync doesn't interfere.
- kill and restart the app after the update is installed

## Future enhancements
Support on-resume reloads. I haven't investigated this possibility yet. If it can be pulled off we'll add an option to the `sync` command.
