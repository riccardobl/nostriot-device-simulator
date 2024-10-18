import { PluginConfig } from "../../types.ts";
export default class TemperatureSensor {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getCapability(): string {
    return this.config.capability;
  }

  getEventTags(): { [key: string]: string[] } {
    return this.config.eventTags || {};
  }

  getServiceAnnouncementTags(): { [key: string]: string[] } {
    return this.config.serviceAnnouncementTags || {};
  }

  execute(): number {
    const temp = Math.random() * 100;
    return Math.round(temp * 100) / 100;
  }
}
