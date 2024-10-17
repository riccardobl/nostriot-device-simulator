export default class RunMotor {
    config: Record<string, unknown>;

    constructor(config: Record<string, unknown>) {
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
