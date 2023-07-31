import { ParameterType } from "@script_types/spec/spec_parameter";
import { SourceBase } from "./_sources";
import { SourceDeviceLights } from '@script_types/sources/devices/source_device_lights';
import { renamings, sendToDisplay, verbose } from "../script";
import { EntityLight } from "../types/type_lights";
import { HaApi } from "../types/type_base";

export class SourceLights implements SourceBase<EntityLight.State> {

    public readonly entity_type = "light";

    private lights: EntityLight.State[] = [];

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

    public setStates = (states: EntityLight.State[]) => {
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

    public stateChange = (change: HaApi.EventStateChange<EntityLight.State>) => {
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
        const lights = this.lights.map(e => {
            const rename = renamings.find(r => e.entity_id == r.device_id?.value)?.name?.value;
            const data: SourceDeviceLights.LightStatus = {
                ident: e.entity_id,
                name: rename ? rename : e.attributes.friendly_name,
                brightness: e.attributes.brightness,
                state: e.state,
                supported_color_modes: []
            };
            e.attributes.supported_color_modes.forEach(e => {
                if (e != "white" && e !== "unknown") {
                    data.supported_color_modes.push(e);
                }
            });
            const mode = e.attributes.color_mode;
            if (mode !== "white" && mode !== "unknown") {
                data.color_mode = mode;
                if (e.attributes.min_color_temp_kelvin && e.attributes.max_color_temp_kelvin) {
                    data.range_color_temp_kelvin = {
                        min: e.attributes.min_color_temp_kelvin,
                        max: e.attributes.max_color_temp_kelvin
                    }
                }
                if (e.attributes.color_temp_kelvin !== undefined) {
                    data.color_temp_kelvin = e.attributes.color_temp_kelvin;
                }
                if (e.attributes.xy_color) {
                    data.color_xy = { x: e.attributes.xy_color[0], y: e.attributes.xy_color[1] }
                }
                if (e.attributes.hs_color) {
                    data.color_hs = { h: e.attributes.hs_color[0], s: e.attributes.hs_color[1] }
                }
                if (e.attributes.rgb_color) {
                    data.color_rgb = { r: e.attributes.rgb_color[0], g: e.attributes.rgb_color[1], b: e.attributes.rgb_color[2] }
                }
                if (e.attributes.rgbw_color) {
                    data.color_rgbw = { r: e.attributes.rgbw_color[0], g: e.attributes.rgbw_color[1], b: e.attributes.rgbw_color[2], w: e.attributes.rgbw_color[3] }
                }
                if (e.attributes.rgbww_color) {
                    data.color_rgbww = { r: e.attributes.rgbww_color[0], g: e.attributes.rgbww_color[1], b: e.attributes.rgbww_color[2], w: e.attributes.rgbww_color[3], ww: e.attributes.rgbww_color[3] }
                }
            }
            return data;
        })
        if (verbose) {
            console.debug("send lights: ", lights, renamings);
        }
        return {
            lights
        }
    }

    private transmitStateToDisplay = async () => {
        const data = await this.handleDataRequestDisplay({});
        if (sendToDisplay) {
            sendToDisplay("device_lights", data);
        }
    }

    public handleCommandDisplay = async (cmd: SourceDeviceLights.Command.Request): Promise<EntityLight.CallService | undefined> => {
        const change = cmd.change;
        const ident = change.ident;
        let light = this.lights.find(e => e.entity_id == ident);
        if (light) {
            if (verbose) {
                console.debug("Change light: ", light, change);
            }
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
                    let call: EntityLight.CallService = {
                        type: "call_service",
                        domain: "light",
                        service: "turn_on",
                        target: { entity_id: ident },
                        service_data: {}
                    }
                    if (change.brightness) {
                        call.service_data.brightness = change.brightness;
                    }
                    if (change.color_temp_kelvin) {
                        call.service_data.color_temp_kelvin = change.color_temp_kelvin;
                    }
                    if (change.color_xy) {
                        call.service_data.xy_color = [ change.color_xy.x, change.color_xy.y ];
                    }
                    if (change.color_hs) {
                        call.service_data.hs_color = [ change.color_hs.h, change.color_hs.s ];
                    }
                    if (change.color_rgb) {
                        call.service_data.rgb_color = [ change.color_rgb.r, change.color_rgb.g, change.color_rgb.b ];
                    }
                    if (change.color_rgbw) {
                        call.service_data.rgbw_color = [ change.color_rgbw.r, change.color_rgbw.g, change.color_rgbw.b, change.color_rgbw.w ];
                    }
                    if (change.color_rgbww) {
                        call.service_data.rgbww_color = [ change.color_rgbww.r, change.color_rgbww.g, change.color_rgbww.b, change.color_rgbww.w, change.color_rgbww.ww ];
                    }
                    return call;
                } else {
                    return {
                        type: "call_service",
                        domain: "light",
                        service: "turn_off",
                        target: { entity_id: ident }
                    }
                }
            }
        } else {
            console.error("Could not find light: ", ident);
        }
        return undefined;
    }

    /*
    private turnOn = () => {
        const msg = { type: "turn_on", brightness: 50 };

    }
    */
}