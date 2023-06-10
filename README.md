# NativeScript AppSync plugin

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-app-sync.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-app-sync
[npm-image]:http://img.shields.io/npm/v/nativescript-app-sync.svg
[npm-url]:https://npmjs.org/package/nativescript-app-sync
[downloads-image]:http://img.shields.io/npm/dm/nativescript-app-sync.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

A live-update service for your NativeScript apps!

> 📣 **NOTE:** NativeScript AppSync is currently in beta and is *not supported* by the core NativeScript team. AppSync is based on [Microsoft CodePush](https://github.com/microsoft/code-push) and we owe them thanks because this solution builds upon their work. ❤️

<details>
 <summary>Optional reading: what this is, and how it works</summary>

A NativeScript app is composed of XML/HTML, CSS and JavaScript files and any accompanying images, which are bundled together by the NativeScript CLI and distributed as part of a platform-specific binary (i.e. an .ipa or .apk file). Once the app is released, updating either the code (e.g. making bug fixes, adding new features) or image assets, requires you to recompile and redistribute the entire binary, which of course, includes any review time associated with the store(s) you are publishing to.

The AppSync plugin helps get product improvements in front of your end users instantly, by keeping your code and images synchronized with updates you release to the AppSync server. This way, your app gets the benefits of an offline mobile experience, as well as the "web-like" agility of side-loading updates as soon as they are available. It's a win-win!

In order to ensure that your end users always have a functioning version of your app, the AppSync plugin maintains a copy of the previous update, so that in the event that you accidentally push an update which includes a crash, it can automatically roll back. This way, you can rest assured that your newfound release agility won't result in users becoming blocked before you have a chance to roll back on the server. It's a win-win-win!

<img src="https://github.com/EddyVerbruggen/nativescript-app-sync/raw/master/media/NativeScript%20AppSync%20landscape%20v2.png" width="570px" height="508px">

_Architectural overview of the solution - you don't need to worry about all of this_

</details>

### What can (and will) be AppSync'ed?
- Anything inside your `/app` folder (but not the `App_Resources` folder).
- Anything inside your `/node_modules` folder.

> 💁‍♂️ Note that we don't actually use those folders, but the `app` folder in `platforms/ios/<appname>/app` and `platforms/android/app/src/main/assets/app`, the benefit of which is we don't "care" if you use Webpack or Uglify or whatever tools you use to minify or scramble your app's assets.

### What can't (and won't):
- NativeScript platform updates. Example: bumping `tns-android` from version 2.5.1 to 2.5.2.
- Plugins updates that also require a different version of a native library it depends on.
- Contents of the `App_Resources` folder, because those are part of the native binary as well.

So as long as you don't change versions of dependencies and tns platforms in your `package.json` you
can push happily. And if you do bump a version of a dependency make sure there are no changed platform libraries.

## Getting Started

#### Globally install the NativeScript AppSync CLI

```shell
npm i -g nativescript-app-sync-cli
```

> 💁‍♂️ This will also add the global `nativescript-app-sync` command to your machine. You can check the currently installed version with `nativescript-app-sync -v`.

#### Login or register with the service

Check if you're already logged in, and with which email address:

```shell
nativescript-app-sync whoami
```

Log in if you already have an account:

```shell
nativescript-app-sync login
```

Register if you don't have an account yet:

```shell
nativescript-app-sync register
```

This will open a browser where you can provide your credentials, after which you can create an access key that
you can paste in the console.

You should now have a `.nativescript-app-sync.config` file in your home folder which will automatically
authenticate you with the server on this machine from now on.

> Note that you _could_ use a that web interface for managing you apps, but the CLI is much more sophisticated, so it's recommended to use the command line interface.

To log out, you can run `nativescript-app-sync logout` which will also remove the config file.

To perform a headless login (without opening a browser), you can do: `nativescript-app-sync login --accessKey <access key>`.

#### Register your app with the service
Create an app *for each platform you target*. That way you can roll out release seperately for iOS and Android.

> ⚠️ The `appname` must be unique, and should not contain dashes (`-`).

```shell
nativescript-app-sync app add <appname> <platform>

# examples:
nativescript-app-sync app add MyAppIOS ios
nativescript-app-sync app add MyAppAndroid android
```

> 💁‍♂️ This will show you your deployment keys you'll need when connecting to the AppSync server. If you want to list those keys at any later time, use `nativescript-app-sync deployment ls <appName> --displayKeys`.

> 💁‍♂️ All new apps automatically come with two deployments (`Staging` and `Production`) so that you can begin distributing updates to multiple channels. If you need more channels/deployments, simply run: `nativescript-app-sync deployment add <appName> <deploymentName>`.

> 💁‍♂️ Want to rename your app? At any time, use the command: `nativescript-app-sync app rename <oldName> <newName>`

> 💁‍♂️ Want to delete an app? At any time, use the command: `nativescript-app-sync app remove <appName>` - this means any apps that have been configured to use it will obviously stop receiving updates.

#### List your registered apps

```shell
nativescript-app-sync app ls
```

#### Add this plugin to your app

```shell
tns plugin add nativescript-app-sync
```

> ⚠️ If you're restricting access to the internet from within your app, make sure you whitelist our AppSync server (`https://appsync-server.nativescript.org`) and File server (`https://s3.eu-west-1.amazonaws.com`).

## Checking for updates
With the AppSync plugin installed and configured, the only thing left is to add the necessary code to your app to control when it checks for updates.

If an update is available, it will be silently downloaded, and installed.
 
Then based on the provided `InstallMode` the plugin either waits until the next cold start (`InstallMode.ON_NEXT_RESTART`),
warm restart (`InstallMode.ON_NEXT_RESUME`), or a positive response to a user prompt (`InstallMode.IMMEDIATE`).

Note that Apple doesn't want you to prompt the user to restart your app, so use `InstallMode.IMMEDIATE` on iOS only for Enterprise-distributed apps (or when testing your app through TestFlight for instance).

> 💁‍♂️ Check out the [demo](/demo) for a solid example.

```typescript
// import the main plugin classes
import { AppSync } from "nativescript-app-sync";

// and at some point in your app:
AppSync.sync({
  deploymentKey: "your-deployment-key" // note that this key depends on the platform you're running on (see the example below)
});
```

There's a few things you can configure - this TypeScript example has all the possible options:

```typescript
import { AppSync, InstallMode, SyncStatus } from "nativescript-app-sync";
import { isIOS } from "tns-core-modules/platform";

AppSync.sync({
    enabledWhenUsingHmr: false, // this is optional and by default false so AppSync and HMR don't fight over app updates
    deploymentKey: isIOS ? "your-ios-deployment-key" : "your-android-deployment-key",
    installMode: InstallMode.ON_NEXT_RESTART, // this is the default install mode; the app updates upon the next cold boot (unless the --mandatory flag was specified while pushing the update) 
    mandatoryInstallMode: isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE, // the default is InstallMode.ON_NEXT_RESUME which doesn't bother the user as long as the app is in the foreground. InstallMode.IMMEDIATE shows an installation prompt. Don't use that for iOS AppStore distributions because Apple doesn't want you to, but if you have an Enterprise-distributed app, go right ahead!
    updateDialog: { // only used for InstallMode.IMMEDIATE
      updateTitle: "Please restart the app", // an optional title shown in the update dialog 
      optionalUpdateMessage: "Optional update msg",   // a message shown for non-"--mandatory" releases 
      mandatoryUpdateMessage: "Mandatory update msg", // a message shown for "--mandatory" releases
      optionalIgnoreButtonLabel: "Later", // if a user wants to continue their session, the update will be installed on next resume
      mandatoryContinueButtonLabel: isIOS ? "Exit now" : "Restart now", // On Android we can kill and restart the app, but on iOS that's not possible so the user has to manually restart it. That's why we provide a different label in this example.
      appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to AppSync
    }
  }, (syncStatus: SyncStatus, updateLabel?: string): void => {
    console.log("AppSync syncStatus: " + syncStatus);
    if (syncStatus === SyncStatus.UP_TO_DATE) {
      console.log(`AppSync: no pending updates; you're running the latest version, which is ${updateLabel}`);
    } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
      console.log(`AppSync: update installed (${updateLabel}) - it will be activated upon next cold boot`);
    }
});
```

<details>
 <summary>Click here to see a JavaScript example</summary>

```js
var AppSync = require("nativescript-app-sync").AppSync;
var InstallMode = require("nativescript-app-sync").InstallMode;
var SyncStatus = require("nativescript-app-sync").SyncStatus;
var platform = require("tns-core-modules/platform");

