const fs = require('fs'),
    path = require('path');

// patch NativeScriptApplication.java so it calls TNSCodePush (which is included in the bundled .aar file)
function patchNativeScriptApplication() {
  try {
    const nsPackage = path.join(__dirname, "..", "..", "..", "..", "platforms", "android", "src", "main", "java", "com", "tns");
    if (!fs.existsSync(nsPackage)) {
      console.log("Android not installed, skipping CodePush hook.");
      return;
    }

    // patch NativeScriptApplication so TNSCodePush.activatePackage it's only called once in the app lifecycle
    const tnsAppFile = path.join(nsPackage, "NativeScriptApplication.java");
    replaceInFile(
        tnsAppFile,
        'super.onCreate();',
        // adding a space so we don't do this more than once
        'super.onCreate() ;\n\t\tTNSCodePush.activatePackage(this);');

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