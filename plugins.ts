import { AppConfig, PluginConfig } from "./types.ts";
import { loadPluginConfigFile } from "./config.ts";

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
    const pluginConfig = await loadPluginConfigFile(
      pluginConfigPath,
    ) as PluginConfig;

    const plugin = await loadPlugin(pluginInfo.path, pluginConfig);

    console.log(
      `${pluginInfo.name} capability: ${plugin.getCapability()}`,
    );

    loadedPlugins.push(plugin);
  }

  return loadedPlugins;
}
