import { SourceBinarySensors } from "./binary_sensors";
import { SourceCovers } from "./covers";
import { SourceLights } from "./lights";

export namespace Sources {
    export const sLights = new SourceLights();
    export const sCovers = new SourceCovers();
    export const sBinarySensors = new SourceBinarySensors();

    export const sources = [ sLights, sCovers, sBinarySensors ];
}