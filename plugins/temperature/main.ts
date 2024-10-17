import { PluginConfig } from "../../types.ts";
export default class TemperatureSensor {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getCapability(): string {
    return "getTemperature";
  }

  getType(): string {
    return "temperature";
  }

  getUnit(): string {
    return "celsius";
  }

  execute(): number {
    const temp = Math.random() * 100;
    return Math.round(temp * 100) / 100;
  }
}
