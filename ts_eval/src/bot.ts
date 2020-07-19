import { Client } from "./client";

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
