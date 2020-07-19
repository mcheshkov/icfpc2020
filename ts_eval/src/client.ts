import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

import got from "got";

import { isRight } from "fp-ts/lib/Either";
import * as t from 'io-ts'

import {Data, demodulate, modulate} from "./modulation";

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

const CreateResponse = t.union([ GoodCreateResponse, BadResponse ]);

const GameStage = t.union([
    bigliteral(0n),
    bigliteral(1n),
    bigliteral(2n),
]);

const Role = t.union([bigliteral(0n), bigliteral(1n)]);

const StaticGameInfo = t.tuple([
    t.unknown,
    // role
    Role,
    t.unknown,
    t.unknown,
    t.unknown,
]);

const Vec = t.tuple([
    bigint,
    bigint,
]);

const ShipId = bigint;

const Ship = t.tuple([
    // role
    Role,
    // shipId
    ShipId,
    // // position
    Vec,
    // velocity
    Vec,
    t.unknown,
    t.unknown,
    t.unknown,
    t.unknown,
]);

const AccelCommand = t.tuple([
    bigliteral(0n),
    ShipId,
    Vec,
]);

const DetonateCommand = t.tuple([
    bigliteral(1n),
    ShipId,
]);

const ShootCommand = t.tuple([
    bigliteral(2n),
    ShipId,
    Vec,
    t.unknown,
]);

const Command = t.union([
    AccelCommand,
    DetonateCommand,
    ShootCommand,
]);

const AppliedCommands = t.array(
    Command
);

const ShipsAndCommands = t.array(
    t.tuple([
        // ship
        Ship,
        //appliedCommands
        AppliedCommands
    ])
);

const EmptyGameState = t.tuple([]);

const FilledGameState = t.tuple([
    // gameTick
    bigint,
    t.unknown,
    // shipsAndCommands
    ShipsAndCommands,
]);

const GameState = t.union([
    EmptyGameState,
    FilledGameState,
]);

const GoodGameResponse = t.tuple([
    bigliteral(1n),
    GameStage,
    StaticGameInfo,
    GameState,
]);

export type GoodGameResponse = t.TypeOf<typeof GoodGameResponse>;

const GameResponse = t.union([ GoodGameResponse, BadResponse ]);

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

function dataAsJson(data: unknown) {
    return JSON.stringify(data, (k, v) => typeof v === "bigint" ? v.toString() : v);
}

type ListData = Array<ListData> | [bigint,bigint] | bigint;

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
        if (typeof head === "bigint") {
            // vector - pair of two ints
            return [head, tailList];
        }
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
        // console.log(`Sending :`, dataAsJson(data));
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
            // console.log(`Receiving :`, dataAsJson(result));
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
        console.log(`Create response: ${dataAsJson(createResponse)}`);
        if (createResponse[0] !== 1n) {
            throw new Error(`Bad response: ${result}`);
        }

        return createResponse;
    }

    protected async gameRequest(data: Data, method: string): Promise<GoodGameResponse> {
        const result = await this.sendAliens(data);

        const listResult = deepConsToList(result);
        console.log("listResult", method, listResult);
        const gameResponse = decode(GameResponse, listResult);
        console.log(`${method} response: ${dataAsJson(gameResponse)}`);
        if (gameResponse[0] !== 1n) {
            throw new Error(`Bad response: ${result}`);
        }

        return gameResponse;
    }

    async join(): Promise<GoodGameResponse> {
        return this.gameRequest(JOIN(this.playerKey), "JOIN");
    }

    async start(): Promise<GoodGameResponse> {
        return await this.gameRequest(START(this.playerKey), "START");
    }

    async commands(): Promise<GoodGameResponse> {
        return await this.gameRequest(COMMANDS(this.playerKey), "COMMANDS");
    }
}

function test_parse_bigint() {
    decode(bigint, 0n);
    decode(bigint, 1n);
    decode(bigint, -17n);
}

function test_parse_stage() {
    decode(GameStage, 0n);
}

function test_parse_static_info() {
    decode(StaticGameInfo, [ 256n, 1n, [ 448n, 1n, 64n ], [ 16n, 128n ], [] ]);
}

function test_parse_vec() {
    decode(Vec, [0n, 0n]);
    decode(Vec, [1n, -17n]);
}

const s = [0n, 17n, [0n, 1n], [2n, 3n], -1n, -1n, -1n];

function test_parse_ship() {
    decode(Ship, s);
}

const c1 = [0n, 17n, [5n,6n]];
const c2 = [1n, 17n];
const c3 = [2n, 17n, [5n,6n], -1n];
const cs = [c1,c2,c3];

function test_parse_command() {
    decode(Command, c1);
    decode(Command, c2);
    decode(Command, c3);

    decode(AppliedCommands, cs);
}

const scs = [
    [s, cs]
]


function test_parse_ships_and_commands(){
    decode(ShipsAndCommands, scs);
}

const gs = [123456789n, -1n, scs];

function test_parse_gamestate() {
    decode(GameState, gs);
    decode(GameState, []);
}

function test_parse_game_response() {
    decode(GoodGameResponse, [
        1n, // flag
        0n, // stage
        [ 256n, 1n, [ 448n, 1n, 64n ], [ 16n, 128n ], [] ], // static info
        [], // state
    ]);
}

function test() {
    test_parse_bigint();
    test_parse_stage();
    test_parse_static_info();
    test_parse_vec();
    test_parse_ship();
    test_parse_command();
    test_parse_ships_and_commands();
    test_parse_gamestate();
    test_parse_game_response();
}

test();
