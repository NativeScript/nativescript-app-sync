/// <reference path="./code-push-lib.d.ts"/>

import * as appSettings from "application-settings";
import * as AppVersion from "nativescript-appversion";
import * as application from "tns-core-modules/application";
import { device } from "tns-core-modules/platform";
import { confirm } from "tns-core-modules/ui/dialogs";
import { TNSAcquisitionManager } from "./TNSAcquisitionManager";
import { TNSLocalPackage } from "./TNSLocalPackage";
import { TNSRemotePackage } from "./TNSRemotePackage";

export enum InstallMode {
  /**
   * The update will be applied to the running application immediately. The application will be reloaded with the new content immediately.
   */
  IMMEDIATE = <any>"IMMEDIATE",

  /**
   * The update is downloaded but not installed immediately. The new content will be available the next time the application is started.
   */
  ON_NEXT_RESTART = <any>"ON_NEXT_RESTART",

  /**
   * The update is downloaded but not installed immediately. The new content will be available the next time the application is resumed or restarted, whichever event happends first.
   */
  ON_NEXT_RESUME = <any>"ON_NEXT_RESUME",
}

export enum SyncStatus {

  /**
   * The application is up to date.
   */
  UP_TO_DATE = <any>"UP_TO_DATE",

  /**
   * An update is available, it has been downloaded, unzipped and copied to the deployment folder.
   * After the completion of the callback invoked with SyncStatus.UPDATE_INSTALLED, the application will be reloaded with the updated code and resources.
   */
  UPDATE_INSTALLED = <any>"UPDATE_INSTALLED",

  /**
   * An optional update is available, but the user declined to install it. The update was not downloaded.
   */
  UPDATE_IGNORED = <any>"UPDATE_IGNORED",

  /**
   * An error happened during the sync operation. This might be an error while communicating with the server, downloading or unziping the update.
   * The console logs should contain more information about what happened. No update has been applied in this case.
   */
  ERROR = <any>"ERROR",

  /**
   * Returned if HMR is enabled and not overridden by the user.
   */
  SKIPPING_BECAUSE_HMR_ENABLED = <any>"SKIPPING_BECAUSE_HMR_ENABLED",

  /**
   * There is an ongoing sync in progress, so this attempt to sync has been aborted.
   */
  IN_PROGRESS = <any>"IN_PROGRESS",

  /**
   * Intermediate status - the plugin is about to check for updates.
   */
  CHECKING_FOR_UPDATE = <any>"CHECKING_FOR_UPDATE",

  /**
   * Intermediate status - a user dialog is about to be displayed. This status will be reported only if user interaction is enabled.
   */
  AWAITING_USER_ACTION = <any>"AWAITING_USER_ACTION",

  /**
   * Intermediate status - the update package is about to be downloaded.
   */
  DOWNLOADING_PACKAGE = <any>"DOWNLOADING_PACKAGE",

  /**
   * Intermediate status - the update package is about to be installed.
   */
  INSTALLING_UPDATE = <any>"INSTALLING_UPDATE"
}

export interface DownloadProgress {
  totalBytes: number;
  receivedBytes: number;
}

export class AppSync {
  public static CURRENT_HASH_KEY: string = "APPSYNC_CURRENT_HASH"; // same as native
  private static PENDING_HASH_KEY: string = "APPSYNC_PENDING_HASH"; // same as native
  private static CLEAN_KEY: string = "APPSYNC_CLEAN"; // same as native (Android)
  private static BINARY_FIRST_RUN_KEY: string = "BINARY_FIRST_RUN";
  private static UNCONFIRMED_INSTALL_KEY: string = "UNCONFIRMED_INSTALL";

  private static syncInProgress = false;

