import { CodePush, InstallMode, SyncStatus } from "nativescript-code-push";
import * as application from "tns-core-modules/application";
import { Observable } from "tns-core-modules/data/observable";
import { isIOS } from "tns-core-modules/platform";

// TODO add a demo which asks the user to restart the app to update it (with a 'confirm' and nativescript-exit)
export class HelloWorldModel extends Observable {
  private codePush: CodePush;

  private static CODEPUSH_IOS_STAGING_KEY = "YTmVMy0GLCknVu3GVIynTxmfwxJN4ksvOXqog";
  private static CODEPUSH_IOS_PRODUCTION_KEY = "r1DVaLfKjc0Y5d6BzqX45SFVss6a4ksvOXqog";

  private static CODEPUSH_ANDROID_STAGING_KEY = "0HwIQn0nkoRPEX93uv1dqmbWwvvJ4ksvOXqog";
  private static CODEPUSH_ANDROID_PRODUCTION_KEY = "C0Mf7oZS5BWYNABikJUFXlSF8rjF4ksvOXqog";

  public message: string;

  constructor() {
    super();
    this.codePush = new CodePush();

    // let's immediately check for updates on the server
    this.syncWithCodePushServer();

    // and also check for updates whenever the application is resumed
    application.on(application.resumeEvent, () => {
      this.syncWithCodePushServer();
    });
  }

  private syncWithCodePushServer(): void {
    this.set("message", "Querying CodePush..");
    let that = this;

    CodePush.sync({
      deploymentKey: isIOS ? HelloWorldModel.CODEPUSH_IOS_STAGING_KEY : HelloWorldModel.CODEPUSH_ANDROID_STAGING_KEY,
      installMode: InstallMode.ON_NEXT_RESTART,    // has not effect currently, always using ON_NEXT_RESTART
      mandatoryInstallMode: InstallMode.IMMEDIATE // has not effect currently, always using ON_NEXT_RESTART
    }, (syncStatus: SyncStatus): void => {
      console.log("syncStatus: " + syncStatus);
      if (syncStatus === SyncStatus.UP_TO_DATE) {
        that.set("message", "CodePush: up to date");
      } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
        that.set("message", "CodePush: update installed, kill/restart your app to see the changes");
      }
    });
  }
}