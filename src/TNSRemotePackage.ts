import { File } from "tns-core-modules/file-system";
import { getFile } from "tns-core-modules/http";
import { TNSAcquisitionManager } from "./TNSAcquisitionManager";
import { TNSLocalPackage } from "./TNSLocalPackage";

export class TNSRemotePackage implements IRemotePackage {
  downloadUrl: string;
  deploymentKey: string;
  description: string;
  label: string;
  appVersion: string;
  isMandatory: boolean;
  packageHash: string;
  packageSize: number;
  failedInstall: boolean;
  serverUrl: string;

  download(downloadSuccess: SuccessCallback<ILocalPackage>, downloadError?: ErrorCallback, downloadProgress?: SuccessCallback<DownloadProgress>): void {
    getFile(this.downloadUrl).then(
        (file: File) => {
          let tnsLocalPackage: ILocalPackage = new TNSLocalPackage();
          tnsLocalPackage.localPath = file.path;
          tnsLocalPackage.deploymentKey = this.deploymentKey;
          tnsLocalPackage.description = this.description;
          tnsLocalPackage.label = this.label;
          tnsLocalPackage.appVersion = this.appVersion;
          tnsLocalPackage.isMandatory = this.isMandatory;
          tnsLocalPackage.packageHash = this.packageHash;
          tnsLocalPackage.isFirstRun = false;
          // TODO (low prio) see https://github.com/Microsoft/cordova-plugin-code-push/blob/055d9e625d47d56e707d9624c9a14a37736516bb/www/remotePackage.ts#L55 (but prolly not too relevant)
          tnsLocalPackage.failedInstall = false;
          tnsLocalPackage.serverUrl = this.serverUrl;

          downloadSuccess(tnsLocalPackage);

          new TNSAcquisitionManager(this.deploymentKey, this.serverUrl).reportStatusDownload(tnsLocalPackage);
        },
        (e: any) => {
          downloadError(new Error("Could not access local package. " + e));
        }
    );
  }

  abortDownload(abortSuccess?: SuccessCallback<void>, abortError?: ErrorCallback): void {
    // TODO (low prio)
  }
}
