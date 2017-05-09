import { Zip } from "nativescript-zip";
import * as fs from "file-system";
import * as fsa from "file-system/file-system-access";
import * as appSettings from "application-settings";
import { isIOS } from "platform";
import * as utils from "utils/utils";
import { TNSAcquisitionManager } from "./TNSAcquisitionManager";

export class TNSLocalPackage implements ILocalPackage {
  // this is the app version at the moment the CodePush package was installed
  private static CODEPUSH_CURRENT_APPVERSION: string = "CODEPUSH_CURRENT_APPVERSION"; // same as native
  private static CODEPUSH_CURRENT_PACKAGE: string = "CODEPUSH_CURRENT_PACKAGE";
  // this is the build timestamp of the app at the moment the CodePush package was installed
  private static CODEPUSH_CURRENT_APPBUILDTIME: string = "CODEPUSH_CURRENT_APPBUILDTIME"; // same as native

  private static CODEPUSH_APK_BUILD_TIME: string = "CODE_PUSH_APK_BUILD_TIME"; // same as include.gradle

  localPath: string;
  isFirstRun: boolean;
  deploymentKey: string;
  description: string;
  label: string;
  appVersion: string;
  isMandatory: boolean;
  packageHash: string;
  packageSize: number;
  failedInstall: boolean;

  // see https://github.com/Microsoft/react-native-code-push/blob/2cd2ef0ca2e27a95f84579603c2d222188bb9ce5/ios/CodePush/CodePushPackage.m#L440
  // and https://github.com/Microsoft/cordova-plugin-code-push/blob/055d9e625d47d56e707d9624c9a14a37736516bb/www/localPackage.ts#L52
  install(installSuccess: SuccessCallback<InstallMode>, errorCallback?: ErrorCallback, installOptions?: InstallOptions): void {
    let unzipFolderPath = fs.knownFolders.documents().path + "/CodePush/" + this.packageHash;

    const onUnzipComplete = (success: boolean, error?: string) => {
      if (!success) {
        new TNSAcquisitionManager(this.deploymentKey).reportStatusDeploy(this, "DeploymentFailed");
        errorCallback && errorCallback(new Error(error));
        return;
      }

      appSettings.setString(TNSLocalPackage.CODEPUSH_CURRENT_APPVERSION, this.appVersion);
      TNSLocalPackage.saveCurrentPackage(this);

      let buildTime: string;
      // Note that this 'if' hardly justifies subclassing so we're not
      if (isIOS) {
        const plist = utils.ios.getter(NSBundle, NSBundle.mainBundle).pathForResourceOfType(null, "plist");
        const fileDate = new fsa.FileSystemAccess().getLastModified(plist);
        buildTime = "" + fileDate.getTime();
      } else {
        const codePushApkBuildTimeStringId = utils.ad.resources.getStringId(TNSLocalPackage.CODEPUSH_APK_BUILD_TIME);
        buildTime = utils.ad.getApplicationContext().getResources().getString(codePushApkBuildTimeStringId);
      }
      appSettings.setString(TNSLocalPackage.CODEPUSH_CURRENT_APPBUILDTIME, buildTime);
      //noinspection JSIgnoredPromiseFromCall (removal is async, don't really care if it fails)
      fs.File.fromPath(this.localPath).remove();

      // TODO this is hardcoded for now as we only support 'install on restart' currently
      installSuccess(1); // InstallMode.ON_NEXT_RESTART
    };

    TNSLocalPackage.unzip(
        this.localPath,
        unzipFolderPath,
        (percent: number) => {
          console.log("-- unzip progress: " + percent);
        },
        onUnzipComplete);
  }

  static unzip(archive: string, destination: string, progressCallback: (progressPercent) => void, completionCallback: (success: boolean, error?: string) => void): void {
    if (isIOS) {
      TNSCodePush.unzipFileAtPathToDestinationOnProgressOnComplete(
          archive,
          destination,
          (itemNr: number, totalNr: number) => {
            progressCallback(Math.floor((itemNr / totalNr) * 100));
          },
          (path: string, success: boolean, error: NSError) => {
            completionCallback(success, error ? error.localizedDescription : null);
          }
      );
    } else {
      Zip.unzipWithProgress(archive, destination, progressCallback).then(
          () => {
            completionCallback(true);
          },
          (error: string) => {
            completionCallback(false, error);
          }
      );
    }
  }

  static clean(): void {
    // note that we mustn't call this on Android, but it can't hurt to guard that
    if (!isIOS) {
      return;
    }

    appSettings.remove(TNSLocalPackage.CODEPUSH_CURRENT_APPVERSION);
    appSettings.remove(TNSLocalPackage.CODEPUSH_CURRENT_APPBUILDTIME);

    const codePushFolder = fs.Folder.fromPath(fs.knownFolders.documents().path + "/CodePush");
    // doing this async is fine
    codePushFolder.clear().then(() => {
      console.log("CodePush folder cleared.");
    });
  }

  private static saveCurrentPackage(pack: IPackage): void {
    appSettings.setString(TNSLocalPackage.CODEPUSH_CURRENT_PACKAGE, JSON.stringify(pack));
  }

  static getCurrentPackage(): IPackage {
    const packageStr: string = appSettings.getString(TNSLocalPackage.CODEPUSH_CURRENT_PACKAGE, null);
    return packageStr === null ? null : JSON.parse(packageStr);
  }
}
