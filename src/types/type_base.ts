import { EntityCover } from "./type_covers";
import { EntityLight } from "./type_lights";

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

    export type EntityState = EntityLight.State | EntityCover.State;

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