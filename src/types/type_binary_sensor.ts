
import { HaApi } from "./type_base";

/** 
 * https://developers.home-assistant.io/docs/core/entity/binary-sensor
 * https://github.com/home-assistant/core/blob/dev/homeassistant/components/binary_sensor/__init__.py
 **/
export namespace EntityBinarySensor {

    export type SensorState = "on" | "off";

    export type CallService = "";

    export interface State extends HaApi.EntityStateBase {
        state: SensorState;
        attributes: {
            friendly_name: string;

            /* What kind of sensor this is */
            device_class: SensorClass

            /** Battery state */
            battery?: number;
            /** Sensor closed or not closed */
            contact?: boolean;
            /** ISO time when last seen */
            last_seen?: string;

            power_outage_count?: number;
            voltage?: number;

            /*
                Example: 

                "battery": 63,
                "contact": true,
                "last_seen": "2023-12-16T20:02:13.099Z",
                "linkquality": 57,
                "power_outage_count": 1408,
                "voltage": 2945,
                "device_class": "door",
                "friendly_name": "ReedContactEntranceDoor Tür"
            */
        }
    };

    export type SensorClass = 
        // On means low, Off means normal
        "battery"
        // On means charging, Off means not charging
        | "battery_charging"
        // On means carbon monoxide detected, Off means no carbon monoxide (clear)
        | "carbon_monoxide"
        // On means cold, Off means normal
        | "cold"
        // On means connected, Off means disconnected
        | "connectivity"
        // On means open, Off means closed
        | "door"
        // On means open, Off means closed
        | "garage_door"
        // On means gas detected, Off means no gas (clear)
        | "gas"
        // On means hot, Off means normal
        | "heat"
        // On means light detected, Off means no light
        | "light"
        // On means open (unlocked), Off means closed (locked)
        | "lock"
        // On means wet, Off means dry
        | "moisture"
        // On means motion detected, Off means no motion (clear)
        | "motion"
        // On means moving, Off means not moving (stopped)
        | "moving"
        // On means occupied, Off means not occupied (clear)
        | "occupancy"
        // On means open, Off means closed
        | "opening"
        // On means plugged in, Off means unplugged
        | "plug"
        // On means power detected, Off means no power
        | "power"
        // On means home, Off means away
        | "presence"
        // On means problem detected, Off means no problem (OK)
        | "problem"
        // On means running, Off means not running
        | "running"
        // On means unsafe, Off means safe
        | "safety"
        // On means smoke detected, Off means no smoke (clear)
        | "smoke"
        // On means sound detected, Off means no sound (clear)
        | "sound"
        // On means tampering detected, Off means no tampering (clear)
        | "tamper"
        // On means update available, Off means up-to-date
        | "update"
        // On means vibration detected, Off means no vibration
        | "vibration"
        // On means open, Off means closed
        | "window";
}