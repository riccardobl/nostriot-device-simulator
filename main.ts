import { AppConfig } from "./types.ts";
import {loadConfigFile} from "./config.ts";
import {loadPlugins} from "./plugins.ts";

(async () => {
    const config = await loadConfigFile("./config.json") as AppConfig;
    const plugins = await loadPlugins(config);
    console.log(config.privateKey);

    for (const plugin of plugins) {
        for (const capability of plugin.getCapabilities()) {
            console.log(`Plugin ${plugin.constructor.name} has capability: ${capability}`);
            switch (capability) {
                case "runMotor":
                {
                    const motorParams = ["value", "2", "unit","seconds"];
                    console.log(`Executing plugin: ${plugin.execute(motorParams)}`);
                    break;
                }
                case "getTemperature": {
                    console.log(`Executing plugin: ${plugin.execute()}`);
                    break;
                }
                default: {
                    console.log(`Plugin ${plugin.constructor.name} does not have capability: ${capability}`);
                }
            }
        }
    }
})();
