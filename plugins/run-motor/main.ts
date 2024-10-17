import { PluginConfig } from "../../types.ts";
export default class RunMotor {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getCapability(): string {
    return "runMotor";
  }

  getType(): string {
    return "duration";
  }

  getUnit(): string {
    return "seconds";
  }

  execute(params: (string | number)[] = []): string {
    // Stringify params and return
    return JSON.stringify(params);
  }
}
