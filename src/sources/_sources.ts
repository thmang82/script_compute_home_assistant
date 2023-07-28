import { SourceLights } from "./lights";
import { SourceCovers } from "./covers";
import { HaApi } from "../types/type_base";


export type HaSource = SourceLights | SourceCovers;

export abstract class SourceBase<T extends HaApi.EntityState> {
    public readonly abstract entity_type: HaApi.EntityType;
    public abstract setStates: (states: T[]) => void;
    public abstract stateChange: (change: HaApi.EventStateChange<T>) => void;
}