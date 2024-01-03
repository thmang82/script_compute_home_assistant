import { sRegistry } from "./registry";
import { SocketInfo, verbose } from "./script";
import { AsssistantCommand } from "./socket_command";
import { Sources } from "./sources/_construct";
import { HaSource } from "./sources/_sources";
import { HaApi } from "./types/type_base";

export interface MsgRefs {
    cmd_: AsssistantCommand;
    getToken: () => string | undefined;
    sendData: (msg: any) => void;
    sendMessage: (msg: object) => number | undefined;
}

export class AssistantMessages {
    private refs_: MsgRefs;

    private sources: {[type: string]: HaSource} = {};

    constructor(refs_: MsgRefs){
        this.refs_ = refs_;
        
        const addSource = (source: HaSource) => {
            this.sources[source.entity_type] = source;
        }

        for (const s of Sources.sources) {
            addSource(s);
        };

        console.debug("SourceHandler: " + Object.keys(this.sources).join(", "));
    }

    private handleAuthReq = () => {
        const auth_msg = {
            type: "auth",
            access_token: this.refs_.getToken()
        }
        console.debug("send auth response ...");
        this.refs_.sendData(auth_msg);
    }

    private subscribeEvents = async () => {

        // subscribe all state changes:
        this.refs_.sendMessage({ type : "subscribe_events" }); // Subscribe to all events!
        this.refs_.sendMessage({ type : "subscribe_events", "event_type": "device_registry_updated" }); // Subscribe to registry updates
        this.refs_.sendMessage({ type : "subscribe_events", "event_type": "entity_registry_updated" }); // Subscribe to registry updates
        this.refs_.sendMessage({ type : "subscribe_events", "event_type": "area_registry_updated" }); // Subscribe to registry updates

        // gets a dump of all states:
        const state_res = await this.refs_.cmd_.sendCommand({ type : "get_states" }); 
        console.log("States res: ", state_res);

        sRegistry.socketConnected();

        // { "type":"subscribe_events", "event_type":"device_registry_updated","id":21 }
        // { "type":"config/device_registry/list","id":22 }


        // Process the state result:
        const result = state_res.res;
        if (result) {
            const states = <HaApi.EntityState[]> result;
            const state_map: {[type: string]: HaApi.EntityState[]} = {};
            states.forEach(state => {
                const entity_id = state.entity_id;
                const i = entity_id.indexOf(".");
                if (i > 0) {
                    const entity_type  = entity_id.substring(0, i);
                    let o = state_map[entity_type];
                    if (!o) {
                        o = [];
                        state_map[entity_type] = o;
                    }
                    o.push(state);
                }
            });
            Object.keys(state_map).forEach(entity_type => {
                const source = this.sources[entity_type];
                if (source) {
                    source.setStates(<any> <unknown> state_map[entity_type]);
                }
            });
        }
    }

    public handleEvent = (msg: {id: number, type: "event", event: HaApi.Event}) => {
        if (msg.event.event_type == "state_changed") {
            const entity_id = msg.event.data.entity_id;
            const i = entity_id.indexOf(".");
            if (i > 0) {
                const entity_type  = entity_id.substring(0, i);
                const entity_ident = entity_id.substring(i + 1);
                const source = this.sources[entity_type];
                if (source) {
                    console.debug(`handleEvent:toService: '${entity_type}' / '${entity_ident}': `, msg.event);
                    source.stateChange(<any> <unknown> msg.event);
                } else {
                    if (verbose) {
                        console.debug(`handleEvent:noSource: '${entity_type}' / '${entity_ident}': `, msg.event);
                    }
                }
            } else {
                if (verbose) {
                    console.debug(`handleEvent:noEntityParse: `, msg.event);
                }
            }
        } else if (msg.event.event_type == "area_registry_updated") {
            sRegistry.receivedUpdate("area");
        } else if (msg.event.event_type == "device_registry_updated") {
            sRegistry.receivedUpdate("devices");
        } else if (msg.event.event_type == "entitiy_registry_updated") {
            sRegistry.receivedUpdate("entities");
        } else {
            if (verbose) {
                console.debug(`handleEvent:otherEventType: `, msg.event);
            }
        }
    }

    public onDataReceived = (data: string, s_info: SocketInfo) => {
        try {
            if (typeof data == 'string' && data[0] == "{" || data[0] == "[" ) {
                const data_o = JSON.parse(data);

                let messages = [];
                if (Array.isArray(data_o)) {
                    messages = data_o;
                } else if (data_o.type) {
                    messages.push(data_o);
                }
                messages.forEach(msg => {
                    const type: string | undefined = msg.type;
                    if (type) {
                        if (type === 'auth_required') {
                            this.handleAuthReq();
                        } else if (type === 'auth_invalid') {
                            console.error("Auth invalid: " + msg.message);
                        } else if (type === 'auth_ok') {
                            console.info(`Authentication ok for '${s_info.uid}'`);
                            this.subscribeEvents();
                        } else if (type === 'result') {
                            this.refs_.cmd_.handleCommandResult(msg);
                        } else if (type === 'event') {
                            this.handleEvent(msg);
                        } else {
                            if (type.startsWith("config") && type.endsWith("update")) {
                                // config update!   
                            }
                            console.log("data rcv: ", msg);
                        }
                    } else {
                        console.warn("data rcv, msg has no type: ", msg);
                    }
                });
            } else {
                console.warn("data rcv, unsupported type: ", typeof data);
            }
        } catch (e) {
            console.error("Error parsing data: ", e, data);
        }
    }

}