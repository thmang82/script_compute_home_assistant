import { EntityBinarySensor } from "./type_binary_sensor";
import { EntityCover } from "./type_covers";
import { EntityLight } from "./type_lights";
import { EntitySensor } from "./type_sensor";

export namespace HaApi {

    export type EntityType = "light" | "cover" | "binary_sensor" | "sensor";

    export type EventType = "state_changed" | "area_registry_updated" | "device_registry_updated";
    export type Event = EventStateChange<any> | EventAreaRegistryUpdate | EventDeviceRegistryUpdate;

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

    // {"action":"update","device_id":"ae842294728477edfcb86d86ac5303a3","changes":{"area_id":"flur"}},"origin":"LOCAL","time_fired":"2023-12-16T23:56:04.564285+00:00","context":{"id":"01HHTGXY2M9JDGY71NSWMEFK7M","parent_id":null,"user_id":null}}
    export interface EventDeviceRegistryUpdate {
        event_type: "device_registry_updated",
        data: {
            /** e.g. update */
            action: string,
            device_id: string,
            /** e.g. { "area_id":"flur" } */
            changes: object
        },
        /** e.g. LOCAL */
        origin: string;
        /** ISO time str, e.g 2023-07-06T19:11:00.309279+00:00*/
        time_fired: string;
        context: Context;
    }

    
    // Example: {"event_type":"area_registry_updated","data":{"action":"update","area_id":"flur"},"origin":"LOCAL","time_fired":"2023-12-16T23:51:52.473388+00:00","context":{"id":"01HHTGP7WS4PZ4EEHQDMX7Z74X","parent_id":null,"user_id":null}}
    export interface EventAreaRegistryUpdate {
        event_type: "area_registry_updated",
        data: {
            action: string,
            area_id: string
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

    export type EntityState = EntityLight.State | EntityCover.State | EntityBinarySensor.State | EntitySensor.State;

    export interface EntityStateBase {
        entity_id: string;
        /** ISO Time string */
        last_changed: string;
        /** ISO Time string */
        last_updated: string;
        context: Context;
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