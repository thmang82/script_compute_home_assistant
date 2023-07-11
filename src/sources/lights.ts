import { ParameterType } from "@script_types/spec/spec_parameter";
import { HaApi } from "../types";
import { SourceBase } from "./_sources";
import { SourceDeviceLights } from '@script_types/sources/devices/source_device_lights';
import { sendToDisplay } from "../script";

export class SourceLights implements SourceBase {

    public readonly entity_type = "light";

    private lights: HaApi.EntityLight.State[] = [];

    public getConfigParameters = (): { dropdown_entries: ParameterType.DropdownEntry[] } => {
        return {
            dropdown_entries: this.lights.map(e => {
                return {
                    value: e.entity_id,
                    name: e.attributes.friendly_name
                }
            })
        }
    }

    public setStates = (states: HaApi.EntityLight.State[]) => {
        console.log("SourceLights, setStates: ", states);
        states.forEach(state => {
            const id = state.entity_id;
            const i = this.lights.findIndex(e => e.entity_id == id);
            if (i >= 0) {
                this.lights[i] = state;
            } else {
                this.lights.push(state);
            }
        })
        this.transmitStateToDisplay();
    }

    public stateChange = (change: HaApi.EventStateChange<HaApi.EntityLight.State>) => {
        console.log("SourceLights, stateChange: ", change);
        const id = change.data.entity_id;
        const i = this.lights.findIndex(e => e.entity_id == id);
        if (i >= 0) {
            this.lights[i] = change.data.new_state;
        } else {
            this.lights.push(change.data.new_state);
        }
        this.transmitStateToDisplay();
    }

    public handleDataRequestDisplay = async (_params: object): Promise<SourceDeviceLights.Data> => {
        return {
            lights: this.lights.map(e => {
                return {
                    ident: e.entity_id,
                    name: e.attributes.friendly_name,
                    brightness: e.attributes.brightness,
                    state: e.state
                }
            })
        }
    }

    private transmitStateToDisplay = async () => {
        const data = await this.handleDataRequestDisplay({});
        if (sendToDisplay) {
            sendToDisplay("device_lights", data);
        }
    }

    public handleCommandDisplay = async (cmd: SourceDeviceLights.Command.Request): Promise<HaApi.EntityLight.CallService | undefined> => {
        const change = cmd.change;
        const ident = change.ident;
        let light = this.lights.find(e => e.entity_id == ident);
        if (light) {
            let state_target: "off" | "on" | undefined;
            if (change.state == "toggle") {
                if (light.state) {
                    state_target = light.state == "off" ? "on" : "off";
                }
            } else if (change.state == "on" || change.state == "off") {
                state_target = change.state;
            }
            if (state_target) {
                if (state_target == "on") {
                    return {
                        type: "call_service",
                        domain: "light",
                        service: "turn_on",
                        target: { entity_id: ident }
                    }
                } else {
                    return {
                        type: "call_service",
                        domain: "light",
                        service: "turn_off",
                        target: { entity_id: ident }
                    }
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