import { Script } from '@script_types/script/script';
import { ScriptConfig } from '../gen/spec_config'; /* File will be automatically generated by compiler! Run "nom run cli install" */
import { specification } from './spec';
import { AssistantMessages } from './socket_messages';
import { AsssistantCommand } from './socket_command';
import { ParameterType } from '@script_types/spec/spec_parameter';
import { ScriptCtxUI } from '@script_types/script/context_ui/context_ui';
import { DataSourcesTypes } from '@script_types/sources/sources_types';
import { HaApi } from './types/type_base';
import { DeviceOverview } from './sources/overview';
import { Sources } from './sources/_construct';
import { sRegistry } from './registry';
import { Setup } from './setup';
import { sleep } from './helper';

type ProvidedSources = "compute" | "device_lights" | "device_covers";

export let sendToDisplay: FnSendToDisplay | undefined;
export type FnSendToDisplay = <T extends ProvidedSources>(ident: T, data: DataSourcesTypes.MapData<T>) => void;

export interface SocketInfo {
    uid: string;
}

export let verbose = false;


export class MyScript implements Script.Class<ScriptConfig> {

    private msg_id = 1;
    private cmd_handler: AsssistantCommand;
    private msg_handler: AssistantMessages;
    private source_overview: DeviceOverview;
    
    private config: ScriptConfig | undefined;
    private ctx: Script.Context | undefined;

    /** Is set as long as connected, will be undefined during re-connects */
    private socket_info: SocketInfo | undefined;

    private socket_url: string | undefined;
    private running = false;

    constructor(){
        sendToDisplay = this.sendToDisplay;
        this.cmd_handler = new AsssistantCommand({ sendMessage: this.sendMessage });
        this.msg_handler = new AssistantMessages({
            cmd_: this.cmd_handler,
            sendData: this.sendData,
            sendMessage: this.sendMessage,
            getToken: this.getToken
        });
        this.source_overview = new DeviceOverview();
        sRegistry.setCommandHandler(this.cmd_handler);

        Sources.sCovers.setChangeHandler(() => this.dataChange('cover'));
        Sources.sLights.setChangeHandler(() => this.dataChange('light'));
    }

    public getToken = (): string | undefined => {
        return this.config?.token?.value;
    }

    start = async (ctx: Script.Context, config: ScriptConfig): Promise<void> => {
        this.ctx = ctx;
        this.config = config;
        this.running = true;

        console.info("Ident:" + specification.id_ident);
        console.info("Config:", config);

        if (config.device_rename) {
            Setup.renamings = config.device_rename;
        }
        if (config.window_setup) {
            Setup.window_setup = config.window_setup;
        }
        if (config.floors) {
            Setup.floor_setup = [];
            config.floors.forEach(e => {
                if (e.area_ids && e.floor_name && e.ident) {
                    Setup.floor_setup.push({ name: e.floor_name.value, area_ids: e.area_ids.value, ident: e.ident.value });
                }
            })
        }
        if (config.verbose_log) {
            verbose = config.verbose_log.value;
        }

        let host = config.host?.value;
        const token = config.token?.value;
        if (host && token) {

            if (!host.startsWith("ws://")) {
                host = "ws://" + host;
            }
            console.debug("split test: ", host.split(":"));
            if (host.split(":").length == 2) { // there is one in ws://, check if the one for the port exists, should be 3 elements. If only 2, add the port
                host = host + ":8123";
            }
            const url = host + "/api/websocket";
            this.socket_url = url;

            this.startWebSocket();

        } else {
            if (!host) console.error("Config incomplete: host not given");
            if (!token) console.error("Config incomplete: token not given");
        }

        const handleSubscriptionResult = (result: { error: string | undefined }) => {
            if (result.error) console.error(result.error);
        }

        ctx.ui.subscribeDataRequests<"device_lights">("device_lights", this.dataRequestLights).then(handleSubscriptionResult);
        ctx.ui.subscribeDataRequests<"device_covers">("device_covers", this.dataRequestCovers).then(handleSubscriptionResult);
        ctx.ui.subscribeDataRequests<"devices_overview">("devices_overview", this.dataRequestOverview).then(handleSubscriptionResult);

        ctx.ui.subscribeCommands<"device_lights">("device_lights", this.executeCommandLights).then(handleSubscriptionResult);
        ctx.ui.subscribeCommands<"device_covers">("device_covers", this.executeCommandCovers).then(handleSubscriptionResult);
        ctx.ui.subscribeCommands<"devices_overview">("devices_overview", this.executeCommandOverview).then(handleSubscriptionResult);

        ctx.ui.registerConfigOptionsProvider(async (req) => {
            let ident = req.parameter_ident;
            console.debug("Config req: ", req);
            if (req.source == "widget") {
                if (ident == "light") {
                    // This is a request from the "light widget" selector!
                    return Sources.sLights.getConfigParameters();
                } else if (ident == "cover") {
                    // This is a request from the "cover widget" selector!
                    return Sources.sCovers.getConfigParameters();
                } else if (ident == "location") {
                    const areas_param = sRegistry.getLocationParameters();
                    Setup.floor_setup.forEach(e => {
                        areas_param.dropdown_entries.push({ value: e.ident, name: e.name });
                    });
                    return areas_param;
                } else {
                    console.error("Config Options Req: UnkownID: ", ident);
                    return { no_data: 'UnknownID' };
                }
            } else if (req.source == "script_instance") {
                if (ident == "device_id") {
                    // for renaming
                    
                    let entries: ParameterType.DropdownEntry[] = [];
                    const entries_c =  Sources.sCovers.getConfigParameters().dropdown_entries;
                    entries_c.forEach(e => { e.name = "Cover: " + e.name });
                    entries = entries.concat(entries_c);

                    const entries_l = Sources.sLights.getConfigParameters().dropdown_entries;
                    entries_l.forEach(e => { e.name = "Light: " + e.name });
                    entries = entries.concat(entries_l);

                    return {
                        dropdown_entries: entries
                    }
                } else if (ident == "window_sensor_id") {
                    let entries: ParameterType.DropdownEntry[] = [];
                    // Get the sensors with class window or door:
                    const entries_win = Sources.sBinarySensors.getWindowsForConfig().dropdown_entries;
                    entries = entries.concat(entries_win);
                    return {
                        dropdown_entries: entries
                    }
                } else if (ident == "window_type") {
                    let entries: ParameterType.DropdownEntry[] = [];
                    Setup.window_types.forEach(w => {
                        entries.push({ value: w, name: w });
                    })
                    return {
                        dropdown_entries: entries
                    }
                } else if (ident == "area_ids") {
                    return sRegistry.getAreaParameters();
                }
            }
            return {
                no_data: "UnknownID"
            };
        });   
    }