AppSync.sync({
    enabledWhenUsingHmr: false, // this is optional and by default false so AppSync and HMR don't fight over app updates
    deploymentKey: platform.isIOS ? "your-ios-deployment-key" : "your-android-deployment-key",
    installMode: InstallMode.ON_NEXT_RESTART,
    mandatoryInstallMode: platform.isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE,
    updateDialog: {
      optionalUpdateMessage: "Optional update msg",
      updateTitle: "Please restart the app",
      mandatoryUpdateMessage: "Mandatory update msg",
      optionalIgnoreButtonLabel: "Later",
      mandatoryContinueButtonLabel: platform.isIOS ? "Exit now" : "Restart now",
      appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to AppSync
    }
}, function (syncStatus, updateLabel) {
    if (syncStatus === SyncStatus.UP_TO_DATE) {
      console.log("AppSync: no pending updates; you're running the latest version, which is: " + updateLabel);
    } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
      console.log("AppSync: update (" + updateLabel + ") installed - it will be activated upon next cold boot");
    }
});
```

</details>

#### When should this check run?
It's recommended to check for updates more than once in a cold boot cycle,
so it may be easiest to tie this check to the `resume` event (which usually also runs on app startup):

```typescript
import * as application from "tns-core-modules/application";
import { AppSync } from "nativescript-app-sync";

