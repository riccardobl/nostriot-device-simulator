import { PluginConfig } from "../../types.ts";
export default class RunMotor {
    config: PluginConfig;

    constructor(config: PluginConfig) {
        this.config = config;
    }

    getCapabilities(): string[] {
        return ["runMotor"];
    }

    execute(params: (string | number)[] = []): string {
        // Stringify params and return
        return JSON.stringify(params);
    }
}
