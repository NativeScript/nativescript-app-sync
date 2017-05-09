const fs = require('fs'),
    path = require('path');

// copy TNSCodePush.java to the platforms folder and patch NativeScriptApplication.java so it calls that file
function patchNativeScriptApplication() {
  try {
    const nsPackage = path.join(__dirname, "..", "..", "..", "..", "platforms", "android", "src", "main", "java", "com", "tns");
    if (!fs.existsSync(nsPackage)) {
      console.log("Android not installed, skipping CodePush hook.");
      return;
    }

    const tnsCodePushFileDest = path.join(nsPackage, "TNSCodePush.java");
    // make sure we don't do this more than once
    if (fs.existsSync(tnsCodePushFileDest)) {
      return;
    }

    // add a file to the build
    const tnsCodePushFileSrcContents = fs.readFileSync(path.join(__dirname, "TNSCodePush.java"));
    fs.writeFileSync(tnsCodePushFileDest, tnsCodePushFileSrcContents);

    // and call that file exactly once in the app lifecycle
    const tnsAppFile = path.join(nsPackage, "NativeScriptApplication.java");
    replaceInFile(
        tnsAppFile,
        'super.onCreate();',
        'super.onCreate();\n\t\tTNSCodePush.activatePackage(this);');

  } catch(e) {
    console.log("CodePush Android hook error: " + e);
  }
}

function replaceInFile(someFile, what, by) {
  fs.readFile(someFile, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    const result = data.replace(what, by);

    fs.writeFile(someFile, result, 'utf8', function (err) {
      if (err) return console.log(err);
    });
  });
}

patchNativeScriptApplication();