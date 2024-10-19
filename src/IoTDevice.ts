// This simulates an IoT device
import { useWebSocketImplementation } from 'npm:nostr-tools/pool'
import WebSocket from 'npm:ws'
useWebSocketImplementation(WebSocket)

import { VerifiedEvent, getPublicKey, nip04, EventTemplate  } from 'npm:nostr-tools';
import {  hexToBytes } from 'npm:@noble/hashes/utils' ;
import IoTTransport , {IoTConnection} from './IoTTransport.ts';

type IoTListener = { 
    listenerPubKey: string,
    listenerPrivBytes: Uint8Array,
    conn: IoTConnection,
    kinds: number[]
};



export type IoTAction = {
    method: string,
    params: Array<any>
};

export type IoTResponse = {
    method: string,
    result: any
};

export  type IoTState = {
    method: string,
    result: any,
    tags: string[]
};


export type IoTDeviceTags = string[]

export type IoTDeviceMeta = {
    name: string,
    about: string,
    tags: IoTDeviceTags
};


export default abstract class IoTDevice {
    
    private tx: IoTTransport;
    private subs: Array<IoTListener> = [];
    private devicePrivBytes: Uint8Array;
    public devicePubKey: string;
    public meta?: IoTDeviceMeta;
    private announcer: IoTConnection;
    private debug: boolean = false;

