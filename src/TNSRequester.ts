import * as http from "http";
import Requester = Http.Requester;
const packageJson = require("./package.json");

export class TNSRequester implements Requester {
  request(verb: Http.Verb, url: string, callback: Callback<Http.Response>): void;
  request(verb: Http.Verb, url: string, requestBody: string, callback: Callback<Http.Response>): void;
  request(verb: Http.Verb, url: string, requestBody, callback?: Callback<Http.Response>): void {
    if (typeof requestBody === "function") {
      callback = requestBody;
      requestBody = null;
    }

    if (requestBody && typeof requestBody === "object") {
      requestBody = JSON.stringify(requestBody);
    }

    http.request({
      method: TNSRequester.getHttpMethodName(verb),
      url: url,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CodePush-Plugin-Name": packageJson.name,
        "X-CodePush-Plugin-Version": packageJson.version,
        "X-CodePush-SDK-Version": packageJson.dependencies["code-push"]
      }
    }).then((response: http.HttpResponse) => {
      callback(null, {
        statusCode: response.statusCode,
        body: response.content ? response.content.toString() : null
      });
    });
  }

  private static getHttpMethodName(verb): string {
    // This should stay in sync with the enum at
    // https://github.com/Microsoft/code-push/blob/master/sdk/script/acquisition-sdk.ts#L6
    return [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "DELETE",
      "TRACE",
      "OPTIONS",
      "CONNECT",
      "PATCH"
    ][verb];
  }
}