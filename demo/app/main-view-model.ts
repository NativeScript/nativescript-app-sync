import { Observable } from "data/observable";
import { isIOS } from "platform";
import { CodePush, SyncStatus, InstallMode } from "nativescript-code-push";
import * as application from "application";

export class HelloWorldModel extends Observable {
  private codePush: CodePush;

  private static CODEPUSH_IOS_STAGING_KEY        = "SO3S7X-22w2t8XHII3Fn-A0SDoxs4kKkEXoCG";
  private static CODEPUSH_IOS_PRODUCTION_KEY     = "xQmsbDYyAtiKMPZ7s8CjBqJRUnu14kKkEXoCG";

  private static CODEPUSH_ANDROID_STAGING_KEY    = "gQfu7eaGua8lVmuMXi2OPAhVe7fA4kKkEXoCG";
  private static CODEPUSH_ANDROID_PRODUCTION_KEY = "aTQcqCJzwlpG82IQXKE_XFdEPLD54kKkEXoCG";

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
        mandatoryInstallMode: InstallMode.IMMEDIATE  // has not effect currently, always using ON_NEXT_RESTART
      }, (syncStatus: SyncStatus): void => {
        console.log("-- syncStatus: " + syncStatus);
        if (syncStatus === SyncStatus.UP_TO_DATE) {
          that.set("message", "CodePush: up to date");
        } else if (syncStatus === SyncStatus.UPDATE_INSTALLED) {
          that.set("message", "CodePush: update installed, kill/restart your app to see the changes");
        }
      });
  }
}