import { IoTDeviceMeta } from "./src/IoTDevice.ts";
export interface DeviceInfo {
    name: string;
    path: string;
    privkey?: string;
}

export interface AppConfig {
    dataStore?: string;
    relays: string[];
    devices: DeviceInfo[];
    groups?: string[]; // list of private keys of the groups to join
    debugMode?:boolean
}

export type DeviceConfig = IoTDeviceMeta & {
    schema: string;
};