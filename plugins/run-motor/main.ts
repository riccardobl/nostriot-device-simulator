import { PluginConfig } from "../../types.ts";
export default class RunMotor {
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

  execute(params: (string | number)[] = []): string {
    // Stringify params and return
    return JSON.stringify(params);
  }
}
