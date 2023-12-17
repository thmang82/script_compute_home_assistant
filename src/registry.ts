import { AsssistantCommand } from "./socket_command";
import { Sources } from "./sources/_construct";

export class Registry {
    private cmd_: AsssistantCommand | undefined;

    public setCommandHandler = (cmd_: AsssistantCommand) => {
        this.cmd_ = cmd_;
    }

    public socketConnected = async () => {
        // Issue initial fetch
        return this.getRegistries();    
    }

    private getRegistries = async () => {
        const areas_res = await this.cmd_?.sendCommand({ type: "config/area_registry/list" });
        const devices_res = await this.cmd_?.sendCommand({ type: "config/device_registry/list" });

        console.log("area_registry: ",   areas_res?.res);
        console.log("device_registry: ", devices_res?.res);

        Sources.sources.forEach(s => {
            s.registryUpdated();
        })
    }

    public receivedUpdate = async (_type: "area" | "devices") => {
        // Todo: Re-Fetch areas / devices
        await this.getRegistries();

        // Re-Transmit overview
        
    }

}

export const sRegistry = new Registry();