export interface PluginInfo {
  name: string;
  path: string;
}

export interface AppConfig {
  privateKey: string;
  relays: string[];
  plugins: PluginInfo[];
}

export interface PluginConfig {
  unit?: string;
  threshold?: number;
}
