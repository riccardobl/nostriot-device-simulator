import { AppConfig, PluginConfig } from "./types.ts";

export async function loadConfigFile(filePath: string): Promise<AppConfig> {
  const text = await Deno.readTextFile(filePath);
  return JSON.parse(text) as AppConfig;
}

export async function loadPluginConfigFile(
  filePath: string,
): Promise<PluginConfig> {
  const text = await Deno.readTextFile(filePath);
  return JSON.parse(text) as PluginConfig;
}
