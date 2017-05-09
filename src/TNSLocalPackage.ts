import { Zip } from "nativescript-zip";
import * as fs from "file-system";
import * as fsa from "file-system/file-system-access";
import * as appSettings from "application-settings";
import { isIOS } from "platform";
import * as utils from "utils/utils";
import { TNSAcquisitionManager } from "./TNSAcquisitionManager";
import { CodePush } from "./code-push";

declare const com: any;

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

  install(installSuccess: SuccessCallback<InstallMode>, errorCallback?: ErrorCallback, installOptions?: InstallOptions): void {
    let appFolderPath = fs.knownFolders.documents().path + "/app";
    let unzipFolderPath = fs.knownFolders.documents().path + "/CodePush-Unzipped/" + this.packageHash;
    let codePushFolder = fs.knownFolders.documents().path + "/CodePush";
    // make sure the CodePush folder exists
    fs.Folder.fromPath(codePushFolder);
    let newPackageFolderPath = fs.knownFolders.documents().path + "/CodePush/" + this.packageHash;
    // in case of a rollback make 'newPackageFolderPath' could already exist, so check and remove
    if (fs.Folder.exists(newPackageFolderPath)) {
      fs.Folder.fromPath(newPackageFolderPath).removeSync();
    }

    const onUnzipComplete = (success: boolean, error?: string) => {
      if (!success) {
        new TNSAcquisitionManager(this.deploymentKey).reportStatusDeploy(this, "DeploymentFailed");
        errorCallback && errorCallback(new Error(error));
        return;
      }

      const previousHash = appSettings.getString(CodePush.CURRENT_HASH_KEY, null);
      const isDiffPackage = fs.File.exists(unzipFolderPath + "/hotcodepush.json");
      if (isDiffPackage) {
        const copySourceFolder = previousHash === null ? appFolderPath : fs.knownFolders.documents().path + "/CodePush/" + previousHash;
        if (!TNSLocalPackage.copyFolder(copySourceFolder, newPackageFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${copySourceFolder} to ${newPackageFolderPath}`));
          return;
        }
        if (!TNSLocalPackage.copyFolder(unzipFolderPath, newPackageFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${unzipFolderPath} to ${newPackageFolderPath}`));
          return;
        }
      } else {
        new fsa.FileSystemAccess().rename(unzipFolderPath, newPackageFolderPath, (error) => {
          errorCallback && errorCallback(new Error(error));
          return;
        });
      }

      if (!isIOS) {
        let pendingFolderPath = fs.knownFolders.documents().path + "/CodePush/pending";
        if (fs.Folder.exists(pendingFolderPath)) {
          fs.Folder.fromPath(pendingFolderPath).removeSync();
        }
        if (!TNSLocalPackage.copyFolder(newPackageFolderPath, pendingFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${newPackageFolderPath} to ${pendingFolderPath}`));
          return;
        }
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
          console.log("CodePush package unzip progress: " + percent);
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
    //noinspection JSIgnoredPromiseFromCall
    codePushFolder.clear();
  }

  private static saveCurrentPackage(pack: IPackage): void {
    appSettings.setString(TNSLocalPackage.CODEPUSH_CURRENT_PACKAGE, JSON.stringify(pack));
  }

  static getCurrentPackage(): IPackage {
    const packageStr: string = appSettings.getString(TNSLocalPackage.CODEPUSH_CURRENT_PACKAGE, null);
    return packageStr === null ? null : JSON.parse(packageStr);
  }

  private static copyFolder(fromPath: string, toPath: string): boolean {
    if (isIOS) {
      return TNSCodePush.copyEntriesInFolderDestFolderError(fromPath, toPath);
    } else {
      try {
        com.tns.TNSCodePush.copyDirectoryContents(fromPath, toPath);
        return true;
      } catch (error) {
        console.log(`Copy error on Android: ${error}`);
        return false;
      }
    }
  }
}
