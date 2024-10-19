import { finalizeEvent, Event, SimplePool, verifyEvent, getPublicKey, EventTemplate, Filter, VerifiedEvent } from 'npm:nostr-tools';
import {  hexToBytes } from 'npm:@noble/hashes/utils' 
import { SubCloser } from 'npm:nostr-tools/abstract-pool';


export type IoTConnection = {
    close: () => Promise<void>;
    publish: (event: EventTemplate) => Promise<string>[];
};

export type IoTEventListener = {
    /**
     * Process a verified incoming event and return a list of event to publish as response (or undefined if no response is needed)
     * @param event the verified incoming event
     * @param stored true if the event was stored in the relay (false if it is a live event)
     * @returns a list of event to publish as response (or undefined if no response is needed)
     */
    onEvent: (event: VerifiedEvent, stored?: boolean) => Promise<Array<EventTemplate>|void>;
    /**
     * Called when the connection is closed
     * @param reasons  the reasons for the closure
     */
    onClose: (reasons: string[]) => void;
};


export default class IoTTransport {
    private relays: Array<string>;
    private pool: SimplePool;
    private openConnections: {[key: string]: IoTConnection} = {};
    private connCounter: number = 0;

    constructor(pool: SimplePool, relays: Array<string>) {
        this.pool = pool;
        this.relays = relays;
    }

    private getNewConnId(): string{
        return `c${this.connCounter++}`;
    }

    public connect(
        privKey:string|Uint8Array, 
        filters?: Array<Filter>, 
        onEvent?: (event: VerifiedEvent, stored?: boolean) => Promise<Array<EventTemplate>|void>, 
        onClose?: (reasons: string[]) => void,
        extraRelays: string[] = []
    ) : IoTConnection{
        const relays = [...this.relays, ...extraRelays];
        let eos = false;
        
        const closer:SubCloser = filters?.length  ? this.pool.subscribeMany(relays,filters, {
            onclose: onClose,
            onevent:onEvent ? async (event: Event) => {
                if(!verifyEvent(event)) return;
                const replies = await onEvent(event, !eos);               
                if(replies?.length){
                    for (const reply of replies){
                        this.publish(relays, reply, privKey);
                    }
                }
            }:undefined,
            oneose: () => {
                eos = true;
            },
        }) : {close: async () => {}};      
        const connId = this.getNewConnId();
        const conn =  {
            close:async () => {
                delete this.openConnections[connId];                
                await closer.close();
            },
            publish: (event:EventTemplate) : Promise<string>[] => {
                return this.publish(relays, event, privKey);
            }
        }
        this.openConnections[connId] = conn;
        return conn;
    }

    public async close(){
        for(const connId in this.openConnections){
            await this.openConnections[connId].close();
        }
    }

    private publish(relays:string[], event: EventTemplate, privKey: string|Uint8Array): Promise<string>[]{
        let privBytes;
        if (typeof privKey === 'string'){
            privBytes = hexToBytes(privKey);
        } else {
            privBytes = privKey;
        }
        console.log("Publishing event", event);
        const finalEvent = finalizeEvent(event, privBytes);
        return this.pool.publish(relays, finalEvent);
    }
    
}