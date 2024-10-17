import {AppConfig, PluginConfig} from "./types.ts";
import {loadConfigFile} from "./config.ts";

async function loadPlugin(pluginPath: string, config: PluginConfig) {
    const pluginModule = await import(pluginPath);
    const PluginClass = pluginModule.default;
    const pluginInstance = new PluginClass(config);

    return pluginInstance;
}

export async function loadPlugins(config: AppConfig) {
    const pluginsConfig = config.plugins;

    const loadedPlugins = [];

    for (const pluginInfo of pluginsConfig) {
        const pluginConfigPath = `./plugins/${pluginInfo.name}/config.json`;
        const pluginConfig = await loadConfigFile(pluginConfigPath) as PluginConfig;

        const plugin = await loadPlugin(pluginInfo.path, pluginConfig);

        console.log(`${pluginInfo.name} capabilities: ${plugin.getCapabilities().join(", ")}`);

        loadedPlugins.push(plugin);
    }

    return loadedPlugins;
}