    constructor(
        tx: IoTTransport, 
        devicePrivKey: string|Uint8Array, 
        meta?: IoTDeviceMeta,
        debug?: boolean
    ){
        this.meta = meta;
        this.debug = !!debug;
        this.tx = tx;
        this.devicePrivBytes = typeof devicePrivKey === 'string' ? hexToBytes(devicePrivKey) : devicePrivKey;
        this.devicePubKey = getPublicKey(this.devicePrivBytes);

        this.announcer = this.tx.connect(devicePrivKey)
      
        // accept job requests targeting this device
        this.startListeningForJobs(devicePrivKey);
    
    }

    

    
    /**
     * Listen for jobs targeting the specified private key
     * and respond when needed
     * note: we encrypt responses using the listener's public key, but the event itself is signed
     * with the device privkey, those two might be different
     * @param privKey 
     * @param tags 
     */
    public startListeningForJobs(privKey: string|Uint8Array){
        const REQ_KIND = 5107;
        const RES_KIND = 6108;
        
        this.stopListeningForJobs(privKey);
        // const devicePubKey = getPublicKey(devicePrivBytes);

        const listenerPrivBytes = typeof privKey === 'string' ? hexToBytes(privKey) : privKey;
        const listenerPubKey = getPublicKey(listenerPrivBytes);

        const connection = this.tx.connect(this.devicePrivBytes, [
            { 
                kinds: [REQ_KIND],
                "#p": [listenerPubKey],
                "#h": this.meta?.tags
            }
        ], async (event: VerifiedEvent, stored?: boolean): Promise<Array<EventTemplate> | void> => {
            const isEncrypted = event.tags.some(t => t[0] === 'encrypted');
            if (isEncrypted) {
                const decryptedContent = JSON.parse(await nip04.decrypt(listenerPrivBytes, event.pubkey, event.content));
                event.tags = event.tags.filter(t => t[0] !== 'encrypted');
                event.tags = [...event.tags, ...decryptedContent];               
            }
            const actions: Array<IoTAction> = [];
            for (const tag of event.tags){
                if (tag[0] === 'i'){
                    try { 
                        const action = JSON.parse(tag[1]);
                        if (!action?.method || !action?.params) throw new Error("Invalid command");
                        actions.push({
                            method: action.method,
                            params: action.params
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            const responses = await this.onActionBatch(actions);
            if (responses) {
                const eventTags: Array<Array<string>> = [
                    ["p", event.pubkey], // we respond to the source
                    ["e", event.id] // we reference the request
                ];
                // tag
                if(this.meta?.tags.length) {
                    for (const tag of this.meta?.tags){
                        eventTags.push(["h", tag]);
                    }
                }
                const replyEvent: EventTemplate = {
                    kind: RES_KIND,
                    created_at: Math.floor(Date.now() / 1000),
                    content: JSON.stringify(responses),
                    tags: eventTags,
                };
                // if request was encrypted, we encrypt the response too
                if (isEncrypted){
                    replyEvent.content = await nip04.encrypt(listenerPrivBytes, event.pubkey, replyEvent.content);
                    replyEvent.tags.push(["encrypted"]);
                }
                return [replyEvent];
            }
        }, (reasons: string[]) => {
            console.log("Connection closed", reasons);
        });

        const listener:IoTListener = {
            listenerPubKey: listenerPubKey,
            listenerPrivBytes: listenerPrivBytes,
            conn: connection,
            kinds: [REQ_KIND]
        }
        this.subs.push(listener);
    }

    // Stop listening for jobs targeting the specified private key
    public stopListeningForJobs(privKey:string|Uint8Array){
        const privBytes = typeof privKey === 'string' ? hexToBytes(privKey) : privKey;
        const pubKey = getPublicKey(privBytes);
        const listenerI = this.subs.findIndex(s =>{
            if(s.listenerPubKey !== pubKey) return false;
            // if(tags.length !== s.tags.length) return false;
            // const a = tags.sort();
            // const b = s.tags.sort();
            // for(let i = 0; i < a.length; i++){
            //     if(a[i] !== b[i]) return false;
            // }
            return true;            
        });
        if(listenerI === -1) return;   
        this.subs.splice(listenerI, 1)?.[0].conn.close();
    }


    protected async onActionBatch(actions: Array<IoTAction>) : Promise<Array<IoTResponse>> {
        const out: Array<IoTResponse> = [];
        for (const action of actions){
            const response = await this.onAction(action);
            if (response){
                out.push(response);
            }
        }
        return out;
            
    }


    public async announce() {
        const waitQueue = [];
        const listeningOn = new Set<string>();

        // it listens on it's own pubkey
        listeningOn.add(this.devicePubKey);
        
        // and to others 
        for(const listener of this.subs){
            if(listener.listenerPubKey==this.devicePubKey) continue;
            listeningOn.add(listener.listenerPubKey);
        }

        for(const listener of this.subs){
            // announce only it's own listeners
            if(listener.listenerPubKey!=this.devicePubKey) continue;

            // add group pubkeys
            const eventContent = JSON.stringify({
                "name": this.meta?.name,
                "about": this.meta?.about,
                "listeningOn": Array.from(listeningOn)
            });

            const tags = [
                ["k", "5107"]
            ]

            if(this.meta?.tags){
                for(const tag of this.meta.tags){
                    tags.push(['h', tag]);
                }
            }

            const event: EventTemplate = {
                kind: 31990,
                created_at: Math.floor(Date.now() / 1000),
                content: eventContent,
                tags
            };
            waitQueue.push(...this.announcer.publish(event));
        }    
        return await Promise.all(waitQueue);
    }
  
    protected async refreshState(){
        const states = await this.getStates(this.meta?.tags || []);
        if(!states.length) return;

        const STATE_KIND = 36107;

        // TODO: could group states by tags
        for(const state of states){
            const tags = []
            for(const tag of state.tags){
                tags.push(['h', tag]);
            }
            tags.push(['d', state.method]);
            const stateEvent: EventTemplate = {
                kind: STATE_KIND,
                created_at: Math.floor(Date.now() / 1000),
                content: JSON.stringify([state]),
                tags
            };
            this.announcer.publish(stateEvent);         
        }
    }

    protected abstract onAction(action: IoTAction) : Promise<IoTResponse | void>;
    protected abstract getStates(tags: IoTDeviceTags): Promise<IoTState[]>;   
    protected abstract onClose(): Promise<void>;
    protected abstract onLoop(tpf: number): Promise<void>;

    public async loop(tpf: number): Promise<void>{
        await this.onLoop(tpf);        
    }

    public async close(): Promise<void> {
        await this.onClose();
        for(const listener of this.subs){
            listener.conn.close();
        }
    }

    public async debugRunActions(actions:Array<IoTAction>): Promise<Array<IoTResponse>>{
        if(!this.debug) throw new Error('Debug mode not enabled');
        return await this.onActionBatch(actions);
    }

    public async debugGetStates(): Promise<IoTState[]>{
        if(!this.debug) throw new Error('Debug mode not enabled');
        return await this.getStates(this.meta?.tags || []);
    }

    

   
}
