import { finalizeEvent, getPublicKey, SimplePool } from "npm:nostr-tools";
import { hexToBytes } from "npm:@noble/hashes/utils";
import { loadConfigFile } from "./config.ts";
import { getServiceAnnouncementEvent } from "./nostr/dvm.ts";
import { AppConfig } from "./types.ts";
import { loadPlugins } from "./plugins.ts";

(async () => {
  const appConfig = await loadConfigFile("./config.json") as AppConfig;
  const plugins = await loadPlugins(appConfig);

  const sk = hexToBytes(appConfig.privateKey);
  const pk = getPublicKey(sk);

  const pool = new SimplePool();
  // await Promise.any(pool.publish(appConfig.relays, signedEvent))
  // console.log('Published service announcement event');

  for (const plugin of plugins) {
    const capability = plugin.getCapability();
    console.log(
      `Plugin ${plugin.constructor.name} has capability: ${capability}`,
    );
    const serviceAnnouncementEvent = getServiceAnnouncementEvent(
      `A thing with capability: ${capability}`,
      "A simulated IoT DVM",
      5107,
      ["temperature", "unit", "celsius"],
    );
    const signedEvent = finalizeEvent(serviceAnnouncementEvent, sk);
    // console.log('publishing service announcement event...', signedEvent);

    // switch (capability) {
    //   case "runMotor": {
    //     const motorParams = ["value", "2", "unit", "seconds"];
    //     console.log(
    //         `Executing plugin capability: ${plugin.execute(motorParams)}`,
    //     );
    //     break;
    //   }
    //   case "getTemperature": {
    //     console.log(`Executing capability: ${plugin.execute()}`);
    //     break;
    //   }
    // }
  }
})();

// let h = pool.subscribeMany(
//   appConfig.relays,
//   [
//     {
//       "#p": [pk],
//     },
//   ],
//   {
//     onevent(event) {
//       console.log(event);
//     },
//     oneose() {
//       h.close();
//     },
//   },
// );
