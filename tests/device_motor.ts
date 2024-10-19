import { assert, assertEquals } from "@std/assert";
import { AppConfig } from "../types.ts";
import SimulatorContext from "../SimulatorContext.ts";
import { SimplePool } from "npm:nostr-tools";


// Mock data and functions if necessary
const mockConfig: AppConfig = {
  relays: ["wss://relay.nostriot.com"],
  devices: [
    { name: "run-motor", path: "./devices/run-motor/main.ts", privkey: "5d5fec0a282be86b3fb8a0d6196685ab2654ea2ffdd47b395b05cdaca45d52fe" },
  ],
  debugMode: true,
  groups:[]
};

const pool = new SimplePool()


Deno.test({
  name: "Run Motor Plugin",
  fn: async () => {
    const context = new SimulatorContext(mockConfig);
    await context.start(pool, { autoLoop: false, autoAnnounce: false });
    const devices = await context.getDevices();
    assertEquals(devices.length, 1);
    const runMotor = devices[0];
    assertEquals(runMotor?.meta?.name, "run-motor");
    const direction = 1; // 1 for forward, -1 for backward
    const duration = 1; // seconds
    const speed = 2; // units per seconds
    const responses = await runMotor.debugRunActions([{
      method: "move",
      params: [direction, duration, speed]
    }])
    assertEquals(responses[0]?.result, "ok");
    await runMotor.loop(1);
    const states = await runMotor.debugGetStates();
    assertEquals(states[0]?.method, "position");
    assertEquals(states[0]?.result, 1);
    await context.stop();
  },
  sanitizeResources: false,
  sanitizeOps: false
});
