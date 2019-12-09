import { Zip } from "nativescript-zip";
import { isIOS, ApplicationSettings, knownFolders, File, Folder, Utils } from "@nativescript/core";
import { FileSystemAccess } from "@nativescript/core/file-system/file-system-access";
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
    let appFolderPath = knownFolders.documents().path + "/app";
    let unzipFolderPath = knownFolders.documents().path + "/AppSync-Unzipped/" + this.packageHash;
    let appSyncFolder = knownFolders.documents().path + "/AppSync";
    // make sure the AppSync folder exists
    Folder.fromPath(appSyncFolder);
    let newPackageFolderPath = knownFolders.documents().path + "/AppSync/" + this.packageHash;
    // in case of a rollback make 'newPackageFolderPath' could already exist, so check and remove
    if (Folder.exists(newPackageFolderPath)) {
      Folder.fromPath(newPackageFolderPath).removeSync();
    }

    const onUnzipComplete = (success: boolean, error?: string) => {
      if (!success) {
        new TNSAcquisitionManager(this.deploymentKey, this.serverUrl).reportStatusDeploy(this, "DeploymentFailed");
        errorCallback && errorCallback(new Error(error));
        return;
      }

      const previousHash = ApplicationSettings.getString(AppSync.CURRENT_HASH_KEY, null);
      const isDiffPackage = File.exists(unzipFolderPath + "/hotappsync.json");
      if (isDiffPackage) {
        const copySourceFolder = previousHash === null ? appFolderPath : knownFolders.documents().path + "/AppSync/" + previousHash;
        if (!TNSLocalPackage.copyFolder(copySourceFolder, newPackageFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${copySourceFolder} to ${newPackageFolderPath}`));
          return;
        }
        if (!TNSLocalPackage.copyFolder(unzipFolderPath, newPackageFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${unzipFolderPath} to ${newPackageFolderPath}`));
          return;
        }
      } else {
        new FileSystemAccess().rename(unzipFolderPath, newPackageFolderPath, (error) => {
          errorCallback && errorCallback(new Error(error));
          return;
        });
      }

      if (!isIOS) {
        let pendingFolderPath = knownFolders.documents().path + "/AppSync/pending";
        if (Folder.exists(pendingFolderPath)) {
          Folder.fromPath(pendingFolderPath).removeSync();
        }
        if (!TNSLocalPackage.copyFolder(newPackageFolderPath, pendingFolderPath)) {
          errorCallback && errorCallback(new Error(`Failed to copy ${newPackageFolderPath} to ${pendingFolderPath}`));
          return;
        }
      }

      ApplicationSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_APPVERSION, this.appVersion);
      TNSLocalPackage.saveCurrentPackage(this);

      let buildTime: string;
      // Note that this 'if' hardly justifies subclassing so we're not
      if (isIOS) {
        const plist = NSBundle.mainBundle.pathForResourceOfType(null, "plist");
        const fileDate = new FileSystemAccess().getLastModified(plist);
        buildTime = "" + fileDate.getTime();
      } else {
        const appSyncApkBuildTimeStringId = Utils.android.resources.getStringId(TNSLocalPackage.APPSYNC_APK_BUILD_TIME);
        buildTime = Utils.android.getApplicationContext().getResources().getString(appSyncApkBuildTimeStringId);
      }
      ApplicationSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_APPBUILDTIME, buildTime);
      //noinspection JSIgnoredPromiseFromCall (removal is async, don't really care if it fails)
      File.fromPath(this.localPath).remove();

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
      Zip.unzip({
        archive,
        directory: destination,
        onProgress: progressCallback
      }).then(
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

    ApplicationSettings.remove(TNSLocalPackage.APPSYNC_CURRENT_APPVERSION);
    ApplicationSettings.remove(TNSLocalPackage.APPSYNC_CURRENT_APPBUILDTIME);

    const appSyncFolder = Folder.fromPath(knownFolders.documents().path + "/AppSync");
    //noinspection JSIgnoredPromiseFromCall
    appSyncFolder.clear();
  }

  private static saveCurrentPackage(pack: IPackage): void {
    ApplicationSettings.setString(TNSLocalPackage.APPSYNC_CURRENT_PACKAGE, JSON.stringify(pack));
  }

  static getCurrentPackage(): IPackage {
    const packageStr: string = ApplicationSettings.getString(TNSLocalPackage.APPSYNC_CURRENT_PACKAGE, null);
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
