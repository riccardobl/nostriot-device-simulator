import JSON5 from "npm:json5";
import { SimplePool } from "npm:nostr-tools";
import type IoTDevice from "./src/IoTDevice.ts";
import { generateSecretKey } from "npm:nostr-tools/pure";
import { bytesToHex } from "npm:@noble/hashes/utils";
import IoTTransport from "./src/IoTTransport.ts";
import {AppConfig, DeviceConfig} from "./types.ts";
import {dirname} from "node:path";


export default class SimulatorContext {
    devices?: Array<IoTDevice> = [];
    pool?: SimplePool;
    transport?: IoTTransport;
    announceTimeout?: any;
    lastLoop: number = Date.now();
    onClosed: Array<() => void> = [];
    config?: AppConfig;
    autoLoop: boolean = true;
    autoAnnounce: boolean = true;
    loopTimeout?: any;
    stopped: boolean = false;

    constructor(config?:AppConfig){
        this.config = config;
    }

    public async start(pool: SimplePool, {autoLoop = true, autoAnnounce = true, wait = false}) {
        if(!this.config) {
            this.config = await this.loadConfig("./config.json5") as AppConfig;
        }
        this.pool = pool;
        this.transport = new IoTTransport(
            this.pool,
            this.config.relays,
        );
        this.devices = await this.loadDevices(this.config, this.transport, !!this.config.debugMode);
        
        this.autoLoop = autoLoop;
        if(autoLoop) await this.loop();
        
        this.autoAnnounce = autoAnnounce;
        if(autoAnnounce) await this.reannounce();

        if(wait) {
            return new Promise<void>((resolve) => {
                this.onClosed.push(resolve);
            });
        }
    }

    public async stop() {
        this.stopped=true
        if (this.announceTimeout) clearTimeout(this.announceTimeout);
        if (this.loopTimeout) clearTimeout(this.loopTimeout);
        const devices = this.getDevices();
        for (const device of devices.values()) {
            await device.close();
        }
        await this.transport?.close();
        this.onClosed.forEach((cb) => cb());
    }


    public async reannounce() {
        if(this.stopped) return;
        try{ 
            const devices = this.getDevices()
            const waitQueue = []
            for (const device of devices.values()) {
                waitQueue.push(device.announce());
            }
            const res = await Promise.allSettled(waitQueue);
            for (const r of res) {
                if (r.status === "rejected") {
                    console.log("Error announcing device: ", r.reason);
                }
            }
        } catch (e) {
            console.log("Error announcing device: ", e);
        }
        if(this.autoAnnounce)  {
            if(this.announceTimeout) clearTimeout(this.announceTimeout);
            this.announceTimeout = setTimeout(()=>this.reannounce(), 10000);
        } 
    }

    public async loop() {
        try { 
            if(this.stopped) return;
            const devices = this.getDevices();
            const now = Date.now();
            const tpf = (now - this.lastLoop) / 1000;
            this.lastLoop = now;
            const waitQueue = []
            for (const device of devices.values()) {
                waitQueue.push(device.loop(tpf));
            }
            const res = await Promise.allSettled(waitQueue);
            for (const r of res) {
                if (r.status === "rejected") {
                    console.log("Error in loop: ", r.reason);
                }
            }
        } catch (e) {
            console.log("Error in loop: ", e);
        }
        if(this.autoLoop) {
            if(this.loopTimeout ) clearTimeout(this.loopTimeout);
            this.loopTimeout = setTimeout(()=>this.loop(), 100);
        }
    }



    public getDevices() : Array<IoTDevice> {
        if (!this.devices) throw new Error("Devices not loaded, call start() first");
        return this.devices;
    }

 
    private async loadConfig(path: string): Promise<any> {
        const text = await Deno.readTextFile(path);
        return JSON5.parse(text);
    }

    private async saveConfig(path: string, config: any): Promise<void> {
        const text = JSON5.stringify(config);
        const dir = dirname(path);
        
        // Create the parent directory if it does not exist
        await Deno.mkdir(dir, { recursive: true });
        
        await Deno.writeTextFile(path, text);
    }

    private async loadDevice(
        deviceModulePath: string,
        config: DeviceConfig,
        tx: IoTTransport,
        devicePrivKey: string | Uint8Array,
        debugMode: boolean = false,
    ): Promise<IoTDevice> {
        const deviceModule = await import(deviceModulePath);
        const DeviceClass = deviceModule.default;
        const deviceInstance = new DeviceClass(
            tx,
            devicePrivKey,
            config,
            debugMode
        );
        
        return deviceInstance;
    }

    private async loadDevices(
        config: AppConfig,
        tx: IoTTransport,
        debugMode: boolean = false
    ) : Promise<Array<IoTDevice>> {
        const deviceList = config.devices;
        const devices: Array<IoTDevice> = [];

        let groups = config.groups;
        if(!groups && config.dataStore) {
            try {
                const groupConfigPath = `./${config.dataStore}/groups.json5`;
                groups = await this.loadConfig(groupConfigPath);
            } catch (e) {
                console.log("Groups not found, creating new one");
            }
        }
        if(!groups) {
            groups = [bytesToHex(generateSecretKey())];         
            if(config.dataStore) {
                const groupConfigPath = `./${config.dataStore}/groups.json5`;
                await this.saveConfig(groupConfigPath, groups);
            }
        }

        for (const deviceInfo of deviceList) {
            let devicePrivKey = deviceInfo.privkey;
            const devicePrivKeyPath = config.dataStore?  config.dataStore + `/${deviceInfo.name}/privkey.hex`:undefined;

            if(!devicePrivKey&&devicePrivKeyPath) {                
                try {
                    devicePrivKey = await this.loadConfig(devicePrivKeyPath);
                } catch (e) {
                    console.log(
                        "Privkey not found, generating new one for device ",
                        deviceInfo.name,
                    );

                }
            }

            if(!devicePrivKey) {
                const devicePrivKeyBytes = generateSecretKey();
                devicePrivKey = bytesToHex(devicePrivKeyBytes);
                if(devicePrivKeyPath)await this.saveConfig(devicePrivKeyPath, devicePrivKey);
            }

            console.info(`Loading device ${deviceInfo.name} with private key ${devicePrivKey}`);

            const deviceConfigPath = `./devices/${deviceInfo.name}/config.json5`;
            const deviceConfig = await this.loadConfig(deviceConfigPath);

            const deviceInstance = await this.loadDevice(
                deviceInfo.path,
                deviceConfig,
                tx,
                devicePrivKey,
                debugMode,
            );

            for(const group of groups) {
                console.log("Joining device", deviceInfo.name, "to group", group);
                await deviceInstance.startListeningForJobs(group);
            }
            

            devices.push(deviceInstance);
        }

        return devices;
    }
}
