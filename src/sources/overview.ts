
import { SourceDeviceCovers } from '@script_types/sources/devices/source_device_covers';
import { SourceDeviceLights } from '@script_types/sources/devices/source_device_lights';
import { SourceDevicesOverview } from '@script_types/sources/devices/source_devices_overview';
import { sRegistry } from '../registry';
import { Setup } from '../setup';

function copyDeep<T>(input: T): T {
    return <T> JSON.parse(JSON.stringify(input));
}

export class DeviceOverview {

    public getDataResponse = (active_lights: SourceDeviceLights.LightStatus[], active_covers: SourceDeviceCovers.Cover[]): SourceDevicesOverview.Data => {
        
        console.log("DeviceOverview:getDataResponse: input: ", active_lights, active_covers);

        const window_doors: SourceDeviceCovers.WindowType[] = [ "door", "sliding_door" ];

        function isDoor(e: SourceDeviceCovers.Cover): boolean {
            return (e.type == "door" || e.type == "garage_door" || e.type == "gate" || (e.type == "window" && e.window_type && window_doors.indexOf(e.window_type) >= 0)) || false;
        }
        function isWindow(e: SourceDeviceCovers.Cover): boolean {
            return (e.type == "window" && (!e.window_type || window_doors.indexOf(e.window_type) < 0)) || false;
        }
        /*
        function isCover(e: SourceDeviceCovers.Cover): boolean {
            return (e.type == "blind" || e.type == "curtain" || e.type == "shade" || e.type == "shutter") || false;
        }
        */
        const doors   = active_covers.filter(isDoor);
        const windows = active_covers.filter(isWindow);
        const shutters = active_covers.filter(e => e.type == "shutter");
        console.log("DeviceOverview:getDataResponse: => doors: ", doors);
        console.log("DeviceOverview:getDataResponse: => windows: ", windows);


        const loc_all = sRegistry.getLocationAll();
        const areas: { id: string, name: string, area_ids?: string[] }[] = copyDeep(sRegistry.data_areas_arr).map(e => {
            return { id: e.area_id, name: e.name };
        });
        if (areas.findIndex(e => e.id == loc_all.id) < 0) {
            areas.push(loc_all);
        }
        Setup.floor_setup.forEach(f => {
            areas.push({ id: f.ident, name: f.name, area_ids: f.area_ids });
        });

        function getAreaOkFn(area_o: { id: string, area_ids?: string[] }) {
            return (e: SourceDeviceLights.LightStatus | SourceDeviceCovers.Cover): boolean => {
                if (!area_o.area_ids) {
                    return e.location_ids.indexOf(area_o.id) >= 0;
                } else {
                    let f_num = 0;
                    for (const id of area_o.area_ids) {
                        f_num += (e.location_ids.indexOf(id) >= 0 ? 1 : 0);
                    }
                    return f_num > 0;
                }
            };
        }

        const ret:  SourceDevicesOverview.Data = {
            active_devices: {
                lights_on: active_lights,
                doors_open: doors,
                shutters_open: shutters,
                windows_open: windows
            },
            summaries: areas.map(area_o => {
                const areaOk = getAreaOkFn(area_o);
                return {
                    location: area_o,
                    state: {
                        lights: {
                            on_count: active_lights.filter(areaOk).length
                        },
                        doors: {
                            open_count: doors.filter(areaOk).length
                        },
                        shutters: {
                            open_count: shutters.filter(areaOk).length
                        },
                        windows: {
                            open_count: windows.filter(areaOk).length
                        }
                    }
                };
            })
        }
        return ret;
    }
    
}