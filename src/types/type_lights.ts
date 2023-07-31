// {"type":"call_service","domain":"light","service":"turn_on","service_data":{"entity_id":"light.lamp_400_view","brightness_pct":35},"id":54}

import { HaApi } from "./type_base";

/** https://developers.home-assistant.io/docs/core/entity/light */
export namespace EntityLight {

    export type StateOnOff = "off" | "on";
    export interface State extends HaApi.EntityStateBase {
        state: StateOnOff;
        attributes: {
            friendly_name: string;
            /** The brightness between 1..255, only avaible if 'on' */
            brightness?: number;
            rgb_color?: [number, number, number];
            rgbw_color?: [number, number, number, number];
            rgbww_color?: [number, number, number, number, number];
            xy_color?: [number, number];
            /** hue and saturation color value (float, float) */
            hs_color?: [number, number];
            effect_list: EntityLight.Effect[];
            color_mode: ColorMode;
            supported_color_modes: EntityLight.ColorMode[];
            supported_features: number;
            /** ISO Time */
            last_seen: string;
            linkquality: number;
            power_on_behavior: null;

            min_color_temp_kelvin?: number;
            max_color_temp_kelvin?: number;
            color_temp_kelvin?: number;
        }
    };
    export type Effect = "blink" | "breathe" | "okay" | "channel_change" | "finish_effect" | "stop_effect";
    export type ColorMode = "brightness" | "hs" | "color_temp" | "rgb" | "rgbw" | "rgbww" | "white" | "xy" | "unknown" | "onoff";

    export type CallService = CallServiceOn | CallServiceOff;
    
    interface CallServiceBase {
        type: "call_service",
        domain: "light",
        target: {
            entity_id: string,
        }
    }
    export interface CallServiceOn extends CallServiceBase {
        service: "turn_on",
        // Optional
        service_data: {
            color_name?: string;
            brightness?: number;
            xy_color?: [number, number];
            hs_color?: [number, number];
            rgb_color?: [number, number, number];
            rgbw_color?: [number, number, number, number];
            rgbww_color?: [number, number, number, number, number];
            color_temp_kelvin?: number;
        }
    }
    export interface CallServiceOff extends CallServiceBase {
        service: "turn_off"
    }
}