    /** Try to connect to websocket. If fails, retry for a while */
    private startWebSocket = async () => {
        let connected = false
        while (!connected && this.running) {
            connected = await this.connectToWebSocket();
            if (!connected) {
                // Note: In case of a connect error, there will be no re-tries by the platform! We have to handle that ourself
                const sleep_seconds = 10;
                await sleep(sleep_seconds * 1000);
            }
        }
    }

    private connectToWebSocket = async (): Promise<boolean> => {
        const url = this.socket_url;
        console.log(`Connect to ${url} ...`);
        if (!url) {
            console.error("No Socket URL!");
            return false;
        }
        this.socket_info = undefined; // make sure it is not set
        const socket_info = {
            uid: "",
        }
        const result = await this.ctx?.data.websocket.connect(url, (data) => this.msg_handler.onDataReceived(data, socket_info), {
            auto_reconnect: true, // if true, and connected once, the platform will try to reconnect if connection break
            state_handler: (state) => {
                console.log(`Socket '${state.uid}' state: ${state.connected ? 'connected' : 'disconnected'}`);
                if (!state.connected) {
                    this.socket_info = undefined;
                } else {
                    this.socket_info = {
                        uid: state.uid
                    }
                }
            }
        });
        console.debug(`Connect result: `, result);
        if (result?.uid) {
            socket_info.uid = result.uid;
            this.socket_info = socket_info;
            return true;
        } else if (result?.error) {
            console.debug(`Error connecting to websocket: `, result?.error);
        }
        return false;
    }

    public sendToDisplay = <T extends ProvidedSources>(ident: T, data: DataSourcesTypes.MapData<T>) => {
        if (this.config?.verbose_log) {
            console.debug(`sendToDisplay: '${ident}': `, data);
        }
        this.ctx?.ui.transmitData(ident, data);
    }

    private sendData = (msg: any) => {
        if (!this.socket_info) {
            console.error("sendData: no socket");
            return;
        }
        this.ctx?.data.websocket.sendData(this.socket_info.uid, msg);
    }

    private sendMessage = (msg: object): number | undefined => {
        if (!this.socket_info) {
            console.error("sendMessage: no active socket");
            return undefined;
        }
        
        this.msg_id ++;
        const id = this.msg_id;
        if (verbose) {
            console.debug("sendMessage: ", id, msg);
        }
        // we need to add an increasing message id - https://developers.home-assistant.io/docs/api/websocket/
        const tx_msg = Object.assign(msg, { id });
        this.ctx?.data.websocket.sendData(this.socket_info.uid, tx_msg);
        return id;
    }


