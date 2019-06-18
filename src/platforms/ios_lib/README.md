Custom CodePush framework for iOS apps.

Using this wrapper to keep the `main.m` file a bit more clean,
and to move unzip logic to a background thread.

Note that the source code of the `CodePush/SSZipArchvive` was taken from 
release v1.8.1 at https://github.com/ZipArchive/ZipArchive/releases (which has a MIT license).

### Building the framework
- Run the target for simulator and device (disconnect the device to be sure), make sure to not only build for the active architecture.
- Right-click the file in the Products folder and open in Finder.
- In a Terminal `cd` to that folder, move up to the `Products` folder.
- Run `lipo -create -output "AppSync" "Debug-iphonesimulator/AppSync.framework/AppSync" "Debug-iphoneos/AppSync.framework/AppSync"`.
- Use the resulting `CodePush` file instead of the one generated inside any of the targets.

