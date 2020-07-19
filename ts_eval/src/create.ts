import { Client } from "./client";
import {Data} from "./modulation";
import {fork} from "child_process";

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

type ListData = Array<ListData> | bigint;

type BadResponse = [0n];

type StartResponse = [1n, [[0n, bigint], [1n, bigint]]] | BadResponse;

function deepConsToList(data: Data): ListData {
    if (data === null) {
        return [];
    }
    if (typeof data === "bigint") {
        return data;
    }
    const [head, tail] = data;
    const tailList = deepConsToList(tail);
    if (typeof tailList === "bigint") {
        throw new Error("Unexpected number in tail");
    }
    return [deepConsToList(head), ...tailList];
}

async function main() {
    const serverUrl = process.argv[2];

    console.log(`ServerUrl: ${serverUrl};`);

    const createClient = new Client(serverUrl, 0n);

    const result = await createClient.create();
    const listResult = deepConsToList(result) as StartResponse;
    if (listResult[0] !== 1n) {
        throw new Error(`Bad response: ${result}`);
    }

    const [[_0, atKey], [_1, defKey]] = listResult[1];
    console.log("atKey", atKey);
    console.log("defKey", defKey);

    const atClient = fork(__dirname + "/bot.js", [serverUrl, String(atKey)]);
    const defClient = fork(__dirname + "/bot.js", [serverUrl, String(defKey)]);
}

main()
    .catch((e) => {
        console.log(e);
        console.log(e.stack);
        process.exit(1);
    });