    stop = async (_reason: Script.StopReason): Promise<void> => {
        console.info("Stopping all my stuff ...");
        this.running = false;
        if (this.socket_info) {
            const res = await this.ctx?.data.websocket.disconnect(this.socket_info.uid);
            console.debug(`Disconnect from '${this.config?.host?.value}' result: `, res);
        }
    }

    public dataRequestLights: ScriptCtxUI.DataRequestCallback<"device_lights"> = async (req_params) => {
        console.debug(`dataRequestLights ...`);
        const data = await Sources.sLights.handleDataRequestDisplay(req_params);
        if (this.config?.verbose_log) {
            console.debug(`dataRequestLights: send: `, data);
        }
        return data;
    }

    public dataRequestCovers: ScriptCtxUI.DataRequestCallback<"device_covers"> = async (req_params) => {
        console.debug(`dataRequestCovers ...`);
        const data = await Sources.sCovers.handleDataRequestCover(req_params);
        if (this.config?.verbose_log) {
            console.debug(`dataRequestCovers: send: `, data);
        }
        return data;
    };

    private dataChange = async (_type: HaApi.EntityType) => {
        // recompute the overview state and send to frontend: 
        const data = await this.dataRequestOverview({});
        if (data) {
            this.ctx?.ui.transmitData("devices_overview", data);
        }
    }

    public dataRequestOverview: ScriptCtxUI.DataRequestCallback<"devices_overview"> = async (_req_params) => {
        console.debug(`dataRequestOverview ...`);

        const active_lights = Sources.sLights.getActiveLights();
        const active_covers = Sources.sCovers.getActiveCovers();

        const response = this.source_overview.getDataResponse(active_lights, active_covers);
        if (this.config?.verbose_log) {
            console.debug(`dataRequestOverview: send: `, response);
        }
        return response;
    };

    public executeCommandLights: ScriptCtxUI.CommandCallback<"device_lights"> = async (cmd, _env) => {
        console.log("executeCommandLights: ", cmd);
        const ha_msg = await Sources.sLights.handleCommandLight(cmd);
        if (ha_msg) {
            this.sendMessage(ha_msg);
            return { success: true };
        } else {
            console.warn(`executeCommandLights: No handler found for ${cmd.change.ident}`);
        }
        return undefined;
    }
    
    public executeCommandCovers: ScriptCtxUI.CommandCallback<"device_covers"> = async (cmd, _env) => {
        console.log("executeCommandCovers: ", cmd);
        const ha_msg = await Sources.sCovers.handleCommandCover(cmd);
        if (ha_msg) {
            this.sendMessage(ha_msg);
            return { success: true };
        } else {
            console.warn(`executeCommandCovers: No handler found for ${cmd.change.ident}`);
        }
        return undefined;
    }

    public executeCommandOverview: ScriptCtxUI.CommandCallback<"devices_overview"> = async (cmd, _env) => {
        console.log("executeCommandOverview: ", cmd);
        
        const loc_id = cmd.location_id;
        if (loc_id) {
            if (cmd.change_light) {
                const ha_msg = await Sources.sLights.handleCommandLight({ change: cmd.change_light });
                if (ha_msg) this.sendMessage(ha_msg);
            }
            if (cmd.change_cover) {
                const ha_msg = await Sources.sCovers.handleCommandCover({ change: cmd.change_cover });
                if (ha_msg) this.sendMessage(ha_msg);
            }
            if (cmd.change_lights) {
                const calls = await Sources.sLights.getChangeAllInLocation(loc_id, cmd.change_lights);
                calls.forEach(cmd => this.sendMessage(cmd));
            }
            if (cmd.change_shutters) {
                const calls = await Sources.sCovers.getChangeAllInLocation(loc_id, cmd.change_shutters, 'shutters');
                calls.forEach(cmd => this.sendMessage(cmd));
            }
            if (cmd.change_doors) {
                const calls = await Sources.sCovers.getChangeAllInLocation(loc_id, cmd.change_doors, 'doors');
                calls.forEach(cmd => this.sendMessage(cmd));
            }
            if (cmd.change_windows) {
                const calls = await Sources.sCovers.getChangeAllInLocation(loc_id, cmd.change_windows, 'windows');
                calls.forEach(cmd => this.sendMessage(cmd));
            }
            return { success: true };
        }
        return undefined;
    }
  
}

export const script = new MyScript();