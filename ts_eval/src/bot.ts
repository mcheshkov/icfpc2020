import got from "got";

import {Data, demodulate, modulate} from "./modulation";

function listToCons(a: Array<Data>): Data {
    if (a.length === 0) {
        return null;
    } else {
        return [a[0], listToCons(a.slice(1))];
    }
}

function JOIN(playerKey: bigint): Data {
    const unknownParam = null;
    return listToCons([2n, playerKey, unknownParam]);
}

function START(playerKey: bigint): Data {
    // TODO args
    const x0 = 0n;
    const x1 = 0n;
    const x2 = 0n;
    const x3 = 0n;
    return listToCons([3n, playerKey, listToCons([x0, x1, x2, x3])]);
}

function COMMANDS(playerKey: bigint): Data {
    // TODO args
    const commands: Array<Data> = [];
    return listToCons([4n, playerKey, listToCons(commands)]);
}

class Client {
    constructor(protected serverUrl: string, protected playerKey: bigint) {
    }

    async sendAliens(data: Data): Promise<Data> {
        const body = modulate(data);

        try {
            const response = await got.post(`${this.serverUrl}/aliens/send`, {body});
            console.log(`Server response:`, response.body);
            return demodulate(response.body)[0];
        } catch (e) {
            console.log(`Unexpected server response:\n`, e);
            if (typeof e.response !== 'undefined') {
                console.log(`\nResponse body:`, e.response.body);
            }
            process.exit(1);
        }
    }

    async join(): Promise<Data> {
        return await this.sendAliens(JOIN(this.playerKey));
    }

    async start(): Promise<Data> {
        return await this.sendAliens(START(this.playerKey));
    }

    async commands(): Promise<Data> {
        return await this.sendAliens(COMMANDS(this.playerKey));
    }
}

async function main() {
    const serverUrl = process.argv[2];
    const playerKey = BigInt(process.argv[3]);

    console.log(`ServerUrl: ${serverUrl}; playerKey: ${playerKey}`);

    const client = new Client(serverUrl, playerKey);

    await client.join();
    await client.start();
    for (let i=0; i<256; i++) {
        await client.commands();
    }
}

main()
.catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(1);
});
