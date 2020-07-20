// Запускать из папки ts_eval; Логи создаются в корневой папке репо
// ./build.sh && ICFPC_API_KEY=4b5b59dead9e42fbbf203df4e634a2da node build/create.js 'https://icfpc2020-api.testkontur.ru'

import "source-map-support/register";

import {Client, deepConsToList} from "./client";
import {Data} from "./modulation";
import {spawn} from "child_process";
import fs from "fs";
import path from "path";

function consToList(data: Data): Array<Data> {
    if (data === null) {
        return [];
    }
    if (typeof data === "bigint") {
        throw new Error("Number is not a list");
    }
    const [head, tail] = data;
    return [head, ...consToList(tail)];
}

type BadResponse = [0n];

type StartResponse = [1n, [[0n, bigint], [1n, bigint]]] | BadResponse;


async function main() {
    const runDir = path.resolve(process.cwd(), "..");
    console.log("runDir", runDir);
    process.chdir(runDir);

    const serverUrl = process.argv[2];

    console.log(`ServerUrl: ${serverUrl};`);

    const createClient = new Client(serverUrl, 0n);

    const createResponse = await createClient.create();

    const [[_0, atKey], [_1, defKey]] = createResponse[1];
    console.log("atKey", atKey);
    console.log("defKey", defKey);

    const attackerLog = fs.openSync("attacker.log", "w");
    const defenderLog = fs.openSync("defender.log", "w");

    const atClient = spawn("./run.sh", [serverUrl, String(atKey)], {
        stdio: ["ignore", attackerLog, attackerLog],
        shell: true,
    });
    const defClient = spawn("./run.sh", [serverUrl, String(defKey)], {
        stdio: ["ignore", defenderLog, defenderLog],
        shell: true,
    });
}

main()
    .catch((e) => {
        console.log(e);
        console.log(e.stack);
        process.exit(1);
    });