// add this in some central place that's executed once in a lifecycle
application.on(application.resumeEvent, () => {
  AppSync.sync(...);
});
```

<details>
  <summary>Click here to see a JavaScript example</summary>
  
```js
var application = require("tns-core-modules/application");

application.on(application.resumeEvent, function () {
  // call the sync function
});
```

</details>

## Releasing an update
Once your app has been configured and distributed to your users, and you've made some code and/or asset changes,
it's time to instantly unleash those changes onto your users!

> ⚠️ Make sure to create a *release build* first, so use the same command that you'd use for app store distribution, just don't send it to the AppStore. You can even Webpack and Uglify your app, it's all transparent to this plugin.

> 💁‍♂️ When releasing updates to AppSync, you do not need to bump your app's version since you aren't modifying the app store version at all. AppSync will automatically generate a "label" for each release you make (e.g. `v3`) in order to help identify it within your release history.

The easiest way to do this is to use the `release` command in our AppSync CLI. Its (most relevant) options are:

|param|alias|default|description
|---|---|---|---
|deploymentName|d|"Staging"|Deploy to either "Staging" or "Production".
|description|des|not set|Description of the changes made to the app with this release.
|targetBinaryVersion|t|`App_Resources`|Semver expression that specifies the binary app version(s) this release is targeting (e.g. 1.1.0, ~1.2.3). The default is the exact version in `App_Resources/iOS/Info.plist` or `App_Resources/Android/AndroidManifest.xml`. 
|mandatory|m|not set|This specifies whether or not the update should be considered "urgent" (e.g. it includes a critical security fix). This attribute is simply round tripped to the client, who can then decide if and how they would like to enforce it. If this flag is not set, the update is considered "not urgent" so you may choose to wait for the next cold boot of the app. It does not mean users get to 'opt out' from an update; all AppSync updates will eventually be installed on the client.

Have a few examples for both platforms:

#### iOS

```shell
nativescript-app-sync release <AppSync-ios-appname> ios # deploy to Staging
nativescript-app-sync release <AppSync-ios-appname> ios --d Production # deploy to Production (default: Staging)
nativescript-app-sync release <AppSync-ios-appname> ios --targetBinaryVersion ~1.0.0 # release to users running any 1.x version (default: the exact version in Info.plist)
nativescript-app-sync release <AppSync-ios-appname> ios --mandatory --description "My mandatory iOS version" # a release for iOS that needs to be applied ASAP.
```

#### Android

```shell
nativescript-app-sync release <AppSync-android-appname> android # deploy to Staging
nativescript-app-sync release <AppSync-android-appname> android --d Production # deploy to Production (default: Staging)
nativescript-app-sync release <AppSync-android-appname> android --targetBinaryVersion ~1.0.0 # release to users running any 1.x version (default: the exact version in AndroidManifest.xml)
```

<details>
  <summary>Click here to learn more about the --targetBinaryVersion param</summary>
The `targetBinaryVersion` specifies the store/binary version of the application you are releasing the update for, so that only users running that version will receive the update, while users running an older and/or newer version of the app binary will not. This is useful for the following reasons:

1. If a user is running an older binary version, it's possible that there are breaking changes in the AppSync update that wouldn't be compatible with what they're running.

2. If a user is running a newer binary version, then it's presumed that what they are running is newer (and potentially incompatible) with the AppSync update.

If you ever want an update to target multiple versions of the app store binary, we also allow you to specify the parameter as a [semver range expression](https://github.com/npm/node-semver#advanced-range-syntax). That way, any client device running a version of the binary that satisfies the range expression (i.e. `semver.satisfies(version, range)` returns `true`) will get the update. Examples of valid semver range expressions are as follows:

| Range Expression | Who gets the update                                                                    |
|------------------|----------------------------------------------------------------------------------------|
| `1.2.3`          | Only devices running the specific binary app store version `1.2.3` of your app         |
| `*`              | Any device configured to consume updates from your AppSync app                        |
| `1.2.x`          | Devices running major version 1, minor version 2 and any patch version of your app     |
| `1.2.3 - 1.2.7`  | Devices running any binary version between `1.2.3` (inclusive) and `1.2.7` (inclusive) |
| `>=1.2.3 <1.2.7` | Devices running any binary version between `1.2.3` (inclusive) and `1.2.7` (exclusive) |
| `1.2`            | Equivalent to `>=1.2.0 <1.3.0`                                                         |
| `~1.2.3`         | Equivalent to `>=1.2.3 <1.3.0`                                                         |
| `^1.2.3`         | Equivalent to `>=1.2.3 <2.0.0`                                                         |

*NOTE: If your semver expression starts with a special shell character or operator such as `>`, `^`, or **
*, the command may not execute correctly if you do not wrap the value in quotes as the shell will not supply the right values to our CLI process. Therefore, it is best to wrap your `targetBinaryVersion` parameter in double quotes when calling the `release` command, e.g. `app-sync release MyApp-iOS updateContents ">1.2.3"`.*

*NOTE: As defined in the semver spec, ranges only work for non pre-release versions: https://github.com/npm/node-semver#prerelease-tags. If you want to update a version with pre-release tags, then you need to write the exact version you want to update (`1.2.3-beta` for example).*

The following table outlines the version value that AppSync expects your update's semver range to satisfy for each respective app type:

| Platform               | Source of app store version                                                           |
|------------------------|---------------------------------------------------------------------------------------|
| NativeScript (iOS)     | The `CFBundleShortVersionString` key in the `App_Resources/iOS/Info.plist` file       |
| NativeScript (Android) | The `android:versionName` key in the `App_Resources/Android/AndroidManifest.xml` file |

*NOTE: If the app store version in the metadata files are missing a patch version, e.g. `2.0`, it will be treated as having a patch version of `0`, i.e. `2.0 -> 2.0.0`. The same is true for app store version equal to plain integer number, `1` will be treated as `1.0.0` in this case.*

</details>

## Gaining insight in past releases
Here are a few AppSync CLI commands you may find useful:

### Which releases did I create and what are the install metrics?
Using a command like this will tell you how many apps have the update installed:

```shell
nativescript-app-sync deployment history <appsync-appname> Staging
```

Which produces something like this:

|Label|Release Time|App Version|Mandatory|Description|Install Metrics
|---|---|---|---|---|---
|v2|an hour ago|1.0.0|Yes|Mandatory iOS version!|Active: 11% (2 of 19)
||||||Total: 2|
|v1|2 hours ago|1.0.0|No|Awesome iOS version!|Active: 26% (5 of 19)
||||||Total: 5|

### Give me the details of the current release!
This dumps the details of the most recent release for both the Staging and Production environments of your app:

```shell
nativescript-app-sync deployment ls <appsync-appname>
```

And if you want to dump your deployment keys as well, use:

```shell
nativescript-app-sync deployment ls <appsync-appname> --displayKeys
```

Which produces something like this:

|Name|Deployment Key|Update Metadata|Install Metrics
|---|---|---|---
|Production|r1DVaLfKjc0Y5d6BzqX4..|No updates released|No installs recorded
|Staging|YTmVMy0GLCknVu3GVIyn..|Label: v5|Active: 11% (2 of 19)
| | |App Version: 1.0.0|Total: 2
| | |Mandatory: Yes|
| | |Release Time: an hour ago|
| | |Released By: eddyverbruggen@gmail.com|
| | |Description: Mandatory iOS version!|

### Clearing the release history
This won't roll back any releases, but it cleans up the history metadata (of the `Staging` app, in this case):

```shell
nativescript-app-sync deployment clear <appsync-appname> Staging
```

## Advanced topics

### Testing AppSync packages during development
You may want to play with AppSync before using it in production (smart move!).
Perform these steps once you've pushed an update and added the `sync` command to your app:

- `$ tns run <platform>`. On an iOS *device* add the `--release` flag so LiveSync doesn't interfere.
- kill and restart the app after the update is installed

### Running the demo app
You may also play with AppSync by using its demo app. Here are the steps you need to perform in order to observe an app update:
- register with the service (`nativescript-app-sync register`) and add the demo app to your account (`nativescript-app-sync app add <appname> <platform> nativescript`)
- once the app is registered you will see its deployment keys in the console, use them to update the ones in the [demo](https://github.com/EddyVerbruggen/nativescript-app-sync/blob/master/demo/demoapp/main-view-model.ts)
- go to src and run `npm run preparedemo` - this will build the plugin and add a reference to the demo app
- prepare an app that will be used as an "update version" (for example, uncomment one of the APPSYNC labels and comment the APPSTORE label), then run `tns build <platform>`
- release the update (`nativescript-app-sync release <appname> <platform>`)
- you can ensure it appears in the list with updates (`nativescript-app-sync deployment history <appname> Staging`)
- prepare an app that will be used as an "official release version" (for example, comment the APPSYNC label and uncomment the APPSTORE label), then run `tns run <platform>`
- when the app is deployed on the device, you should see the "official release version" along with information about an installed update
- close the app (and remove it from device's recent apps to ensure its next start will be a cold start) and run it again - you should now see the "update version" of the app

### Patching Update Metadata
After releasing an update, there may be scenarios where you need to modify one or more of the metadata attributes associated with it
(e.g. you forgot to mark a critical bug fix as mandatory.
 
<details>
  <summary>Read all about patching metadata by clicking here.</summary>

You can update metadata by running the following command:

```shell
nativescript-app-sync patch <appName> <deploymentName>
[--label <releaseLabel>]
[--mandatory <isMandatory>]
[--description <description>]
[--targetBinaryVersion <targetBinaryVersion>]
```

> ⚠️ This command doesn't allow modifying the actual update contents of a release. If you need to respond to a release that has been identified as being broken, you should use the rollback command to immediately roll it back, and then if necessary, release a new update with the approrpriate fix when it is available.

Aside from the `appName` and `deploymentName`, all parameters are optional, and therefore, you can use this command to update just a single attribute or all of them at once. 
Calling the `patch` command without specifying any attribute flag will result in a no-op.

```shell
# Mark the latest production release as mandatory
nativescript-app-sync patch MyAppiOS Production -m

