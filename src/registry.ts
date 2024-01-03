import { HomeLocation } from "@script_types/sources/_shared/location";
import { AsssistantCommand } from "./socket_command";
import { Sources } from "./sources/_construct";
import { Registry } from './types/type_registry';
import { ParameterType } from "@script_types/spec/spec_parameter";
import { verbose } from "./script";

export class RegistryService {
    private cmd_: AsssistantCommand | undefined;

    public data_areas_arr: Registry.Area[] = [];
    public data_devices_arr: Registry.Device[] = [];
    public data_entities_arr: Registry.Entity[] = [];
    // For performance reasons store a second time as map! Object lookup is faster than Map() according to benchmarks!
    public data_devices_map: {[id: string]: Registry.Device} = {};
    public data_entities_map: {[id: string]: Registry.Entity} = {};

    public setCommandHandler = (cmd_: AsssistantCommand) => {
        this.cmd_ = cmd_;
    }

    public socketConnected = async () => {
        // Issue initial fetch
        return this.getRegistries();    
    }

    public getLocationAll = (): HomeLocation => {
        return {
            id: "all",
            name: "All Devices"
        }
    }

    public getLocationParameters = (): { dropdown_entries: ParameterType.DropdownEntry[] } => {
        const location_all = this.getLocationAll();
        return {
            dropdown_entries: [
                { value: location_all.id, name: location_all.name }
            ].concat(this.data_areas_arr.map(e => {
                return { value: e.area_id, name: e.name }
            }))
        }
    }
    public getAreaParameters = (): { dropdown_entries: ParameterType.DropdownEntry[] } => {
        return {
            dropdown_entries: this.data_areas_arr.map(e => {
                const obj: ParameterType.DropdownEntry = {
                    value: e.area_id,
                    name: e.name ? e.name : e.area_id
                }   
                return obj;
            })
        }
    }

    private getRegistries = async () => {
        const log_prefix = "getRegistries: ";
        const areas_res = await this.cmd_?.sendCommand({ type: "config/area_registry/list" });
        const entity_res = await this.cmd_?.sendCommand({ type: "config/entity_registry/list" });
        const devices_res = await this.cmd_?.sendCommand({ type: "config/device_registry/list" });

        console.log(log_prefix, "area_registry: ",   areas_res?.res);
        console.log(log_prefix, "entity_res: ", entity_res);
        console.log(log_prefix, "device_registry: ", devices_res?.res);
        
        const res_area =  <Registry.Area[]> areas_res?.res;
        if (res_area && Array.isArray(res_area)) {
            this.data_areas_arr = res_area;
        }

        const res_entities =  <Registry.Entity[]> entity_res?.res;
        if (res_entities && Array.isArray(res_entities)) {
            this.data_entities_arr = res_entities;
            this.data_entities_map = {};
            for (const e of res_entities) {
                this.data_entities_map[e.entity_id] = e;
            };
        }

        const res_devices =  <Registry.Device[]> devices_res?.res;
        if (res_devices && Array.isArray(res_devices)) {
            this.data_devices_arr = res_devices;
            this.data_devices_map = {};
            for (const e of res_devices) {
                this.data_devices_map[e.id] = e;
            };
        }
        if (verbose) {
            console.debug(log_prefix, "data_entities_map: ", this.data_entities_map);
        }

        Sources.sources.forEach(s => {
            s.registryUpdated();
        })
    }

    public receivedUpdate = async (_type: "area" | "devices" | "entities") => {
        // Todo: Re-Fetch areas / devices
        await this.getRegistries();

        // Re-Transmit overview

    }

}

export const sRegistry = new RegistryService();