  static sync(options: SyncOptions, syncCallback?: SuccessCallback<SyncStatus>, downloadProgress?: SuccessCallback<DownloadProgress>): void {
    if (!options || !options.deploymentKey) {
      throw new Error("Missing deploymentKey, pass it as part of the first parameter of the 'sync' function: { deploymentKey: 'your-key' }");
    }

    // skip AppSync when HMR is detected, unless it's explicitly allowed
    if (typeof (<any>global).hmrRefresh === "function" && !options.enabledWhenUsingHmr) {
      syncCallback && syncCallback(SyncStatus.SKIPPING_BECAUSE_HMR_ENABLED);
      return;
    }

    AppSync.syncInProgress = true;

    // by default, use our Cloud server
    options.serverUrl = options.serverUrl || "https://appsync-server.nativescript.org/";

    AppSync.cleanPackagesIfNeeded();

    AppSync.notifyApplicationReady(options.deploymentKey, options.serverUrl);

    syncCallback && syncCallback(SyncStatus.CHECKING_FOR_UPDATE);
    AppSync.checkForUpdate(options.deploymentKey, options.serverUrl).then(
        (remotePackage?: IRemotePackage) => {
          if (!remotePackage) {
            syncCallback && syncCallback(SyncStatus.UP_TO_DATE);
            AppSync.syncInProgress = false;
            return;
          }

          if (options.ignoreFailedUpdates === undefined) {
            options.ignoreFailedUpdates = true;
          }

          const updateShouldBeIgnored = remotePackage.failedInstall && options.ignoreFailedUpdates;
          if (updateShouldBeIgnored) {
            console.log("An update is available, but it is being ignored due to having been previously rolled back.");
            syncCallback && syncCallback(SyncStatus.UP_TO_DATE);
            AppSync.syncInProgress = false;
            return;
          }

          const onError = (error: Error) => {
            console.log("Download error: " + error);
            syncCallback && syncCallback(SyncStatus.ERROR);
            AppSync.syncInProgress = false;
          };

          const onInstallSuccess = () => {
            appSettings.setString(AppSync.PENDING_HASH_KEY, remotePackage.packageHash);
            appSettings.setString(AppSync.CURRENT_HASH_KEY, remotePackage.packageHash);

            const onSuspend = () => {
              application.off("suspend", onSuspend);
              this.killApp(false);
            };

            syncCallback && syncCallback(SyncStatus.UPDATE_INSTALLED, remotePackage.label);

            const installMode = options.installMode || InstallMode.ON_NEXT_RESTART;
            const mandatoryInstallMode = options.mandatoryInstallMode || InstallMode.ON_NEXT_RESUME;

            switch (remotePackage.isMandatory ? mandatoryInstallMode : installMode) {
              case InstallMode.ON_NEXT_RESTART:
                console.log("Update is installed and will be run on the next app restart.");
                break;

              case InstallMode.ON_NEXT_RESUME:
                console.log("Update is installed and will be run when the app next resumes.");
                application.on("suspend", onSuspend);
                break;

              case InstallMode.IMMEDIATE:
                const updateDialogOptions = <UpdateDialogOptions>(options.updateDialog || {});
                confirm({
                  title: updateDialogOptions.updateTitle,
                  message: (remotePackage.isMandatory ? updateDialogOptions.mandatoryUpdateMessage : updateDialogOptions.optionalUpdateMessage) + (updateDialogOptions.appendReleaseDescription ? "\n" + remotePackage.description : ""),
                  okButtonText: updateDialogOptions.mandatoryContinueButtonLabel || "Restart",
                  cancelButtonText: updateDialogOptions.optionalIgnoreButtonLabel || "Cancel",
                  cancelable: true
                }).then(confirmed => {
                  if (confirmed) {
                    setTimeout(() => this.killApp(true), 300);
                  } else {
                    // fall back to next suspend/resume instead
                    application.on("suspend", onSuspend);
                  }
                });
                break;
            }

            AppSync.syncInProgress = false;
          };

          const onDownloadSuccess = (localPackage: ILocalPackage) => {
            syncCallback && syncCallback(SyncStatus.INSTALLING_UPDATE, remotePackage.label);
            localPackage.install(onInstallSuccess, onError);
          };

          syncCallback && syncCallback(SyncStatus.DOWNLOADING_PACKAGE, remotePackage.label);

          remotePackage.download(
              onDownloadSuccess,
              onError,
              downloadProgress
          );
        },
        (error: string) => {
          console.log(error);
          AppSync.syncInProgress = false;
          if (syncCallback) {
            syncCallback(SyncStatus.ERROR);
          }
        }
    );
  }

  static checkForUpdate(deploymentKey: string, serverUrl?: string): Promise<IRemotePackage | undefined> {
    return new Promise((resolve, reject) => {
      // by default, use our Cloud server
      serverUrl = serverUrl || "https://appsync-server.nativescript.org/";

      const config: Configuration = {
        serverUrl,
        appVersion: AppVersion.getVersionNameSync(),
        clientUniqueId: device.uuid,
        deploymentKey
      };

      AppSync.getCurrentPackage(config)
          .then((queryPackage?: IPackage) => {
            new TNSAcquisitionManager(deploymentKey, serverUrl).queryUpdateWithCurrentPackage(queryPackage, (error: Error, result: IRemotePackage | NativeUpdateNotification) => {
              if (error) {
                reject(error.message || error.toString());
              }

              if (!result || (<NativeUpdateNotification>result).updateAppVersion) {
                resolve();
                return;
              }

              // At this point we know there's an update available for the current version
              const remotePackage: IRemotePackage = <IRemotePackage>result;

              let tnsRemotePackage: IRemotePackage = new TNSRemotePackage();
              tnsRemotePackage.description = remotePackage.description;
              tnsRemotePackage.label = remotePackage.label;
              tnsRemotePackage.appVersion = remotePackage.appVersion;
              tnsRemotePackage.isMandatory = remotePackage.isMandatory;
              tnsRemotePackage.packageHash = remotePackage.packageHash;
              tnsRemotePackage.packageSize = remotePackage.packageSize;
              tnsRemotePackage.downloadUrl = remotePackage.downloadUrl;
              // the server doesn't send back the deploymentKey
              tnsRemotePackage.deploymentKey = config.deploymentKey;
              // TODO (low prio) see https://github.com/Microsoft/cordova-plugin-code-push/blob/055d9e625d47d56e707d9624c9a14a37736516bb/www/codePush.ts#L182
              // .. or https://github.com/Microsoft/react-native-code-push/blob/2cd2ef0ca2e27a95f84579603c2d222188bb9ce5/CodePush.js#L84
              tnsRemotePackage.failedInstall = false;
              tnsRemotePackage.serverUrl = serverUrl;

              resolve(tnsRemotePackage);
            });
          })
          .catch(e => reject(e));
    });
  }

