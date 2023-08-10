import { ParameterType } from "@script_types/spec/spec_parameter";
import { SourceBase } from "./_sources";
import { renamings, sendToDisplay } from "../script";
import { SourceDeviceCovers } from "@script_types/sources/devices/source_device_covers";
import { HaApi } from "../types/type_base";
import { EntityCover } from "../types/type_covers";

function getFeatures(bitmask: number): SourceDeviceCovers.CoverFeature[] {
    const masks: SourceDeviceCovers.CoverFeature[] = [];
    if (bitmask & 1) masks.push("open");
    if (bitmask & 2) masks.push("close");
    if (bitmask & 4) masks.push("set_position");
    if (bitmask & 8) masks.push("stop");
    if (bitmask & 16) masks.push("open_tilt");
    if (bitmask & 32) masks.push("close_tilt");
    if (bitmask & 64) masks.push("stop_tilt");
    if (bitmask & 128) masks.push("set_tilt_position");
    return masks;
}

export class SourceCovers implements SourceBase<EntityCover.State> {

    public readonly entity_type = "cover";

    private covers: EntityCover.State[] = [];

    public getConfigParameters = (): { dropdown_entries: ParameterType.DropdownEntry[] } => {
        console.debug("SourceCovers: getConfigParameters ...");
        return {
            dropdown_entries: this.covers.map(e => {
                return {
                    value: e.entity_id,
                    name: e.attributes.friendly_name
                }
            })
        }
    }

    public setStates = (states: EntityCover.State[]) => {
        console.log("SourceCovers: setStates: ", states);
        states.forEach(state => {
            const id = state.entity_id;
            const i = this.covers.findIndex(e => e.entity_id == id);
            if (i >= 0) {
                this.covers[i] = state;
            } else {
                this.covers.push(state);
            }
        })
        this.transmitStateToDisplay();
    }

    public stateChange = (change: HaApi.EventStateChange<EntityCover.State>) => {
        console.log("SourceCovers: stateChange: ", change);
        const id = change.data.entity_id;
        const i = this.covers.findIndex(e => e.entity_id == id);
        if (i >= 0) {
            this.covers[i] = change.data.new_state;
        } else {
            this.covers.push(change.data.new_state);
        }
        this.transmitStateToDisplay();
    }

    public handleDataRequestCover = async (_params: object): Promise<SourceDeviceCovers.Data> => {
        return { 
            covers: this.covers.map(e => {
                const rename = renamings.find(r => e.entity_id == r.device_id?.value)?.name?.value;
                const cover: SourceDeviceCovers.Cover =  {
                    ident: e.entity_id,
                    name: rename ? rename : e.attributes.friendly_name,
                    open_position: e.attributes.current_position,
                    tilt_position: e.attributes.current_tilt_position,
                    state: e.state,
                    features: e.attributes.supported_features ? getFeatures(e.attributes.supported_features) : []
                };
                return cover;
            })
        }
    }

    private transmitStateToDisplay = async () => {
        const data = await this.handleDataRequestCover({});
        if (sendToDisplay) {
            sendToDisplay("device_covers", data);
        } else {
            console.error("SourceCovers: sendToDisplay missing!");
        }
    }

    public handleCommandCover = async (cmd: SourceDeviceCovers.Command.Request): Promise<EntityCover.CallService | undefined> => {
        const change = cmd.change;
        const ident = change.ident;
        let cover = this.covers.find(e => e.entity_id == ident);
        if (cover) {
            if (change.state == "open") {
                return {
                    type: "call_service",
                    domain: "cover",
                    service: "open_cover",
                    target: { entity_id: ident }
                }
            } else if (change.state == "close") {
                return {
                    type: "call_service",
                    domain: "cover",
                    service: "close_cover",
                    target: { entity_id: ident }
                }
            } else if (change.state == "stop") {
                return {
                    type: "call_service",
                    domain: "cover",
                    service: "stop_cover",
                    target: { entity_id: ident }
                }
            }
        }
        return undefined;
    }

    /*
    private turnOn = () => {
        const msg = { type: "turn_on", brightness: 50 };

    }
    */
}