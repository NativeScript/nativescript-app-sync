import { AppSync, InstallMode, SyncStatus } from "nativescript-app-sync";
import * as application from "tns-core-modules/application";
import { Observable } from "tns-core-modules/data/observable";
import { isIOS } from "tns-core-modules/platform";

export class HelloWorldModel extends Observable {
  private appSync: AppSync;

  private static APPSYNC_IOS_STAGING_KEY = "QA5daorV624ZP3p0FbFkngdZasME4ksvOXqog";
  private static APPSYNC_IOS_PRODUCTION_KEY = "rOw06mG4jrWfU8wkoKY7WHM2LhVa4ksvOXqog";

  private static APPSYNC_ANDROID_STAGING_KEY = "ERb1vITM0ptuiLuEYKIt9v4bFhoQ4ksvOXqog";
  private static APPSYNC_ANDROID_PRODUCTION_KEY = "SOPWgPl7PTe0qy6xxvW4VAjrl1Z14ksvOXqog";

  public message: string;

  constructor() {
    super();
    this.appSync = new AppSync();

    // Check for updates when the app is loaded or resumed
    application.on(application.resumeEvent, () => {
      this.syncWithAppSyncServer();
    });
  }

  private syncWithAppSyncServer(): void {
    this.set("message", "Querying AppSync..");
    AppSync.sync({
      deploymentKey: isIOS ? HelloWorldModel.APPSYNC_IOS_STAGING_KEY : HelloWorldModel.APPSYNC_ANDROID_STAGING_KEY,
      installMode: InstallMode.ON_NEXT_RESTART, // default InstallMode.ON_NEXT_RESTART
      mandatoryInstallMode: isIOS ? InstallMode.ON_NEXT_RESUME : InstallMode.IMMEDIATE, // default InstallMode.ON_NEXT_RESUME
      updateDialog: { // only used for InstallMode.IMMEDIATE
        optionalUpdateMessage: "Optional update msg",
        updateTitle: "Please restart the app",
        mandatoryUpdateMessage: "Mandatory update msg",
        optionalIgnoreButtonLabel: "Later",
        mandatoryContinueButtonLabel: isIOS ? "Exit now" : "Restart now",
        appendReleaseDescription: true // appends the description you (optionally) provided when releasing a new version to AppSync
      }
    }, (syncStatus: SyncStatus): void => {
      if (syncStatus === SyncStatus.UP_TO_DATE) {
        this.set("message", "AppSync: up to date");
      } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
        this.set("message", "AppSync: update installed");
      }
    });
  }
}