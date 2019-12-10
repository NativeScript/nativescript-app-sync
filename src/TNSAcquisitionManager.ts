import * as AppVersion from "nativescript-appversion";
import { AcquisitionManager as AppSyncSDK } from "nativescript-app-sync-sdk/script/acquisition-sdk";
import { Device } from "@nativescript/core";
import { TNSRequester } from "./TNSRequester";

export class TNSAcquisitionManager {

  private appSyncSDK: AcquisitionManager;

  constructor(deploymentKey: string, serverUrl: string) {
    const config: Configuration = {
      serverUrl,
      appVersion: AppVersion.getVersionNameSync(),
      clientUniqueId: Device.uuid,
      deploymentKey
    };
    this.appSyncSDK = new AppSyncSDK(new TNSRequester(), config);
    return this;
  }

  queryUpdateWithCurrentPackage(currentPackage: IPackage, callback?: Callback<IRemotePackage | NativeUpdateNotification>): void {
    this.appSyncSDK.queryUpdateWithCurrentPackage(currentPackage, callback);
  }

  reportStatusDeploy(pkg?: IPackage, status?: string, previousLabelOrAppVersion?: string, previousDeploymentKey?: string): void {
    this.appSyncSDK.reportStatusDeploy(pkg, status, previousLabelOrAppVersion, previousDeploymentKey, () => {
      // console.log("---- reportStatusDeploy completed, status: " + status);
      // console.log("---- reportStatusDeploy completed, pkg: " + JSON.stringify(pkg));
    });
  }

  reportStatusDownload(pkg: IPackage): void {
    this.appSyncSDK.reportStatusDownload(pkg, () => {
      // console.log("---- reportStatusDownload completed");
    });
  }
}