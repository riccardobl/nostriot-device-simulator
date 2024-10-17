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

  // for each plugin, publish a service announcement event for the plugin's capability
  for (const plugin of plugins) {
    const capability = plugin.getCapability();
    const pluginDataType = plugin.getType();
    const pluginUnit = plugin.getUnit();
    const serviceAnnouncementEvent = getServiceAnnouncementEvent(
      `A thing with capability: ${capability}`,
      "A simulated IoT DVM",
      5107,
      [pluginDataType, "unit", pluginUnit],
    );
    const signedEvent = finalizeEvent(serviceAnnouncementEvent, sk);
    console.log("publishing service announcement event...", signedEvent);
    await Promise.any(pool.publish(appConfig.relays, signedEvent));

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
