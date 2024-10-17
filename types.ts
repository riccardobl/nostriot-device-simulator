export interface PluginInfo {
    name: string;
    path: string;
}

export interface AppConfig {
    privatekey: string;
    plugins: PluginInfo[];
}

export interface PluginConfig {
    unit?: string;
    threshold?: number;
}
