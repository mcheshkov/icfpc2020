import {Accel, Client} from "./client";

export class Bot {
    protected client: Client;

    constructor(serverUrl: string, playerKey: bigint) {
        this.client = new Client(serverUrl, playerKey);
    }

    async run() {
        await this.client.join();
        const resp = await this.client.start();

        const role = resp.info.role;
        const myShips = resp.state.shipsAndCommands
            .filter(scs => scs.ship.role === role)
            .map(scs => scs.ship.id);

        for (let i=0; i<256; i++) {
            await this.client.commands([
                ...myShips.map(id => (Accel(id,[1n,1n])))
            ]);
        }
    }
}
