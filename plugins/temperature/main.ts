import { PluginConfig } from "../../types.ts";
export default class TemperatureSensor {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getCapabilities(): string[] {
    return ["getTemperature"];
  }

  execute(): number {
    const temp = Math.random() * 100;
    return Math.round(temp * 100) / 100;
  }
}
