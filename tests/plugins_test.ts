import { assert, assertEquals } from "@std/assert";
import { loadConfigFile } from "../config.ts";
import { getPlugins } from "../plugins.ts";
import { AppConfig } from "../types.ts";

// Mock data and functions if necessary
const mockConfig: AppConfig = {
  privateKey:
    "5d5fec0a282be86b3fb8a0d6196685ab2654ea2ffdd47b395b05cdaca45d52fe",
  relays: ["wss://relay.nostriot.com"],
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
  assertEquals(config.plugins.length, 2);
});

Deno.test("Temperature Sensor Plugin", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  const plugins = await getPlugins(config);
  // plugins is a Map<string:any> so we need to find the plugin by name
  const tempSensor = plugins.get("temperature");
  assert(tempSensor);
  assertEquals(tempSensor.getCapability(), "getTemperature");
  assert(typeof tempSensor.execute() === "number");
});

Deno.test("Run Motor Plugin", async () => {
  const config = await loadConfigFile("./tests.config.json") as AppConfig;
  const plugins = await getPlugins(config);
  const runMotor = plugins.get("run-motor");
  assert(runMotor);
  assertEquals(runMotor.getCapability(), "runMotor");
  const motorParams = ["value", "2", "unit", "seconds"];
  const expected = JSON.stringify(motorParams);
  assertEquals(runMotor.execute(motorParams), expected);
});
