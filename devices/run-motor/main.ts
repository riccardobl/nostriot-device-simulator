
import IoTDevice, {IoTDeviceTags, IoTAction, IoTResponse,IoTState ,IoTDeviceMeta} from '../../src/IoTDevice.ts';
import IoTTransport from '../../src/IoTTransport.ts';

export default class Motor extends IoTDevice {
    private stateTimeout:number = 0;
    private motorPosition:number = 0;
    private queuedMotions: Array<{direction: number, duration: number, time: number, unitsPerSecond: number}> = [];
    private time: number = 0;

    constructor(
        tx: IoTTransport, 
        devicePrivKey: string|Uint8Array,
        meta: IoTDeviceMeta,
        debug?: boolean
    ){
        super(tx, devicePrivKey, meta, debug);
    }


    protected async onAction(action: IoTAction) : Promise<IoTResponse | void>{
        if(action.method === 'move'){
            const direction = action.params[0];
            const duration = action.params[1]; // seconds
            const unitsPerSecond = 1; // 1 unit per second
            const time = this.time; // current time
            this.queuedMotions.push({direction, duration, time, unitsPerSecond}); 
            return {method: 'move', result: 'ok'};          
        } else throw new Error('Unknown method');
    }



    protected async getStates(tags: IoTDeviceTags): Promise<IoTState[]>{
        const states = [
            {
                method: 'position',
                result: this.motorPosition,
                tags: tags
            },
            {
                method: 'motion-queue',
                result: this.queuedMotions,
                tags: ["debug"]
            }
        ];
        console.log("Returning states", states);
        return states;
    }

    public async onLoop(tpf: number): Promise<void>{
        // update time tracker
        this.time += tpf;

        // update motion
        const currentMotion = this.queuedMotions[0];
        if(currentMotion){
            const expiring = currentMotion.time + currentMotion.duration;
            if(this.time > expiring){
                // motion expired, remove
                this.queuedMotions.shift(); 
                console.log("Motion expired, removing from queue");
            } else {
                // move motor
                const delta = tpf * currentMotion.unitsPerSecond;
                const nextPos = this.motorPosition + currentMotion.direction * delta;
                console.info("Moving motor for",tpf,"seconds. From ", this.motorPosition, "to", nextPos,"delta", delta);
                this.motorPosition = nextPos;
            }
        }

        this.stateTimeout -= tpf;
        if(this.stateTimeout <= 0){
            this.stateTimeout = 100;
            this.refreshState();
        }
    }

    protected override async onClose(): Promise<void> {
        console.log('Motor closed');
    }
}
