import { PluginConfig } from "../../types.ts";
export default class RunMotor {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  getName(): string {
    return this.config.name;
  }

  getAbout(): string {
    return this.config.about;
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

  execute(runDuration: (string | number)[] = []): string {
    // Stringify params and return
    return `Motor running for ${runDuration} seconds`;
  }
}
