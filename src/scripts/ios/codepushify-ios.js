const fs = require('fs'),
    path = require('path');

// inject some code into main.m
function patchUIApplicationMain(iosProjectFolder) {
  try {
    const nsInteralFolder = path.join(iosProjectFolder, "internal");
    if (!fs.existsSync(nsInteralFolder)) {
      console.log("iOS not installed, skipping CodePush hook.");
      return;
    }

    const tnsCodePushFileDest = path.join(nsInteralFolder, "main.m");
    const tnsCodePushFileDestContents = fs.readFileSync(tnsCodePushFileDest);

    // making sure we don't do this more than once
    if (tnsCodePushFileDestContents.indexOf("TNSCodePush") === -1) {
      // let's first inject a header we need
      replaceInFile(
          tnsCodePushFileDest,
          '#include <NativeScript/NativeScript.h>',
          '#include <NativeScript/NativeScript.h>\n#include <CodePush/TNSCodePush.h>'
      );

      // now inject the function call that determines the correct application path (either default or codepushed)
      replaceInFile(
          tnsCodePushFileDest,
          'applicationPath = [NSBundle mainBundle].bundlePath;',
          'applicationPath = [TNSCodePush applicationPathWithDefault:[NSBundle mainBundle].bundlePath];'
      );
    }

  } catch(e) {
    console.log("CodePush iOS hook error: " + e);
  }
}

function replaceInFile(theFile, what, by) {
  const contents = fs.readFileSync(theFile, 'utf8');
  const result = contents.replace(what, by);
  fs.writeFileSync(theFile, result, 'utf8');
}

module.exports = function (logger, platformsData, projectData, hookArgs) {
  const iosProjectFolder = path.join(projectData.platformsDir, "ios");

  return new Promise(function (resolve, reject) {
    patchUIApplicationMain(iosProjectFolder);
    resolve();
  });
};