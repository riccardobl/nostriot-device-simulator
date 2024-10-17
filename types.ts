export interface PluginInfo {
    name: string;
    path: string;
}

export interface AppConfig {
    plugins: PluginInfo[];
}

export interface PluginConfig {
    unit?: string;
    threshold?: number;
}
