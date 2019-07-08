import { Zip } from "nativescript-zip";
import * as appSettings from "tns-core-modules/application-settings";
import * as fs from "tns-core-modules/file-system";
import * as fsa from "tns-core-modules/file-system/file-system-access";
import { isIOS } from "tns-core-modules/platform";
import * as utils from "tns-core-modules/utils/utils";
import { AppSync } from "./app-sync";
import { TNSAcquisitionManager } from "./TNSAcquisitionManager";

declare const com: any;

export class TNSLocalPackage implements ILocalPackage {
  // this is the app version at the moment the AppSync package was installed
  private static APPSYNC_CURRENT_APPVERSION: string = "APPSYNC_CURRENT_APPVERSION"; // same as native
  private static APPSYNC_CURRENT_PACKAGE: string = "APPSYNC_CURRENT_PACKAGE";
  // this is the build timestamp of the app at the moment the AppSync package was installed
  private static APPSYNC_CURRENT_APPBUILDTIME: string = "APPSYNC_CURRENT_APPBUILDTIME"; // same as native
  private static APPSYNC_APK_BUILD_TIME: string = "APPSYNC_APK_BUILD_TIME"; // same as include.gradle

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
  serverUrl: string;

  install(installSuccess: Function, errorCallback?: ErrorCallback, installOptions?: InstallOptions): void {
    let appFolderPath = fs.knownFolders.documents().path + "/app";
    let unzipFolderPath = fs.knownFolders.documents().path + "/AppSync-Unzipped/" + this.packageHash;
    let appSyncFolder = fs.knownFolders.documents().path + "/AppSync";
    // make sure the AppSync folder exists
    fs.Folder.fromPath(appSyncFolder);
    let newPackageFolderPath = fs.knownFolders.documents().path + "/AppSync/" + this.packageHash;
    // in case of a rollback make 'newPackageFolderPath' could already exist, so check and remove
    if (fs.Folder.exists(newPackageFolderPath)) {
      fs.Folder.fromPath(newPackageFolderPath).removeSync();
    }

    const onUnzipComplete = (success: boolean, error?: string) => {
      if (!success) {
        new TNSAcquisitionManager(this.deploymentKey, this.serverUrl).reportStatusDeploy(this, "DeploymentFailed");
        errorCallback && errorCallback(new Error(error));
        return;
      }

      const previousHash = appSettings.getString(AppSync.CURRENT_HASH_KEY, null);
      const isDiffPackage = fs.File.exists(unzipFolderPath + "/hotappsync.json");
      if (isDiffPackage) {
        const copySourceFolder = previousHash === null ? appFolderPath : fs.knownFolders.documents().path + "/AppSync/" + previousHash;
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
        let pendingFolderPath = fs.knownFolders.documents().path + "/AppSync/pending";
        if (fs.Folder.exists(pendingFolderPath)) {
          fs.Folder.fromPath(pendingFolderPath).removeSync();
        }
        if (!TNSLocalPackage.copyFolder(newPackageFolderPath, pendingFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${newPackageFolderPath} to ${pendingFolderPath}`));
          return;
        }
      }

      appSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_APPVERSION, this.appVersion);
      TNSLocalPackage.saveCurrentPackage(this);

      let buildTime: string;
      // Note that this 'if' hardly justifies subclassing so we're not
      if (isIOS) {
        const plist = NSBundle.mainBundle.pathForResourceOfType(null, "plist");
        const fileDate = new fsa.FileSystemAccess().getLastModified(plist);
        buildTime = "" + fileDate.getTime();
      } else {
        const appSyncApkBuildTimeStringId = utils.ad.resources.getStringId(TNSLocalPackage.APPSYNC_APK_BUILD_TIME);
        buildTime = utils.ad.getApplicationContext().getResources().getString(appSyncApkBuildTimeStringId);
      }
      appSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_APPBUILDTIME, buildTime);
      //noinspection JSIgnoredPromiseFromCall (removal is async, don't really care if it fails)
      fs.File.fromPath(this.localPath).remove();

      installSuccess();
    };

    TNSLocalPackage.unzip(
        this.localPath,
        unzipFolderPath,
        // TODO expose through plugin API (not that it's super useful)
        (percent: number) => {
          // console.log("AppSync package unzip progress: " + percent);
        },
        onUnzipComplete);
  }

  static unzip(archive: string, destination: string, progressCallback: (progressPercent) => void, completionCallback: (success: boolean, error?: string) => void): void {
    if (isIOS) {
      TNSAppSync.unzipFileAtPathToDestinationOnProgressOnComplete(
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

    appSettings.remove(TNSLocalPackage.APPSYNC_CURRENT_APPVERSION);
    appSettings.remove(TNSLocalPackage.APPSYNC_CURRENT_APPBUILDTIME);

    const appSyncFolder = fs.Folder.fromPath(fs.knownFolders.documents().path + "/AppSync");
    //noinspection JSIgnoredPromiseFromCall
    appSyncFolder.clear();
  }

  private static saveCurrentPackage(pack: IPackage): void {
    appSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_PACKAGE, JSON.stringify(pack));
  }

  static getCurrentPackage(): IPackage {
    const packageStr: string = appSettings.getString(TNSLocalPackage.APPSYNC_CURRENT_PACKAGE, null);
    return packageStr === null ? null : JSON.parse(packageStr);
  }

  private static copyFolder(fromPath: string, toPath: string): boolean {
    if (isIOS) {
      return TNSAppSync.copyEntriesInFolderDestFolderError(fromPath, toPath);
    } else {
      try {
        com.tns.TNSAppSync.copyDirectoryContents(fromPath, toPath);
        return true;
      } catch (error) {
        console.log(`Copy error on Android: ${error}`);
        return false;
      }
    }
  }
}
