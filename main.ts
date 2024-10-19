import { SimplePool } from "npm:nostr-tools";
import SimulatorContext from "./SimulatorContext.ts";


const pool = new SimplePool();
const ctx = new SimulatorContext();
await ctx.start(pool, {wait:true})


