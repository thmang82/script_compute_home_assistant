import { HaApi } from "../types";
import { SourceLights } from "./lights";


export type HaSource = SourceLights;

export abstract class SourceBase {
    public readonly abstract entity_type: HaApi.EntityType;
    public abstract setStates: (states: HaApi.EntityLight.State[]) => void;
    public abstract stateChange: (change: HaApi.EventStateChange<HaApi.EntityState>) => void;
}