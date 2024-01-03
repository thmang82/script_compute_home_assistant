import { EntityBinarySensor } from "./type_binary_sensor";
import { EntityCover } from "./type_covers";
import { EntityLight } from "./type_lights";

export type EntityExtGeneric = LightStateExt | CoverStateExt | BinarySensorStateExt;

export interface LightStateExt extends EntityLight.State {
    location_ids?: string[];
}

export interface CoverStateExt extends EntityCover.State {
    location_ids?: string[];
}

export interface BinarySensorStateExt extends EntityBinarySensor.State {
    location_ids?: string[];
}