// {"type":"call_service","domain":"light","service":"turn_on","service_data":{"entity_id":"light.lamp_400_view","brightness_pct":35},"id":54}

export namespace HaApi {

    export type EntityType = "light" | "cover";

    export type EventType = "state_changed";
    export type Event = EventStateChange<any>;

    export interface EventStateChange<T extends EntityState> {
        event_type: "state_changed",
        data: {
            entity_id: string,
            old_state: T,
            new_state: T
        },
        /** e.g. LOCAL */
        origin: string;
        /** ISO time str, e.g 2023-07-06T19:11:00.309279+00:00*/
        time_fired: string;
        context: Context;
    }

    export interface Context {
        /** e.g. 01H4P9TSPN1YQTQQVRT86K4BQX */
        id: string;
        parent_id: string | any;
        /** e.g. 6c62f88080bb4da995478dd42d29f832 */
        user_id: string | any;
    }

    export type EntityState = EntityLight.State;

    export interface EntityStateBase {
        entity_id: string;
        /** ISO Time string */
        last_changed: string;
        /** ISO Time string */
        last_updated: string;
        context: Context;
    }

    /** https://developers.home-assistant.io/docs/core/entity/light */
    export namespace EntityLight {
        export type StateOnOff = "off" | "on";
        export interface State extends EntityStateBase {
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
                supported_color_modes: EntityLight.ColorMode[];
                supported_features: number;
                /** ISO Time */
                last_seen: string;
                linkquality: number;
                power_on_behavior: null;
            }
        };
        export type Effect = "blink" | "breathe" | "okay" | "channel_change" | "finish_effect" | "stop_effect";
        export type ColorMode = "brightness" | "hs" | "color_temp" | "rgb" | "rgbw" | "rgbww" | "white" | "xy" | "unknown" | "onoff";

        export type CallService = CallServiceOn | CallServiceOff;
        
        interface CallServiceBase {
            type: "call_service",
            domain: "light",
            target: {
                entity_id: string
            }
        }
        export interface CallServiceOn extends CallServiceBase {
            service: "turn_on",
            // Optional
            service_data?: {
                color_name?: string,
                brightness: number
            }
        }
        export interface CallServiceOff extends CallServiceBase {
            service: "turn_off"
        }
    }
   

    export interface EntityStateScene extends EntityStateBase {
        /** ISO Time string when the scene was last activated */
        state: string;
        attributes: {
            /** Arry of entity ID's in this scene */
            entity_id: string[];
            /** String encoded number, e.g. 1688674484606 */
            id: string;
            /** Name of the scene */
            friendly_name: string;
        }
    }
}