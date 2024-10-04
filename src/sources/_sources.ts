import { SourceLights } from "./lights";
import { SourceCovers } from "./covers";
import { HaApi } from "../types/type_base";
import { SourceBinarySensors } from "./binary_sensors";


export type HaSource = SourceLights | SourceCovers | SourceBinarySensors;
export type CallbackChangeNotify = () => void;

export abstract class SourceBase<T extends HaApi.EntityState> {
    public readonly abstract entity_type: HaApi.EntityType;
    public abstract setStates: (states: T[]) => void;
    public abstract stateChange: (change: HaApi.EventStateChange<T>) => void;
    public abstract setChangeHandler: (cb: CallbackChangeNotify) => void;
    public abstract registryUpdated: () => void;
}