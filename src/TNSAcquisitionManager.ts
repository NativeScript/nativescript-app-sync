import * as AppVersion from "nativescript-appversion";
import { AcquisitionManager as CodePushSDK } from "nativescript-code-push-sdk/script/acquisition-sdk";
import { device } from "tns-core-modules/platform";
import { TNSRequester } from "./TNSRequester";

export class TNSAcquisitionManager {

  private codePushSDK: AcquisitionManager;

  constructor(deploymentKey: string, serverUrl: string) {
    const config: Configuration = {
      serverUrl,
      appVersion: AppVersion.getVersionNameSync(),
      clientUniqueId: device.uuid,
      deploymentKey
    };
    this.codePushSDK = new CodePushSDK(new TNSRequester(), config);
    return this;
  }

  queryUpdateWithCurrentPackage(currentPackage: IPackage, callback?: Callback<IRemotePackage | NativeUpdateNotification>): void {
    this.codePushSDK.queryUpdateWithCurrentPackage(currentPackage, callback);
  }

  reportStatusDeploy(pkg?: IPackage, status?: string, previousLabelOrAppVersion?: string, previousDeploymentKey?: string): void {
    this.codePushSDK.reportStatusDeploy(pkg, status, previousLabelOrAppVersion, previousDeploymentKey, () => {
      // console.log("---- reportStatusDeploy completed, status: " + status);
      // console.log("---- reportStatusDeploy completed, pkg: " + JSON.stringify(pkg));
    });
  }

  reportStatusDownload(pkg: IPackage): void {
    this.codePushSDK.reportStatusDownload(pkg, () => {
      // console.log("---- reportStatusDownload completed");
    });
  }
}