# Add a "mina and max binary version" to an existing release
nativescript-app-sync patch MyAppiOS Staging -t "1.0.0 - 1.0.5"
```

</details>

### Promoting Updates
<details>
  <summary>Read this if you want to easily promote releases from Staging to Production</summary>

Once you've tested an update against a specific deployment (e.g. `Staging`),
and you want to promote it (e.g. dev->staging, staging->production),
you can simply use the following command to copy the release from one deployment to another:

```shell
nativescript-app-sync promote <appName> <sourceDeploymentName> <destDeploymentName>
[--description <description>]
[--label <label>]
[--mandatory]
[--targetBinaryVersion <targetBinaryVersion]

# example
nativescript-app-sync promote AppSyncDemoIOS Staging Production --description 'Promoted from Staging to Production'
```

The `promote` command will create a new release for the destination deployment, which includes the **exact code and metadata** (description, mandatory and target binary version) from the latest release of the source deployment.
While you could use the `release` command to "manually" migrate an update from one environment to another, the `promote` command has the following benefits:

1. It's quicker, since you don't need to reassemble the release assets you want to publish or remember the description/app store version that are associated with the source deployment's release.

2. It's less error-prone, since the promote operation ensures that the exact thing that you already tested in the source deployment (e.g. `Staging`) will become active in the destination deployment (e.g. `Production`).

> 💁‍♂️ Unless you need to make changes to your code, the recommended workflow is taking advantage of the automatically created `Staging` and `Production` environments, and do all releases directly to `Staging`, and then perform a `promote` from `Staging` to `Production` after performing the appropriate testing.

</details>

### Rolling Back Updates

<details>
  <summary>Read this if you want to learn all about rollbacks</summary>

A deployment's release history is immutable, so you cannot delete or remove individual updates once they have been released without deleting all of the deployment's release history.
However, if you release an update that is broken or contains unintended features,
it is easy to roll it back using the `rollback` command:

```shell
nativescript-app-sync rollback <appName> <deploymentName>

