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
  name: string;
  about: string;
  capability: string;
  eventTags?: { [key: string]: string[] };
  serviceAnnouncementTags?: { [key: string]: string[] };
}
