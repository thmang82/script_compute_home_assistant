import { ParameterType } from "@script_types/spec/spec_parameter";
import { EntityBinarySensor } from "../types/type_binary_sensor";
import { CallbackChangeNotify, SourceBase } from "./_sources";
import { HaApi } from "../types/type_base";
import { Sources } from "./_construct";
import { sRegistry } from "../registry";
import { EntityCover } from "../types/type_covers";
import { getStateExt, recomputeLocations } from "./_locations";
import { BinarySensorStateExt, CoverStateExt } from "../types/type_extended";

const relevantClasses: EntityBinarySensor.SensorClass[] = [ "door", "garage_door", "window" ];
const log_pre = "bin_sensors";

export class SourceBinarySensors implements SourceBase<EntityBinarySensor.State> {

    public readonly entity_type = "binary_sensor";

    public sensors: BinarySensorStateExt[] = [];

    private change_cb_: CallbackChangeNotify | undefined;
    public setChangeHandler = (cb: CallbackChangeNotify): void => {
        this.change_cb_ = cb;
    }

    /** Called from the registry when it was updated */
    public registryUpdated = () => {
        const new_arr = recomputeLocations(log_pre, this.sensors);
        if (new_arr) {
            this.sensors = new_arr;
        }
        // The locations in the sensors might have changed, transmit the change to display ...
        this.transmitStateToDisplay();
    }

    public getWindowsForConfig = (): { dropdown_entries: ParameterType.DropdownEntry[] } => {
        console.debug("SourceBinarySensors: getWindowsForConfig ...");
        return {
            dropdown_entries: this.sensors.filter(e => {
                return e.attributes.device_class == "window"
            }).map(e => {
                return {
                    value: e.entity_id,
                    name: e.attributes.friendly_name
                }
            })
        }
    }

    private getVirtualCover = (state: BinarySensorStateExt): CoverStateExt | undefined => {
        const dev_class = state.attributes.device_class;
        const relevant = relevantClasses.indexOf(dev_class) >= 0;
        if (!relevant) {
            return undefined;
        }
        const location_all = sRegistry.getLocationAll();

        let type: EntityCover.CoverType | undefined;
        switch (dev_class) {
            case "door": { type = "door"; break; }
            case "garage_door": { type = "garage"; break; }
            case "window": { type = "window"; break; }
        }
        if (type) {
            const sensors_o: CoverStateExt = {
                state: state.state == "off" ? "closed" : "open",
                attributes: {
                    device_class: type,
                    friendly_name: state.attributes.friendly_name,
                    supported_features: 0
                },
                context: state.context,
                entity_id: state.entity_id,
                last_changed: state.last_changed,
                last_updated: state.last_updated,
                location_ids: state.location_ids ? state.location_ids : [ location_all.id ]
            }
            return sensors_o;
        }
        return undefined;
    }

    public setStates = (states: EntityBinarySensor.State[]) => {
        console.log("SourceBinarySensors: setStates: ", states);
        const virtual_covers: CoverStateExt[] = [];

        const added_arr: BinarySensorStateExt[] = [];
        states.forEach(state => {
            const id = state.entity_id;
            const i = this.sensors.findIndex(e => e.entity_id == id);
            if (i >= 0) {
                this.sensors[i] = getStateExt(state, this.sensors[i]); // we need to copy over the location_ids => is done in getStateExt
            } else {
                added_arr.push(state);
                this.sensors.push(state);
            }
            const s = this.getVirtualCover(state);
            if (s) {
                virtual_covers.push(s);
            }
        })
        recomputeLocations(log_pre, this.sensors, added_arr);
        if (virtual_covers.length > 0) {
            Sources.sCovers.setStates(virtual_covers);
        }
        this.transmitStateToDisplay();
    }

    public stateChange = (change: HaApi.EventStateChange<EntityBinarySensor.State>) => {
        console.log("SourceBinarySensors: stateChange: ", change);
        const id = change.data.entity_id;
        const i = this.sensors.findIndex(e => e.entity_id == id);

        const new_state = change.data.new_state;
        if (i >= 0) {
            this.sensors[i] = getStateExt(new_state, this.sensors[i]); // we need to copy over the location_ids => is done in getStateExt
        } else {
            recomputeLocations(log_pre, this.sensors,  [new_state]);
            this.sensors.push(new_state);
        }
        const s = this.getVirtualCover(new_state);
        if (s) {
            Sources.sCovers.setStates([s]);
        }
        this.transmitStateToDisplay();
    }

    private transmitStateToDisplay = async () => {
        /*
            const data = await this.handleDataRequest({});
            if (sendToDisplay) {
                sendToDisplay("device_sensors", data);
            } else {
                console.error("SourceCovers: sendToDisplay missing!");
            }
        */
        if (this.change_cb_) {
            this.change_cb_();
        }
    }
}