import { ParameterType } from "@script_types/spec/spec_parameter";
import { EntityBinarySensor } from "../types/type_binary_sensor";
import { CallbackChangeNotify, SourceBase } from "./_sources";
import { HaApi } from "../types/type_base";
import { EntityCover } from "../types/type_covers";
import { Sources } from "./_construct";
// import { renamings, sendToDisplay } from "../script";

const relevantClasses: EntityBinarySensor.SensorClass[] = [ "door", "garage_door", "window" ];

export class SourceBinarySensors implements SourceBase<EntityBinarySensor.State> {

    public readonly entity_type = "binary_sensor";

    public sensors: EntityBinarySensor.State[] = [];

    private change_cb_: CallbackChangeNotify | undefined;
    public setChangeHandler = (cb: CallbackChangeNotify): void => {
        this.change_cb_ = cb;
    }

    public registryUpdated = () => {

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

    private getCover = (state: EntityBinarySensor.State): EntityCover.State | undefined => {
        const dev_class = state.attributes.device_class;
        const relevant = relevantClasses.indexOf(dev_class) >= 0;
        if (!relevant) {
            return undefined;
        }

        let type: EntityCover.CoverType | undefined;
        switch (dev_class) {
            case "door": { type = "door"; break; }
            case "garage_door": { type = "garage"; break; }
            case "window": { type = "window"; break; }
        }
        if (type) {
            const covers_o: EntityCover.State = {
                state: state.state == "off" ? "closed" : "open",
                attributes: {
                    device_class: type,
                    friendly_name: state.attributes.friendly_name,
                    supported_features: 0
                },
                context: state.context,
                entity_id: state.entity_id,
                last_changed: state.last_changed,
                last_updated: state.last_updated
            }
            return covers_o;
        }
        return undefined;
    }

    public setStates = (states: EntityBinarySensor.State[]) => {
        console.log("SourceBinarySensors: setStates: ", states);
        let virtual_covers: EntityCover.State[] = [];

        states.forEach(state => {
            const id = state.entity_id;
            const i = this.sensors.findIndex(e => e.entity_id == id);
            if (i >= 0) {
                this.sensors[i] = state;
            } else {
                this.sensors.push(state);
            }
            const s = this.getCover(state);
            if (s) {
                virtual_covers.push(s);
            }
        })
        if (virtual_covers.length > 0) {
            Sources.sCovers.setStates(virtual_covers);
        }
        this.transmitStateToDisplay();
    }

    public stateChange = (change: HaApi.EventStateChange<EntityBinarySensor.State>) => {
        console.log("SourceBinarySensors: stateChange: ", change);
        const id = change.data.entity_id;
        const i = this.sensors.findIndex(e => e.entity_id == id);
        if (i >= 0) {
            this.sensors[i] = change.data.new_state;
        } else {
            this.sensors.push(change.data.new_state);
        }
        const s = this.getCover(change.data.new_state);
        if (s) {
            Sources.sCovers.setStates([s]);
        }
        this.transmitStateToDisplay();
    }

    private transmitStateToDisplay = async () => {
        /*
            const data = await this.handleDataRequest({});
            if (sendToDisplay) {
                sendToDisplay("device_covers", data);
            } else {
                console.error("SourceCovers: sendToDisplay missing!");
            }
        */
        if (this.change_cb_) {
            this.change_cb_();
        }
    }
}