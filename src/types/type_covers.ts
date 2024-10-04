
import { HaApi } from "./type_base";

/** 
 * https://developers.home-assistant.io/docs/core/entity/cover 
 * https://github.com/home-assistant/core/blob/dev/homeassistant/components/cover/__init__.py
 **/
export namespace EntityCover {

    export type CoverState = "opening" | "closing" | "closed" | "open" | "stopped"; // prefer 'closed'/'open' over 'stopped'!
    export type CoverType  = "shutter" | "blind" | "curtain" | "shade" | "garage" | "awning" | "damper" | "door" | "gate" | "window";
    export type CoverFeature = "open" | "close" | "set_position" | "stop" | "open_tilt" | "close_tilt" | "set_tilt_position" | "stop_tilt";

    export interface State extends HaApi.EntityStateBase {
        state: CoverState;
        attributes: {
            device_class: CoverType;
            
            friendly_name: string;
            /** The opening state, between 0 and 100 */
            current_position?: number;
            /** The tilt opening state, between 0 and 100 */
            current_tilt_position?: number;
            /** Bitmask of SUPPORT */
            supported_features: number;
        }
    };

    /* Supported features of the cover entity. */
    export enum SUPPORT {
        // Normal:
        OPEN = 1,
        CLOSE = 2,
        SET_POSITION = 4,
        STOP = 8,
        // Tilt:
        OPEN_TILT = 16,
        CLOSE_TILT = 32,
        STOP_TILT = 64,
        SET_TILT_POSITION = 128
    }
    
    // --- Change Cover state:

    export type CallService = CoverServices | CoverTiltServices;
    
    interface CallServiceBase {
        type: "call_service",
        domain: "cover",
        target: {
            entity_id: string
        }
    }

    // ---- Cover ----------------

    export type CoverServices = CallServiceOpen | CallServiceClose | CallServiceSetCoverPosition | CallServiceStopCover;

    // Only implement this method if the flag SUPPORT_OPEN is set.
    export interface CallServiceOpen extends CallServiceBase {
        service: "open_cover",
        // Optional
        service_data?: {
            color_name?: string,
            position: number
        }
    }
    // Only implement this method if the flag SUPPORT_CLOSE is set.
    export interface CallServiceClose extends CallServiceBase {
        service: "close_cover"
    }

    // Only implement this method if the flag SUPPORT_SET_POSITION is set.
    export interface CallServiceSetCoverPosition extends CallServiceBase {
        service: "set_cover_position",
        service_data: {
            /** Min: 0, Max: 100 */
            position: number
        }
    }

    // Only implement this method if the flag SUPPORT_STOP is set.
    export interface CallServiceStopCover extends CallServiceBase {
        service: "stop_cover"
    }

    // ---- TILT ----------------

    export type CoverTiltServices = CallServiceOpenTilt | CallServiceCloseTilt | CallServiceSetCoverTiltPosition | CallServiceStopCoverTilt;

    // Only implement this method if the flag SUPPORT_OPEN_TILT is set.
    export interface CallServiceOpenTilt extends CallServiceBase {
        service: "open_cover_tilt",
    }
    // Only implement this method if the flag SUPPORT_CLOSE_TILT is set.
    export interface CallServiceCloseTilt extends CallServiceBase {
        service: "close_cover_tilt"
    }
    // Only implement this method if the flag SUPPORT_SET_TILT_POSITION is set.
    export interface CallServiceSetCoverTiltPosition extends CallServiceBase {
        service: "set_cover_tilt_position",
        service_data: {
            /** Min: 0, Max: 100 */
            position: number
        }
    }
    // Only implement this method if the flag SUPPORT_STOP_TILT is set.
    export interface CallServiceStopCoverTilt extends CallServiceBase {
        service: "stop_cover_tilt"
    }
}