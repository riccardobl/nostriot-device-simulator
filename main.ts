import {
  EventTemplate,
  finalizeEvent,
  getPublicKey,
  SimplePool,
  VerifiedEvent,
} from "npm:nostr-tools";
import { hexToBytes } from "npm:@noble/hashes/utils";
import { loadConfigFile } from "./config.ts";
import {
  getJobRequestInputData,
  getJobResultEvent,
  getServiceAnnouncementEvent,
  JobRequestInputData,
} from "./nostr/dvm.ts";
import { AppConfig } from "./types.ts";
import { getPlugins } from "./plugins.ts";

const appConfig = await loadConfigFile("./config.json") as AppConfig;
const plugins = await getPlugins(appConfig);

const sk = hexToBytes(appConfig.privateKey);
const pk = getPublicKey(sk);

const pool = new SimplePool();

// for each plugin, publish a service announcement event for the plugin's capability
for (const plugin of plugins) {
  const pluginObj = plugin[1];
  const capability = pluginObj.getCapability();
  const serviceAnnouncementEvent = getServiceAnnouncementEvent(
    pluginObj.getName(),
    pluginObj.getAbout(),
    pluginObj.getServiceAnnouncementTags(),
  );
  const signedEvent = finalizeEvent(serviceAnnouncementEvent, sk);
  console.log("publishing service announcement event.");
  await Promise.any(pool.publish(appConfig.relays, signedEvent));
}

/**
 * Handle a DVM job request
 * @param event
 */
const handleJobRequest = async (event: VerifiedEvent) => {
  const jobRequestInputData: JobRequestInputData = getJobRequestInputData(
    event,
  );
  const iTagParams = event.tags[0][1];
  const dvmRequestParams = JSON.parse(iTagParams);
  console.log(`Received job request for: ${dvmRequestParams[0].method}`);

  switch (dvmRequestParams[0].method) {
    case "getTemperature": {
      console.log("Handling getTemperature request");
      const temp = plugins.get("temperature").execute();
      const jobResult = getJobResultEvent(event, JSON.stringify(temp));
      const signedEvent = finalizeEvent(jobResult, sk);
      await Promise.any(pool.publish(appConfig.relays, signedEvent));
      break;
    }
    case "runMotor": {
      console.log("Handling runMotor request");
      const speed = dvmRequestParams[0].params[0];
      const result = plugins.get("motor").execute([speed]);
      const jobResult = getJobResultEvent(event, JSON.stringify(result));
      const signedEvent = finalizeEvent(jobResult, sk);
      await Promise.any(pool.publish(appConfig.relays, signedEvent));
      break;
    }
    default:
      console.log("Unknown method");
  }
};

let h = pool.subscribeMany(
  appConfig.relays,
  [
    {
      "kinds": [5107],
      "#p": [pk],
      "limit": 0,
    },
  ],
  {
    onevent(event) {
      handleJobRequest(event);
    },
    oneose() {
      console.log("EOSE");
    },
  },
);
