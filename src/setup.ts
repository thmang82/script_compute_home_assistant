import { SourceDeviceCovers } from "@script_types/sources/devices/source_device_covers";
import { ScriptConfig } from '../gen/spec_config'; 

type TypeWindows = ScriptConfig["window_setup"];
type TypeFloor = {
    area_ids: string[];
    ident: string;
    name: string;
}

export namespace Setup {

    export const window_types: SourceDeviceCovers.WindowType[] = [
        "casement",
        "awning",
        "hung",
        "sliding",
        "skylight",
        "door",
        "sliding_door"
    ];

    export let renamings: {
        device_id?: { value: string ,  name: string };
        name?: { value: string ,  name: string };
    }[] = [];

    export let window_setup: TypeWindows = [];

    export let floor_setup: TypeFloor[] = [];
}