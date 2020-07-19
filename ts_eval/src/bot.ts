import { Client } from "./client";

export class Bot {
    protected client: Client;

    constructor(serverUrl: string, playerKey: bigint) {
        this.client = new Client(serverUrl, playerKey);
    }

    async run() {
        await this.client.join();
        await this.client.start();
        for (let i=0; i<256; i++) {
            await this.client.commands();
        }
    }
}
