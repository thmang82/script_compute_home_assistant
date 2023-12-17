
import { SourceDeviceCovers } from '@script_types/sources/devices/source_device_covers';
import { SourceDeviceLights } from '@script_types/sources/devices/source_device_lights';
import { SourceDevicesOverview } from '@script_types/sources/devices/source_devices_overview';

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

        const ret:  SourceDevicesOverview.Data = {
            summaries: [{
                state: {
                    lights: {
                        on_count: active_lights.length
                    },
                    doors: {
                        open_count: doors.length
                    },
                    shutters: {
                        open_count: shutters.length
                    },
                    windows: {
                        open_count: windows.length
                    }
                },
                devices: {
                    lights_on: active_lights,
                    doors_open: doors,
                    shutters_open: shutters,
                    windows_open: windows
                }
            }]
        }
        return ret;
    }
    
}