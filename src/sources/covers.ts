import { ParameterType } from "@script_types/spec/spec_parameter";
import { CallbackChangeNotify, SourceBase } from "./_sources";
import { sendToDisplay } from "../script";
import { SourceDeviceCovers } from "@script_types/sources/devices/source_device_covers";
import { HaApi } from "../types/type_base";
import { EntityCover } from "../types/type_covers";
import { Setup } from "../setup";

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

    public covers: EntityCover.State[] = [];

    private change_cb_: CallbackChangeNotify | undefined;
    public setChangeHandler = (cb: CallbackChangeNotify): void => {
        this.change_cb_ = cb;
    }

    public registryUpdated = () => {
        // Todo: check that all covers still exist!
    }

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

    private convertToCover = (e: EntityCover.State): SourceDeviceCovers.Cover => {
        let rename = Setup.renamings.find(r => e.entity_id == r.device_id?.value)?.name?.value;

        const device_class = e.attributes.device_class;
        let type: SourceDeviceCovers.CoverType | undefined = undefined;
        switch (device_class) {
            case "door": type = "door"; break;
            case "garage": type = "garage_door"; break;
            case "window": type = "window"; break;
            case "gate": type = "gate"; break;
            case "blind": type = "blind"; break;
            case "curtain": type = "curtain"; break;
            case "shade": type = "shade"; break;
            case "shutter": type = "shutter"; break;
        }
        let window_type: SourceDeviceCovers.WindowType | undefined = undefined;
        if (type == "window") {
            // Todo: Check the source config for the window type that the user specified!
            let s = Setup.window_setup;
            if (s) {
                const setup = s.find(r => e.entity_id == r.window_sensor_id?.value);
                if (setup) {
                    let type_update = <SourceDeviceCovers.WindowType | undefined> setup.window_type?.value;
                    if (type_update) {
                        window_type = type_update;
                    }
                    let rename_window = setup.name?.value;
                    if (rename_window) {
                        rename = rename_window;
                    }
                }
            }
        }

        const cover: SourceDeviceCovers.Cover =  {
            ident: e.entity_id,
            type,
            name: rename ? rename : e.attributes.friendly_name,
            open_position: e.attributes.current_position,
            tilt_position: e.attributes.current_tilt_position,
            state: e.state,
            window_type,
            features: e.attributes.supported_features ? getFeatures(e.attributes.supported_features) : []
        };
        return cover;
    }

    public handleDataRequestCover = async (_params: object): Promise<SourceDeviceCovers.Data> => {
        return { 
            covers: this.covers.map(this.convertToCover)
        }
    }

    private transmitStateToDisplay = async () => {
        const data = await this.handleDataRequestCover({});
        if (sendToDisplay) {
            sendToDisplay("device_covers", data);
        } else {
            console.error("SourceCovers: sendToDisplay missing!");
        }
        if (this.change_cb_) {
            this.change_cb_();
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

    public getActiveCovers = (): SourceDeviceCovers.Cover[] => {
        return this.covers.filter(e => e.state != "closed" && e.state !== "stopped").map(this.convertToCover);
    }

    /*
    private turnOn = () => {
        const msg = { type: "turn_on", brightness: 50 };

    }
    */
}