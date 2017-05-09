import { device } from "platform";
import * as AppVersion from "nativescript-appversion";
import { TNSRequester } from "./TNSRequester";
import { AcquisitionManager as CodePushSDK } from "code-push/script/acquisition-sdk";

export class TNSAcquisitionManager {

  private codePushSDK: AcquisitionManager;

  constructor(deploymentKey: string) {
    const config: Configuration = {
      serverUrl: "https://codepush.azurewebsites.net/",
      appVersion: AppVersion.getVersionNameSync(),
      clientUniqueId: device.uuid,
      deploymentKey: deploymentKey
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
      // console.log("---- reportStatusDeploy completed, previousLabelOrAppVersion: " + previousLabelOrAppVersion);
      // console.log("---- reportStatusDeploy completed, previousDeploymentKey: " + previousDeploymentKey);
    });
  }

  reportStatusDownload(pkg: IPackage): void {
    this.codePushSDK.reportStatusDownload(pkg, () => {
      // console.log("---- reportStatusDownload completed");
    });
  }
}