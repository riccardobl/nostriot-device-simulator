import { AppConfig, PluginConfig } from "./types.ts";

async function getAppConfig(filePath: string) {
    const text = await Deno.readTextFile<AppConfig>(filePath);
    return JSON.parse(text);
}

async function loadPlugin(pluginPath: string, config: PluginConfig) {
    const pluginModule = await import(pluginPath);
    const PluginClass = pluginModule.default;
    const pluginInstance = new PluginClass(config);

    return pluginInstance;
}

async function loadPlugins(config: AppConfig) {
    const pluginsConfig = config.plugins;

    const loadedPlugins = [];

    for (const pluginInfo of pluginsConfig) {
        const pluginConfigPath = `./plugins/${pluginInfo.name}/config.json`;
        const pluginConfig = await getAppConfig<PluginConfig>(pluginConfigPath);

        const plugin = await loadPlugin(pluginInfo.path, pluginConfig);

        console.log(`${pluginInfo.name} capabilities: ${plugin.getCapabilities().join(", ")}`);

        loadedPlugins.push(plugin);
    }

    return loadedPlugins;
}

(async () => {
    const config = await getAppConfig<AppConfig>("./config.json");
    const plugins = await loadPlugins(config);
    console.log(config.privatekey);

    for (const plugin of plugins) {
        for (const capability of plugin.getCapabilities()) {
            console.log(`Plugin ${plugin.constructor.name} has capability: ${capability}`);
            switch (capability) {
                case "runMotor":
                {
                    const motorParams = ["value", "20", "unit","celcius"];
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
