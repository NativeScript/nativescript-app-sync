import { AppSync, InstallMode, SyncStatus } from "nativescript-app-sync";
import * as application from "tns-core-modules/application";
import * as appSettings from "tns-core-modules/application-settings";
import { knownFolders } from "tns-core-modules/file-system" ;
import { Observable } from "tns-core-modules/data/observable";
import { isIOS } from "tns-core-modules/platform";

const documents = knownFolders.documents();
const txtFile = documents.getFile("/app/something.txt");

export class HelloWorldModel extends Observable {
  private appSync: AppSync;

  private static APPSETTINGS_KEY = "appsettings_key";

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

    this.set("message", "HMR enabled: " +  (typeof (<any>global).hmrRefresh === "function"));
  }

  public setAppSettings() {
    const d = new Date();
    appSettings.setString(HelloWorldModel.APPSETTINGS_KEY, "AppSettings value set at " + d);
    this.set("message", "Written date to AppSettings: " + d);
  }

  public getAppSettings() {
    this.set("message", appSettings.getString(HelloWorldModel.APPSETTINGS_KEY));
  }

  public setFileSystem() {
    const d = new Date();
    txtFile.writeText("FileSystem value set at " + d)
        .then(() => {
          const value = "Written date to " + txtFile.path + ": " + d;
          this.set("message", value);
          console.log(value);
        })
        .catch(err => {
          this.set("message", "Error writing to " + txtFile.path + ": " + err);
          console.log("Error writing to " + txtFile.path + ": " + err);
        });
  }

  public getFileSystem() {
    txtFile.readText()
        .then(content => {
          this.set("message", "Got from " + txtFile.path + ": " + content);
          console.log("Written to " + txtFile.path + ": " + content);
        })
        .catch(err => {
          this.set("message", "Error reading from " + txtFile.path + ": " + err);
          console.log("Error reading from " + txtFile.path + ": " + err);
        });
  }

  private syncWithAppSyncServer(): void {
    this.set("message", "Querying AppSync..");
    AppSync.sync({
      enabledWhenUsingHmr: false,
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
    }, (syncStatus: SyncStatus, updateLabel?: string): void => {
      if (syncStatus === SyncStatus.UP_TO_DATE) {
        this.set("message", `AppSync: up to date: ${updateLabel}`);
      } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
        this.set("message", `AppSync: update installed: ${updateLabel}`);
      } else {
        this.set("message", `AppSync: status changed to: ${syncStatus}`);
      }
    });
  }
}
