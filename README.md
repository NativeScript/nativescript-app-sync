# NativeScript plugin for CodePush

This plugin provides client-side integration for the [CodePush service](http://codepush.tools),
allowing you to easily add a dynamic update experience to your NativeScript app(s).

> BEWARE: Sometime June 2017 it is expected you can no longer create new CodePush apps anymore. Apps created beforehand will continue to work for the foreseeable future though. The exact date? Unknown, but you'll notice when trying to create an app with the CodePush CLI.

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push
[npm-image]:http://img.shields.io/npm/v/nativescript-code-push.svg
[npm-url]:https://npmjs.org/package/nativescript-code-push
[downloads-image]:http://img.shields.io/npm/dm/nativescript-code-push.svg

## How does it work?
A NativeScript app is composed of XML/HTML, CSS and JavaScript files and any accompanying images, which are bundled together by the NativeScript CLI and distributed as part of a platform-specific binary (i.e. an .ipa or .apk file). Once the app is released, updating either the code (e.g. making bug fixes, adding new features) or image assets, requires you to recompile and redistribute the entire binary, which of course, includes any review time associated with the store(s) you are publishing to.

The CodePush plugin helps get product improvements in front of your end users instantly, by keeping your code and images synchronized with updates you release to the CodePush server. This way, your app gets the benefits of an offline mobile experience, as well as the "web-like" agility of side-loading updates as soon as they are available. It's a win-win!

In order to ensure that your end users always have a functioning version of your app, the CodePush plugin maintains a copy of the previous update, so that in the event that you accidentally push an update which includes a crash, it can automatically roll back. This way, you can rest assured that your newfound release agility won't result in users becoming blocked before you have a chance to roll back on the server. It's a win-win-win!

### What can be CodePushed?
- Anything inside your `/app` folder.
- Anything inside your `/node_modules` folder.

### What can't (and won't):
- NativeScript platform updates. Example: bumping `tns-android` from version 2.5.1 to 2.5.2.
- Plugins updates that also require a different version of a native library it depends on.

So as long as you don't change versions of dependencies and tns platforms in your `package.json` you
can push happily. And if you do bump a version of a dependency make sure there are no changed platform libraries.

## Getting Started
Follow the general-purpose ["getting started"](http://microsoft.github.io/code-push//docs/getting-started.html) instructions for setting up your CodePush account.
Make sure you're creating seperate CodePush apps for iOS and Android and remember the deployment keys (if you forget them, grab them via `code-push deployment ls APP_NAME -k`).

Now install this plugin:

```shell
tns plugin add nativescript-code-push
```

If you're restricting access to the internet from within your app, make sure you whitelist these domains:

- https://codepush.azurewebsites.net
- https://codepush.blob.core.windows.net
- https://codepushupdates.azureedge.net

## Checking for updates
With the CodePush plugin installed and configured, the only thing left is to add the necessary code to your app to control when it checks for updates.
If an update is available, it will be silently downloaded, and installed the next time the app is restarted (so a cold boot, triggered either explicitly by the end user or by the OS), which ensures the least invasive experience for your end users.
In the future we may add an option to reload the app instantly or upon resuming.

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
import { CodePush, SyncStatus } from "nativescript-code-push";
import { isIOS } from "platform";

CodePush.sync({
    deploymentKey: isIOS ? "your-ios-deployment-key" : "your-android-deployment-key"
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
import * as application from "application";

// add this in some central place that's executed once in a lifecycle
application.on(application.resumeEvent, () => {
  CodePush.sync(...);
});
```

## Releasing updates
Once your app has been configured and distributed to your users, and you've made some code and/or asset changes,
it's time to instantly release them! The simplest way to do this is to use the `release-nativescript` command in the CodePush CLI,
but while that's a [pending pull request](https://github.com/Microsoft/code-push/pull/435) it's a two-step process instead of only one:

### iOS

```shell
cd <appname>/platforms/ios/<appname>/
code-push release <codepush-ios-appname> app "1.0.0"
```

### Android

```shell
cd <appname>/platforms/android/src/main/assets/
code-push release <codepush-android-appname> app "1.0.0"
```

*NOTE: Currently it's vital you `cd` to the folder mentioned above as we need to push the platform-specific `app` folder.
Make sure that the app folder is a release-gradle build, so use the same command that you use for AppStore distribution,
just don't send it to the AppStore. You can even webpack bundle your app, it's all transparent to this plugin.* 

*NOTE: When releasing updates to CodePush, you do not need to bump your app's version, since you aren't modifying the app store version at all.
CodePush will automatically generate a "label" for each release you make (e.g. `v3`) in order to help identify it within your release history.*

There are a few options you may want to pass in:

```shell
# Release an update that targets users running any 1.*.* binary, as opposed to everyone ("*") or a specific version (1.0.0)
code-push release CodePushDemo-iOS app "~1.0.0"

# Release an update with a changelog
code-push release CodePushDemo-iOS app "~1.0.0" --description "Fun times!"

# Release a dev Android build to just 1/4 of your end users
code-push release CodePushDemo-iOS app "~1.0.0" --description "Fun times!" --rollout 25%
```

The CodePush client supports incremental updates, so even though you are releasing your entire app code on every update,
your end users will only actually download the files they need. The service handles this automatically so that you can focus on
creating awesome apps and we can worry about optimizing end user downloads.

## Testing CodePush packages during development
You may want to play with CodePush before using it in production (smart move!).
Perform these steps once you've pushed an update and added the `sync` command:

- `tns run [ios|android] --no-watch --clean`
- kill the app after the update is installed
- restart the app

> Note that (at least on Android) that `--no-watch` is really required as otherwise LiveSync will mess with your test!

## Future enhancements

### Fix reporting
Using a command like this would normally tell you how many apps have the update installed,
but that's currently work in progress, so don't freak out if it says 'No installs recorded':

```bash
code-push deployment history <app-name> Staging
```

### Support on-resume reloads
I haven't investigated this possibility yet. If it can be pulled off we'll add an option to the `sync` command.
