const fs = require('fs'),
  path = require('path'),
  prepareHooksHelper = require("../prepare-hooks-helper");

// inject some code into main.m
function patchUIApplicationMain(iosProjectFolder) {
  try {
    const nsInteralFolder = path.join(iosProjectFolder, "internal");
    if (!fs.existsSync(nsInteralFolder)) {
      console.log("iOS not installed, skipping AppSync hook.");
      return;
    }

    const appSyncFileDest = path.join(nsInteralFolder, "main.m");
    const tnsAppSyncFileDestContents = fs.readFileSync(appSyncFileDest);

    // making sure we don't do this more than once
    if (tnsAppSyncFileDestContents.indexOf("TNSAppSync") === -1) {
      // let's first inject a header we need
      replaceInFile(
        appSyncFileDest,
        '#import <NativeScript/NativeScript.h>',
        '#import <NativeScript/NativeScript.h>\n#include <AppSync/TNSAppSync.h>'
      );

      // now inject the function call that determines the correct application path (either default or appsync'ed)
      replaceInFile(
        appSyncFileDest,
        'baseDir = [[NSBundle mainBundle] resourcePath];',
        'baseDir = [TNSAppSync applicationPathWithDefault:[NSBundle mainBundle].bundlePath];'
      );
    }

  } catch (e) {
    console.log("AppSync iOS hook error: " + e);
  }
}

function replaceInFile(theFile, what, by) {
  const contents = fs.readFileSync(theFile, 'utf8');
  const result = contents.replace(what, by);
  fs.writeFileSync(theFile, result, 'utf8');
}

module.exports = function ($injector, hookArgs) {
  const platform = prepareHooksHelper.getPlatformFromPrepareHookArgs(hookArgs);

  if (platform === 'ios') {
    const iosProjectFolder = prepareHooksHelper.getNativeProjectDir($injector, platform, hookArgs);
    patchUIApplicationMain(iosProjectFolder);
  }
};