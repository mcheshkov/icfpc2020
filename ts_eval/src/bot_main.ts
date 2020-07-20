import "source-map-support/register";

import {Bot} from "./bot";

async function main() {
    const serverUrl = process.argv[2];
    const playerKey = BigInt(process.argv[3]);

    console.log(`ServerUrl: ${serverUrl}; playerKey: ${playerKey}`);

    const bot = new Bot(serverUrl, playerKey);
    await bot.run()
}

main()
.catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(1);
});
