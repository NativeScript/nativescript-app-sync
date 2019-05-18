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

    // Check for updates when the app is loaded or resumed
    application.on(application.resumeEvent, () => this.syncWithCodePushServer());
  }

  private syncWithCodePushServer(): void {
    this.set("message", "Querying CodePush..");
    CodePush.sync({
      deploymentKey: isIOS ? HelloWorldModel.CODEPUSH_IOS_STAGING_KEY : HelloWorldModel.CODEPUSH_ANDROID_STAGING_KEY,
      installMode: InstallMode.ON_NEXT_RESTART, // default InstallMode.ON_NEXT_RESTART
      mandatoryInstallMode: isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE, // default InstallMode.ON_NEXT_RESUME
      updateDialog: { // only used for InstallMode.IMMEDIATE
        optionalUpdateMessage: "Optional update msg",
        updateTitle: "Please restart the app",
        mandatoryUpdateMessage: "Mandatory update msg",
        optionalIgnoreButtonLabel: "Later",
        mandatoryContinueButtonLabel: isIOS ? "Exit now" : "Restart now",
        appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to CodePush
      }
    }, (syncStatus: SyncStatus): void => {
      if (syncStatus === SyncStatus.UP_TO_DATE) {
        this.set("message", "CodePush: up to date");
      } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
        this.set("message", "CodePush: update installed");
      }
    });
  }
}