  private static getCurrentPackage(config: Configuration): Promise<IPackage> {
    return new Promise((resolve, reject) => {
      resolve({
        appVersion: config.appVersion,
        deploymentKey: config.deploymentKey,
        packageHash: appSettings.getString(AppSync.CURRENT_HASH_KEY),
        isMandatory: false,
        failedInstall: false,
        description: undefined,
        label: undefined,
        packageSize: undefined,
        serverUrl: config.serverUrl
      });
    });
  }

  private static notifyApplicationReady(deploymentKey: string, serverUrl?: string): void {
    if (AppSync.isBinaryFirstRun()) {
      // first run of a binary from the AppStore
      AppSync.markBinaryAsFirstRun();
      new TNSAcquisitionManager(deploymentKey, serverUrl).reportStatusDeploy(null, "DeploymentSucceeded");

    } else if (!AppSync.hasPendingHash()) {
      const currentPackageHash = appSettings.getString(AppSync.CURRENT_HASH_KEY, null);
      if (currentPackageHash !== null && currentPackageHash !== AppSync.firstLaunchValue()) {
        // first run of an update from AppSync
        AppSync.markPackageAsFirstRun(currentPackageHash);
        const currentPackage: ILocalPackage = <ILocalPackage>TNSLocalPackage.getCurrentPackage();
        if (currentPackage !== null) {
          currentPackage.isFirstRun = true;
          new TNSAcquisitionManager(deploymentKey, serverUrl).reportStatusDeploy(currentPackage, "DeploymentSucceeded");
        }
      }
    }
  }

  private static killApp(restartOnAndroid: boolean): void {
    if (application.android) {
      if (restartOnAndroid) {
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
        const mStartActivity = new android.content.Intent(application.android.context, application.android.startActivity.getClass());
        const mPendingIntentId = parseInt("" + (Math.random() * 100000), 10);
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
        const mPendingIntent = android.app.PendingIntent.getActivity(application.android.context, mPendingIntentId, mStartActivity, android.app.PendingIntent.FLAG_CANCEL_CURRENT);
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
        const mgr = application.android.context.getSystemService(android.content.Context.ALARM_SERVICE);
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
        mgr.set(android.app.AlarmManager.RTC, java.lang.System.currentTimeMillis() + 100, mPendingIntent);
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
      }
      android.os.Process.killProcess(android.os.Process.myPid());
    } else if (application.ios) {
      exit(0);
    }
  }

  private static cleanPackagesIfNeeded(): void {
    const shouldClean = appSettings.getBoolean(AppSync.CLEAN_KEY, false);
    if (!shouldClean) {
      return;
    }
    appSettings.remove(AppSync.CLEAN_KEY);
    appSettings.remove(AppSync.BINARY_FIRST_RUN_KEY);
    TNSLocalPackage.clean();
  }

  private static isBinaryFirstRun(): boolean {
    const firstRunFlagSet = appSettings.getBoolean(AppSync.BINARY_FIRST_RUN_KEY, false);
    return !firstRunFlagSet;
  }

  /**
   * This key exists until a restart is done (removed by native upon start).
   * @returns {boolean}
   */
  private static hasPendingHash(): boolean {
    return appSettings.hasKey(AppSync.PENDING_HASH_KEY);
  }

  private static markBinaryAsFirstRun(): void {
    appSettings.setBoolean(AppSync.BINARY_FIRST_RUN_KEY, true);
  }

  private static firstLaunchValue(): string {
    return appSettings.getString(AppSync.UNCONFIRMED_INSTALL_KEY, null);
  }

  private static markPackageAsFirstRun(pack: string): void {
    appSettings.setString(AppSync.UNCONFIRMED_INSTALL_KEY, pack);
  }
}
