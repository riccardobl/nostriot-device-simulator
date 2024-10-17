import { AppConfig } from "./types.ts";

export async function loadConfigFile(filePath: string): Promise<AppConfig> {
  const text = await Deno.readTextFile(filePath);
  return JSON.parse(text) as AppConfig;
}
