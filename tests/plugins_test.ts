import { assert, assertEquals } from "@std/assert";
import { loadConfigFile } from "../config.ts";
import { loadPlugins } from "../plugins.ts";
import { AppConfig } from "../types.ts";

// Mock data and functions if necessary
const mockConfig: AppConfig = {
  privateKey:
    "5d5fec0a282be86b3fb8a0d6196685ab2654ea2ffdd47b395b05cdaca45d52fe",
  plugins: [
    { name: "temperature", path: "./plugins/temperature/main.ts" },
    { name: "run-motor", path: "./plugins/run-motor/main.ts" },
  ],
};

// This is just an example. Replace './tests.config.json' with your actual path if needed
Deno.writeTextFileSync("./tests.config.json", JSON.stringify(mockConfig));

Deno.test("Load Configuration File", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  assert(config);
  console.log(config.plugins.length);
  assertEquals(config.plugins.length, 2);
});

Deno.test("Load Plugins", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  const plugins = await loadPlugins(config);
  assertEquals(plugins.length, config.plugins.length);
  assert(
    plugins.every((plugin) => typeof plugin.getCapabilities === "function"),
  );
});

Deno.test("Temperature Sensor Plugin", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  const plugins = await loadPlugins(config);
  const tempSensor = plugins.find((p) =>
    p.constructor.name === "TemperatureSensor"
  );
  assert(tempSensor);
  assertEquals(tempSensor.getCapabilities(), ["getTemperature"]);
  assert(typeof tempSensor.execute() === "number");
});

Deno.test("Run Motor Plugin", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  const plugins = await loadPlugins(config);
  const runMotor = plugins.find((p) => p.constructor.name === "RunMotor");
  assert(runMotor);
  assertEquals(runMotor.getCapabilities(), ["runMotor"]);
  const motorParams = ["value", "2", "unit", "seconds"];
  const expected = JSON.stringify(motorParams);
  assertEquals(runMotor.execute(motorParams), expected);
});

// Cleanup if necessary
// Deno.removeSync("./tests.config.json");
