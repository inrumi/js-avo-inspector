import { AvoInspectorEnv, AvoInspectorEnvValueType } from "./AvoInspectorEnv";
import { AvoSchemaParser } from "./AvoSchemaParser";
import { AvoSessionTracker } from "./AvoSessionTracker";
import { AvoBatcher } from "./AvoBatcher";
import { AvoNetworkCallsHandler } from "./AvoNetworkCallsHandler";
import { AvoStorage } from "./AvoStorage";

let libVersion = require("../package.json").version;

export class AvoInspector {
  environment: AvoInspectorEnvValueType;
  avoBatcher: AvoBatcher;
  sessionTracker: AvoSessionTracker;
  apiKey: string;
  version: string;

  static avoStorage: AvoStorage;

  private static _batchSize = 30;
  static get batchSize() {
    return this._batchSize;
  }

  private static _batchFlushSeconds = 30;
  static get batchFlushSeconds() {
    return this._batchFlushSeconds;
  }

  private static _shouldLog = false;
  static get shouldLog() {
    return this._shouldLog;
  }

  // constructor(apiKey: string, env: AvoInspectorEnv, version: string) {
  constructor(options: {
    apiKey: string;
    env: AvoInspectorEnvValueType;
    version: string;
    appName?: string;
  }) {
    // the constructor does aggressive null/undefined checking because same code paths will be accessible from JS
    
    if (options.env === null || options.env === undefined || 
      //@ts-ignore
      options.env === "") {
      this.environment = AvoInspectorEnv.Dev;
      console.warn(
        "[Avo Inspector] No environment provided. Defaulting to dev."
      );
    } else {
      this.environment = options.env;
    }

    if (
      options.apiKey === null ||
      options.apiKey === undefined ||
      options.apiKey.trim().length == 0
    ) {
      throw new Error(
        "[Avo Inspector] No API key provided. Inspector can't operate without API key."
      );
    } else {
      this.apiKey = options.apiKey;
    }

    if (
      options.version === null ||
      options.version === undefined ||
      options.version.trim().length == 0
    ) {
      throw new Error(
        "[Avo Inspector] No version provided. Many features of Inspector rely on versioning. Please provide comparable string version, i.e. integer or semantic."
      );
    } else {
      this.version = options.version;
    }

    if (this.environment === AvoInspectorEnv.Dev) {
      AvoInspector._batchFlushSeconds = 1;
      AvoInspector._shouldLog = true;
    } else {
      AvoInspector._batchFlushSeconds = 30;
      AvoInspector._shouldLog = false;
    }

    AvoInspector.avoStorage = new AvoStorage();

    let avoNetworkCallsHandler = new AvoNetworkCallsHandler(
      this.apiKey,
      this.environment.toString(),
      options.appName || "",
      this.version,
      libVersion
    );
    this.avoBatcher = new AvoBatcher(avoNetworkCallsHandler);
    this.sessionTracker = new AvoSessionTracker(this.avoBatcher);

    try {
      if (process.env.BROWSER) {
        // XXX make node/browser split clearer
        if (typeof window !== "undefined") {
          window.addEventListener(
            "load",
            () => {
              this.sessionTracker.startOrProlongSession(Date.now());
            },
            false
          );
        }
      } else {
        this.sessionTracker.startOrProlongSession(Date.now());
      }
    } catch (e) {
      console.error(
        "Avo Inspector: something went very wrong. Please report to support@avo.app.",
        e
      );
    }
  }

  trackSchemaFromEvent(
    eventName: string,
    eventProperties: { [propName: string]: any }
  ): void {
    try {
      if (AvoInspector.shouldLog) {
        console.log(
          "Avo Inspector: supplied event " +
            eventName +
            " with params " +
            JSON.stringify(eventProperties)
        );
      }
      let eventSchema = this.extractSchema(eventProperties);
      this.trackSchema(eventName, eventSchema);
    } catch (e) {
      console.error(
        "Avo Inspector: something went very wrong. Please report to support@avo.app.",
        e
      );
    }
  }

  trackSchema(
    eventName: string,
    eventSchema: Array<{
      propertyName: string;
      propertyType: string;
      children?: any;
    }>
  ): void {
    try {
      this.sessionTracker.startOrProlongSession(Date.now());
      this.avoBatcher.handleTrackSchema(eventName, eventSchema);
    } catch (e) {
      console.error(
        "Avo Inspector: something went very wrong. Please report to support@avo.app.",
        e
      );
    }
  }

  enableLogging(enable: boolean) {
    AvoInspector._shouldLog = enable;
  }

  extractSchema(eventProperties: {
    [propName: string]: any;
  }): Array<{
    propertyName: string;
    propertyType: string;
    children?: any;
  }> {
    try {
      this.sessionTracker.startOrProlongSession(Date.now());
      return new AvoSchemaParser().extractSchema(eventProperties);
    } catch (e) {
      console.error(
        "Avo Inspector: something went very wrong. Please report to support@avo.app.",
        e
      );
      return [];
    }
  }

  setBatchSize(newBatchSize: number): void {
    AvoInspector._batchSize = newBatchSize;
  }

  setBatchFlushSeconds(newBatchFlushSeconds: number): void {
    AvoInspector._batchFlushSeconds = newBatchFlushSeconds;
  }
}
