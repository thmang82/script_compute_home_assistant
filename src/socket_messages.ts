import { SocketInfo } from "./script";
import { AsssistantCommand } from "./socket_command";
import { HaSource } from "./sources/_sources";
import { SourceCovers } from "./sources/covers";
import { SourceLights } from "./sources/lights";
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
        addSource(new SourceLights());
        addSource(new SourceCovers());
    }

    private handleAuthReq = () => {
        const auth_msg = {
            type: "auth",
            access_token: this.refs_.getToken()
        }
        console.debug("send auth response ...");
        this.refs_.sendData(auth_msg);
    }

    public getSourceRef = (entity_type: HaApi.EntityType): HaSource | undefined => {
        return this.sources[entity_type];
    }


    private subscribeEvents = async () => {

        // subscribe all state changes:
        this.refs_.sendMessage({ type : "subscribe_events" }); 

        // gets a dump of all states:
        const state_res = await this.refs_.cmd_.sendCommand({ type : "get_states" }); 
        console.log("States res: ", state_res);

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
                console.debug(`State change: '${entity_type}' / '${entity_ident}': `, msg.event);
                if (source) {
                    source.stateChange(<any> <unknown> msg.event);
                }
            }
        }
    }

    public onDataReceived = (data: string, s_info: SocketInfo) => {
        try {
            if (typeof data == 'string' && data[0] == "{") {
                const data_o = JSON.parse(data);
                const type = data_o.type;
                if (type) {
                    if (type === 'auth_required') {
                        this.handleAuthReq();
                    } else if (type === 'auth_invalid') {
                        console.error("Auth invalid: " + data_o.message);
                    } else if (type === 'auth_ok') {
                        console.info(`Authentication ok for '${s_info.uid}'`);
                        this.subscribeEvents();
                    } else if (type === 'result') {
                        this.refs_.cmd_.handleCommandResult(data_o);
                    } else if (type === 'event') {
                        this.handleEvent(data_o);
                    } else {
                        console.log("data rcv: ", data_o);
                    }
                } else {
                    console.warn("data rcv, msg has no type: ", data_o);
                }
            } else {
                console.warn("data rcv, unsupported type: ", typeof data);
            }
        } catch (e) {
            console.error("Error parsing data: ", e, data);
        }
    }

}