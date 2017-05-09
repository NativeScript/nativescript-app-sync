# NativeScript Code Push plugin
https://microsoft.github.io/code-push/



TODO:
- (must) v1 update works, a consecutive v2 doesn't.. and it's incremental --> deal with that!
-- see https://github.com/Microsoft/cordova-plugin-code-push/blob/adb82ddc2dfa1cf03128eb4db8137cce081c3798/www/localPackage.ts#L268
-- and (Android) https://github.com/Microsoft/react-native-code-push/blob/bb04535fbef4cb580da4c29ae628452cc0774fc8/android/app/src/main/java/com/microsoft/codepush/react/CodePushUpdateManager.java#L224
-- and (iOS) https://github.com/Microsoft/react-native-code-push/blob/bb04535fbef4cb580da4c29ae628452cc0774fc8/ios/CodePush/CodePushPackage.m#L111
- (nice to have) Figure out why DeploymentSuccess is ignored by the server (compare to cordova)
- (done) Test rollback: works: you need 2 codepush releases, it just downloads the previous one as v3 (=v1). See desktop screenshot.
 

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-code-push
[npm-image]:http://img.shields.io/npm/v/nativescript-code-push.svg
[npm-url]:https://npmjs.org/package/nativescript-code-push
[downloads-image]:http://img.shields.io/npm/dm/nativescript-code-push.svg


## How it works
Look a bit at https://github.com/Microsoft/cordova-plugin-code-push/blob/master/README.md#how-does-it-work

- ..
- Next cold boot the app will load the new resources

## What can('t) be CodePushed?
Can (and will):
- Anything inside your `/app` folder.
- Anything inside your `/node_modules` folder.

Can't (and won't):
- NativeScript platform updates. Example: bumping `tns-android` from version 2.5.1 to 2.5.2.
- Plugins updates that also require a different version of any dependant native libraries. Example: Firebase vx-y etc

So as long as you don't change versions of dependencies and tns platforms in your `package.json` you
can push happily. And if you do bump a version of a dependency make sure there are no changed platform
libraries. This means that if you bump `nativescript-email` ..

## Installing the Code Push CLI

## Pushing updates
// TODO this should be done in the code-push CLI when running: code-push nativescript

Detailed documentation is available in the [Microsoft Code Push repo](https://github.com/Microsoft/cordova-plugin-code-push/blob/master/README.md) but these are the essential steps:

### iOS
```bash
cd <appname>/platforms/ios/<appname>/
code-push release <codepush-ios-appname> app "*"
```

### Android
```bash
cd <appname>/platforms/android/src/main/assets/
code-push release <codepush-android-appname> app "*"
```

## Updating your app
```typescript
codePush.sync();
```

Or check for new versions more often: (TODO this is Cordova code)
```typescript
document.addEventListener("resume", function () {
    codePush.sync();
});
```

## Reporting
Using a command like this would normally tell you how many apps have the update installed,
but that's currently work in progress, so don't freak out if it says 'No installs recorded':

```bash
code-push deployment history CodePushDemo-Android Staging
```

## Future enhancements
- Fix Reporting
- Support onResume refresh (if possible)
- Support user-triggered refresh (if possible, low priority as Apple doesn't allow it anyway)

## Testing CodePush during development
Check out the included demo app:

- tns run [ios|android] --no-watch --clean
- kill the app after the update is installed (which is shown on screen and logged in the console)
- restart the app

after a codepush, this is done:
JS: ---- reportStatusDeploy completed, pkg: {"localPath":"/data/user/0/org.nativescript.plugindemo.CodePush/files/YKSTl2cfRkZT37yCUP1M7HnWbet64kKkEXoCG","deploymentKey":"gQfu7eaGua8lVmuMXi2OPAhVe7fA4kKkEXoCG","description":"","label":"v1","appVersion":"1.2.0","isMandatory":false,"packageHash":"995681c399b0fa67c8356b10df5c125178adc9c2a417073a94fdf6891c23ba2e","isFirstRun":true,"failedInstall":false}
JS: ---- reportStatusDeploy completed, previousLabelOrAppVersion: undefined
JS: ---- reportStatusDeploy completed, previousDeploymentKey: undefined
