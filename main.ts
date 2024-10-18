import {
  EventTemplate,
  finalizeEvent,
  getPublicKey,
  SimplePool,
} from "npm:nostr-tools";
import { hexToBytes } from "npm:@noble/hashes/utils";
import { loadConfigFile } from "./config.ts";
import { getServiceAnnouncementEvent } from "./nostr/dvm.ts";
import { AppConfig } from "./types.ts";
import { loadPlugins } from "./plugins.ts";

const appConfig = await loadConfigFile("./config.json") as AppConfig;
const plugins = await loadPlugins(appConfig);

const sk = hexToBytes(appConfig.privateKey);
const pk = getPublicKey(sk);

console.log("Public key:", pk);

const pool = new SimplePool();

// for each plugin, publish a service announcement event for the plugin's capability
// for (const plugin of plugins) {
//   const capability = plugin.getCapability();
//   const serviceAnnouncementEvent = getServiceAnnouncementEvent(
//     `A thing with capability: ${capability}`,
//     "A simulated IoT DVM",
//     5107,
//     plugin.getServiceAnnouncementTags(),
//   );
//   const signedEvent = finalizeEvent(serviceAnnouncementEvent, sk);
//   console.log("publishing service announcement event...", signedEvent);
//   await Promise.any(pool.publish(appConfig.relays, signedEvent));
//
//   // switch (capability) {
//   //   case "runMotor": {
//   //     const motorParams = ["value", "2", "unit", "seconds"];
//   //     console.log(
//   //         `Executing plugin capability: ${plugin.execute(motorParams)}`,
//   //     );
//   //     break;
//   //   }
//   //   case "getTemperature": {
//   //     console.log(`Executing capability: ${plugin.execute()}`);
//   //     break;
//   //   }
//   // }
// }

/**
 * Handle a DVM job request
 * @param event
 */
const handleJobRequest = async (event: EventTemplate) => {
  console.log("handling job request...");
  const iTagParams = event.tags[0][1];
  const dvmRequestParams = JSON.parse(iTagParams);
  console.log(`The job request is to ${dvmRequestParams[0].method}`);
  console.log("The params are: ", dvmRequestParams[0].params);

  // TODO: Push this request into a plugin and send the plug exec output as a DVM job response
};

let h = pool.subscribeMany(
  appConfig.relays,
  [
    {
      "kinds": [5107],
      "#p": [pk],
      "limit": 1,
    },
  ],
  {
    onevent(event) {
      handleJobRequest(event);
    },
    oneose() {
      console.log("oneose");
    },
  },
);
