import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

import got from "got";

import { isRight } from "fp-ts/lib/Either";
import * as t from 'io-ts'

function decode<T, D extends t.Any>(decoder: D, t: unknown): t.TypeOf<typeof decoder> {
    const res = decoder.decode(t);
    if (isRight(res)) {
        return res.right;
    }
    // TODO proper message
    throw new Error("Parsing failed");
}

const bigliteral = <T extends bigint>(x: T) => t.literal(x, x.toString());

const bigint = new t.Type<bigint, bigint, unknown>(
    'bigint',
    (u): u is bigint => typeof u === "bigint",
    (u, c) => (typeof u === "bigint" ? t.success(u) : t.failure(u, c)),
    (a) => a,
)

const BadResponse = t.tuple([ bigliteral(0n) ]);

const GoodCreateResponse = t.tuple([
    bigliteral(1n),
    t.tuple([
        t.tuple([
            bigliteral(0n),
            bigint,
        ]),
        t.tuple([
            bigliteral(1n),
            bigint,
        ]),
    ]),
]);

export type GoodCreateResponse = t.TypeOf<typeof GoodCreateResponse>;

const CreateResponse = t.union([ GoodCreateResponse, BadResponse ])

import {Data, demodulate, modulate} from "./modulation";

function listToCons(a: Array<Data>): Data {
    if (a.length === 0) {
        return null;
    } else {
        return [a[0], listToCons(a.slice(1))];
    }
}

function CREATE(): Data {
    return listToCons([1n, 0n]);
}

function JOIN(playerKey: bigint): Data {
    const unknownParam = null;
    return listToCons([2n, playerKey, unknownParam]);
}

function START(playerKey: bigint): Data {
    // TODO args
    const x0 = 1n;
    const x1 = 1n;
    const x2 = 1n;
    const x3 = 1n;
    return listToCons([3n, playerKey, listToCons([x0, x1, x2, x3])]);
}

function COMMANDS(playerKey: bigint): Data {
    // TODO args
    const commands: Array<Data> = [];
    return listToCons([4n, playerKey, listToCons(commands)]);
}

function dataAsJson(data: Data) {
    return JSON.stringify(data, (k, v) => typeof v === "bigint" ? v.toString() : v, '\t');
}

type ListData = Array<ListData> | bigint;

export function deepConsToList(data: Data): ListData {
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

export class Client {
    protected httpAgent: HttpAgent;
    protected httpsAgent: HttpsAgent;

    constructor(protected serverUrl: string, protected playerKey: bigint) {
        this.httpAgent = new HttpAgent();
        this.httpsAgent = new HttpsAgent();
    }

    async sendAliens(data: Data): Promise<Data> {
        console.log(`Sending :`, dataAsJson(data));
        const body = modulate(data);

        try {
            let url = `${this.serverUrl}/aliens/send`;
            if (process.env.hasOwnProperty("ICFPC_API_KEY")) {
                url += `?apiKey=${process.env["ICFPC_API_KEY"]}`;
            }
            const response = await got.post(url, {
                body,
                agent: {
                    http: this.httpAgent,
                    https: this.httpsAgent,
                },
            });
            const result = demodulate(response.body)[0];
            console.log(`Receiving :`, dataAsJson(result));
            return result;
        } catch (e) {
            console.log(`Unexpected server response:\n`, e);
            if (typeof e.response !== 'undefined') {
                console.log(`\nResponse body:`, e.response.body);
            }
            process.exit(1);
        }
    }

    async create(): Promise<GoodCreateResponse> {
        const result = await this.sendAliens(CREATE());

        const listResult = deepConsToList(result);
        const createResponse = decode(CreateResponse, listResult);
        console.log(`Create response: ${createResponse}`);
        if (createResponse[0] !== 1n) {
            throw new Error(`Bad response: ${result}`);
        }

        return createResponse;
    }

    async join(): Promise<Data> {
        return this.sendAliens(JOIN(this.playerKey));
    }

    async start(): Promise<Data> {
        return await this.sendAliens(START(this.playerKey));
    }

    async commands(): Promise<Data> {
        return await this.sendAliens(COMMANDS(this.playerKey));
    }
}