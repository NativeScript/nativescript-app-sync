const fs = require('fs'),
  path = require('path'),
  prepareHooksHelper = require("../prepare-hooks-helper");

// patch NativeScriptApplication.java so it calls TNSAppSync (which is included in the bundled .aar file)
function patchNativeScriptApplication(androidProjectFolder) {
  try {
    const nsPackage = path.join(androidProjectFolder, "app", "src", "main", "java", "com", "tns");
    if (!fs.existsSync(nsPackage)) {
      console.log("Android not installed, skipping AppSync hook.");
      return;
    }

    // patch NativeScriptApplication so TNSAppSync.activatePackage it's only called once in the app lifecycle
    const tnsAppFile = path.join(nsPackage, "NativeScriptApplication.java");
    replaceInFile(
      tnsAppFile,
      'super.onCreate();',
      // adding a space so we don't do this more than once
      'super.onCreate() ;\n\t\t\t\tTNSAppSync.activatePackage(this);');

  } catch (e) {
    console.log("AppSync Android hook error: " + e);
  }
}

function replaceInFile(someFile, what, by) {
  fs.readFile(someFile, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    const result = data.replace(what, by);

    fs.writeFile(someFile, result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });
}

module.exports = function ($injector, hookArgs) {
  const platform = prepareHooksHelper.getPlatformFromPrepareHookArgs(hookArgs);

  if (platform === 'android') {
    const androidProjectFolder = prepareHooksHelper.getNativeProjectDir($injector, platform, hookArgs);
    patchNativeScriptApplication(androidProjectFolder);
  }
};
