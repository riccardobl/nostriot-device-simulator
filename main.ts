// Function to read and parse JSON files
async function readJsonFile(filePath: string) {
    const text = await Deno.readTextFile(filePath);
    return JSON.parse(text);
}

// Define a flexible type for plugin configuration
async function loadPlugin(pluginPath: string, config: Record<string, unknown>) {
    const pluginModule = await import(pluginPath);
    const PluginClass = pluginModule.default;
    const pluginInstance = new PluginClass(config);

    return pluginInstance;
}

async function loadPlugins() {
    const config = await readJsonFile("./config.json");
    const pluginsConfig = config.plugins;

    const loadedPlugins = [];

    for (const pluginInfo of pluginsConfig) {
        const pluginConfigPath = `./plugins/${pluginInfo.name}/config.json`;
        const pluginConfig = await readJsonFile(pluginConfigPath);

        const plugin = await loadPlugin(pluginInfo.path, pluginConfig);

        console.log(`${pluginInfo.name} capabilities: ${plugin.getCapabilities().join(", ")}`);

        loadedPlugins.push(plugin);
    }

    return loadedPlugins;
}

(async () => {
    const plugins = await loadPlugins();

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
