
type CmdRes = { res?: object, error?: string, d_ms?: number };


export interface AssistantRefs {
    sendMessage: (msg: object) => number | undefined;
}

export class AsssistantCommand {

    private refs_: AssistantRefs;

    constructor(refs_: AssistantRefs) {
        this.refs_ = refs_;
    }

    private running_cmd: {[id: number]: {
        id: number,
        timeout: NodeJS.Timeout,
        t_tx: number,
        resolve: (value: CmdRes) => void
    }} = {};
    

    private clearCmd = (id: number) => {
        const obj = this.running_cmd[id];
        if (obj) {
            delete this.running_cmd[id];
            obj.resolve({ error: "Expired" });
        }
    }

    public handleCommandResult = (msg: { id: number, type: "result", success: boolean, result: object}) => {
        const id = msg.id;
        const obj = this.running_cmd[id];
        if (obj) {
            delete this.running_cmd[id];
            obj.resolve({ d_ms: Date.now() - obj.t_tx, res: msg.result });
        }
    }

    public sendCommand = async (msg: object): Promise<CmdRes> => {
        const id = this.refs_.sendMessage(msg);
        if (id !== undefined) {
            const p = new Promise<CmdRes>((resolve) => {
                const t = setTimeout(() => this.clearCmd(id), 2000);
                this.running_cmd[id] = {
                    id,
                    t_tx: Date.now(),
                    timeout: t,
                    resolve
                };
            });
            return p;
        } else {
            return { error: "Offline" };
        }
    }
}