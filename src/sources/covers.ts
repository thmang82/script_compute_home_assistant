import { ParameterType } from "@script_types/spec/spec_parameter";
import { CallbackChangeNotify, SourceBase } from "./_sources";
import { sendToDisplay } from "../script";
import { SourceDeviceCovers } from "@script_types/sources/devices/source_device_covers";
import { HaApi } from "../types/type_base";
import { EntityCover } from "../types/type_covers";
import { Setup } from "../setup";
import { sRegistry } from "../registry";
import { getStateExt, recomputeLocations } from "./_locations";
import { CoverStateExt } from "../types/type_extended";
import { HomeColor } from "@script_types/script/context_home/home_icon";

const log_pre = "covers";

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

function getColorActive(color_str: string): HomeColor | undefined {
    switch (color_str) {
        case "ORANGE": return "ORANGE";
        case "GREEN":  return "GREEN";
        case "BLUE":   return "BLUE";
        case "PURPLE": return "PURPLE";
    }
    return undefined;
}

export class SourceCovers implements SourceBase<EntityCover.State> {

    public readonly entity_type = "cover";

    public covers: CoverStateExt[] = [];

    private change_cb_: CallbackChangeNotify | undefined;
    public setChangeHandler = (cb: CallbackChangeNotify): void => {
        this.change_cb_ = cb;
    }

    /** Called from the registry when it was updated */
    public registryUpdated = () => {
        let new_arr = recomputeLocations(log_pre, this.covers);
        if (new_arr) {
            this.covers = new_arr;
        }
        // The locations in the covers might have changed, transmit the change to display ...
        this.transmitStateToDisplay();
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
        const added_arr: CoverStateExt[] = [];
        states.forEach(state => {
            const id = state.entity_id;
            const i = this.covers.findIndex(e => e.entity_id == id);
            if (i >= 0) {
                this.covers[i] = getStateExt(state, this.covers[i]); // we need to copy over the location_ids => is done in getStateExt
            } else {
                added_arr.push(state);
                this.covers.push(state);
            }
        })
        if (added_arr.length > 0) {
            recomputeLocations(log_pre, this.covers, added_arr);
        }
        this.transmitStateToDisplay();
    }

    public stateChange = (change: HaApi.EventStateChange<EntityCover.State>) => {
        console.log("SourceCovers: stateChange: ", change);
        const id = change.data.entity_id;
        const i = this.covers.findIndex(e => e.entity_id == id);
        const new_state = change.data.new_state;
        if (i >= 0) {
            this.covers[i] = getStateExt(new_state, this.covers[i]); // we need to copy over the location_ids => is done in getStateExt
        } else {
            recomputeLocations(log_pre, this.covers, [ new_state ]);
            this.covers.push(change.data.new_state);
        }
        this.transmitStateToDisplay();
        
    }

    private convertToCover = (e: CoverStateExt): SourceDeviceCovers.Cover => {
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
        let color_active: HomeColor | undefined;
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
                    let color_active_ = setup.color_active?.value;
                    if (color_active_) {
                        color_active = getColorActive(color_active_);
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
            color_active,
            features: e.attributes.supported_features ? getFeatures(e.attributes.supported_features) : [],
            location_ids: e.location_ids ? e.location_ids : [ sRegistry.getLocationAll().id ]
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


    /** Returns the list of commands to be send to home assistant */
    public getChangeAllInLocation = (location_id: string, cmd: "open" | "close", target: 'shutters' | 'doors' | 'windows'): EntityCover.CallService[] => {
        const calls: EntityCover.CallService[] = [];
        for (const cover of this.covers) {

            const features = getFeatures(cover.attributes.supported_features);
            const can_open_close = features.indexOf('open') >= 0 || features.indexOf('close') >= 0;
            const can_tilt_open_close = features.indexOf('open_tilt') >= 0 || features.indexOf('close_tilt') >= 0;

            if (can_open_close || can_tilt_open_close) {
                const cover_type = cover.attributes.device_class;
                let is_door = cover_type == "door" || cover_type == "gate" || cover_type == "garage";
                const is_shutter = cover_type == 'awning' || cover_type == 'blind' || cover_type == 'curtain' || cover_type == 'shade' || cover_type == 'shutter';
                let is_window = cover_type == 'window';
                if (is_window) {
                    // Check the window type overrides if there are doors existent!
                    let s = Setup.window_setup;
                    if (s) {
                        const setup = s.find(r => cover.entity_id == r.window_sensor_id?.value);
                        if (setup) {
                            let type_update = <SourceDeviceCovers.WindowType | undefined> setup.window_type?.value;
                            if (type_update && (type_update == "door" || type_update == "sliding_door")) {
                                is_door   = true;
                                is_window = false;
                            }
                        }
                    }
                }
                // Now sheck if we have the correct type:
                const is_type_ok = target == 'doors' ? is_door : (target == 'windows' ? is_window : (target == 'shutters' ? is_shutter : false));

                // Check location:
                if (is_type_ok && cover.location_ids && cover.location_ids.indexOf(location_id) >= 0) {
                    if (can_open_close) {
                        calls.push({
                            type: "call_service",
                            domain: "cover",
                            service: cmd == 'open' ? "open_cover" : "close_cover",
                            target: { entity_id: cover.entity_id }
                        })
                    }
                    if (can_tilt_open_close && cmd == 'close') { // We cannot open and open_tilt at the same time => let's decide only to close tilt
                        calls.push({
                            type: "call_service",
                            domain: "cover",
                            service: "close_cover_tilt",
                            target: { entity_id: cover.entity_id }
                        })
                    }
                }
            }
        }
        return calls;
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