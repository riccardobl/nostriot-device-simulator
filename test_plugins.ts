import { AppConfig } from "./types.ts";
import { loadConfigFile } from "./config.ts";
import { getPlugins } from "./plugins.ts";

(async () => {
  const config = await loadConfigFile("./config.json") as AppConfig;
  const plugins = await getPlugins(config);

  for (const plugin of plugins) {
    const capability = plugin.getCapability();
    console.log(
      `Plugin ${plugin.constructor.name} has capability: ${capability}`,
    );
    switch (capability) {
      case "runMotor": {
        const motorParams = ["value", "2", "unit", "seconds"];
        console.log(
          `Executing plugin capability: ${plugin.execute(motorParams)}`,
        );
        break;
      }
      case "getTemperature": {
        console.log(`Executing capability: ${plugin.execute()}`);
        break;
      }
    }
  }
})();
