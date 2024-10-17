export default class TemperatureSensor {
    config: Record<string, unknown>;

    constructor(config: Record<string, unknown>) {
        this.config = config;
    }

    getCapabilities(): string[] {
        return ["getTemperature"];
    }

    execute(): number {
        const temp = Math.random() * 100
        return Math.round(temp * 100) / 100;
    }
}