#example
nativescript-app-sync rollback MyAppiOS Production
```

This has the effect of creating a new release for the deployment that includes the **exact same code and metadata** as the version prior to the latest one.
For example, imagine that you released the following updates to your app:

| Release | Description       | Mandatory |
|---------|-------------------|-----------|
| v1      | Initial release!  | Yes       |
| v2      | Added new feature | No        |
| v3      | Bug fixes         | Yes       |

If you ran the `rollback` command on that deployment, a new release (`v4`) would be created that included the contents of the `v2` release.

| Release                     | Description       | Mandatory |
|-----------------------------|-------------------|-----------|
| v1                          | Initial release!  | Yes       |
| v2                          | Added new feature | No        |
| v3                          | Bug fixes         | Yes       |
| v4 (Rollback from v3 to v2) | Added new feature | No        |

End-users that had already acquired `v3` would now be "moved back" to `v2` when the app performs an update check.
Additionally, any users that were still running `v2`, and therefore, had never acquired `v3`, wouldn't receive an update since they are already running the latest release
(this is why our update check uses the package hash in addition to the release label).

If you would like to rollback a deployment to a release other than the previous (e.g. `v3` -> `v2`), you can specify the optional `--targetRelease` parameter:

```shell
nativescript-app-sync rollback MyAppiOS Production --targetRelease v34
```

> ⚠️ This rolls back the release to the previous AppSync version, NOT the AppStore version (if there was one in between).

> 💁‍♂️ The release produced by a rollback will be annotated in the output of the `deployment history` command to help identify them more easily.

</details>

### App Collaboration
<details>
  <summary>Working on one app with multiple developers? Click here!</summary>

If you will be working with other developers on the same AppSync app, you can add them as collaborators using the following command:

```shell
nativescript-app-sync collaborator add <appName> <collaboratorEmail>
```

*NOTE: This expects the developer to have already registered with AppSync using the specified e-mail address, so ensure that they have done that before attempting to share the app with them.*

Once added, all collaborators will immediately have the following permissions with regards to the newly shared app:

1. View the app, its collaborators, deployments and release history.
1. Release updates to any of the app's deployments.
1. Rollback any of the app's deployments

Inversely, that means that an app collaborator cannot do any of the following:

1. Rename or delete the app
1. Create, rename or delete new deployments within the app
1. Clear a deployment's release history
1. Add or remove collaborators from the app (although a developer can remove themself as a collaborator from an app that was shared with them).

Over time, if someone is no longer working on an app with you, you can remove them as a collaborator using the following command:

```shell
nativescript-app-sync collaborator rm <appName> <collaboratorEmail>
```

If at any time you want to list all collaborators that have been added to an app, you can simply run the following command:

```shell
nativescript-app-sync collaborator ls <appName>
```

</details>

## Using AppSync behind a proxy
<details>
  <summary>Click here to read all about Proxy Support</summary>
By default, the `login` command will automatically look for a system-wide proxy, specified via an `HTTPS_PROXY` or `HTTP_PROXY` environment variable, and use that to connect to the server.
If you'd like to disable this behavior, and have the CLI establish a direct connection, simply specify the `--noProxy` parameter when logging in:

```shell
nativescript-app-sync login --noProxy
```

I'd you like to explicitly specify a proxy server that the CLI should use, without relying on system-wide settings,
you can instead pass the `--proxy` parameter when logging in:

```shell
nativescript-app-sync login --proxy https://foo.com:3454
```

Once you've logged in, any inferred and/or specified proxy settings are persisted along with your user session.
This allows you to continue using the CLI without needing to re-authenticate or re-specify your preferred proxy.
If at any time you want to start or stop using a proxy, simply logout, and then log back in with the newly desired settings.

</details>

## Troubleshooting
- Got build errors related to the __nativescript-zip__ plugin? Please check out [the solution in this issue](https://github.com/EddyVerbruggen/nativescript-app-sync/issues/34#issuecomment-526860302).
