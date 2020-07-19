import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

import got from "got";

import { isRight } from "fp-ts/lib/Either";
import * as t from 'io-ts'

import {Data, demodulate, modulate} from "./modulation";
import {read} from "fs";

function decode<T, D extends t.Any>(decoder: D, t: unknown): t.TypeOf<typeof decoder> {
    const res = decoder.decode(t);
    if (isRight(res)) {
        return res.right;
    }
    // TODO proper message
    throw new Error(`Parsing failed: ${dataAsJson(t)}`);
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

enum GameStageS {
    NotStarted,
    InProgress,
    Finished,
}

function mkGameStageS(a: t.TypeOf<typeof GameStage>): GameStageS {
    switch (a) {
        case 0n:
            return GameStageS.NotStarted;
        case 1n:
            return GameStageS.InProgress;
        case 2n:
            return GameStageS.Finished;
    }
}

const Role = t.union([bigliteral(0n), bigliteral(1n)]);

enum RoleS {
    Attacker,
    Defender,
}

function mkRoleS(a: t.TypeOf<typeof Role>): RoleS {
    switch (a) {
        case 0n:
            return RoleS.Attacker;
        case 1n:
            return RoleS.Defender;
    }
}

const ShipParams = t.tuple([
    bigint,
    bigint,
    bigint,
    bigint,
]);

export type ShipParamsS = readonly [bigint, bigint, bigint, bigint];

const StaticGameInfo = t.tuple([
    t.unknown,
    // role
    Role,
    t.unknown,
    t.unknown,

    // TODO make ShipParams, but beware - can be empty list
    t.unknown,
]);

type StaticGameInfoS = {
    role: RoleS,
}

function StaticGameInfoS(a: t.TypeOf<typeof StaticGameInfo>): StaticGameInfoS {
    return {
        role: mkRoleS(a[1]),
    };
}

const Vec = t.tuple([
    bigint,
    bigint,
]);

export type VecS = readonly [bigint, bigint];

const ShipId = bigint;

type ShipIdS = bigint;

const Ship = t.tuple([
    // role
    Role,
    // shipId
    ShipId,
    // position
    Vec,
    // velocity
    Vec,
    // Looks like ship params, like fuel left
    ShipParams,

    // t.unknown,
    // t.unknown,
    // t.unknown,
]);

type ShipS = {
    role: RoleS,
    id: ShipIdS,
    position: VecS,
    velocity: VecS,
    params: ShipParamsS,
}

function ShipS(a: t.TypeOf<typeof Ship>): ShipS {
    return {
        role: mkRoleS(a[0]),
        id: a[1],
        position: a[2],
        velocity: a[3],
        params: a[4],
    };
}

const AccelCommand = t.tuple([
    bigliteral(0n),
    ShipId,
    Vec,
]);

type AccelCommandS = {
    id: 0n,
    shipId: ShipIdS,
    vec: VecS,
}

export function Accel(shipId: ShipIdS, vec: VecS): AccelCommandS {
    return {
        id: 0n,
        shipId,
        vec,
    }
}

const DetonateCommand = t.tuple([
    bigliteral(1n),
    ShipId,
]);

type DetonateCommandS = {
    id: 1n,
    shipId: ShipIdS,
}

const ShootCommand = t.tuple([
    bigliteral(2n),
    ShipId,
    Vec,

    bigint,
    //t.unknown,
]);

type ShootCommandS = {
    id: 2n,
    shipId: ShipIdS,
    target: VecS,
}

const Command = t.union([
    AccelCommand,
    DetonateCommand,
    ShootCommand,
]);

type Command = t.TypeOf<typeof Command>;

type CommandS = AccelCommandS | DetonateCommandS | ShootCommandS;

function serCommandS(cs: CommandS): Command {
    switch (cs.id) {
        case 0n:
            return [cs.id, cs.shipId, [cs.vec[0],cs.vec[1]]];
        case 1n:
            return [cs.id, cs.shipId];
        case 2n:
            // TODO last param
            return [cs.id, cs.shipId, [cs.target[0],cs.target[1]], 0n];
    }
}

function CommandS(a: Command): CommandS {
    switch (a[0]) {
        case 0n:
            return {
                id: 0n,
                shipId: a[1],
                vec: a[2],
            };
        case 1n:
            return {
                id: 1n,
                shipId: a[1],
            };
        case 2n:
            return {
                id: 2n,
                shipId: a[1],
                target: a[2],
            };
    }
}

const AppliedCommand = t.unknown;

const AppliedCommands = t.array(
    AppliedCommand
);

const ShipsAndCommands = t.array(
    t.tuple([
        // ship
        Ship,
        //appliedCommands
        AppliedCommands
    ])
);

type ShipsAndCommandsS = Array<{
    ship: ShipS,
    commands: Array<unknown>,
}>;

function ShipsAndCommandsS(a: t.TypeOf<typeof ShipsAndCommands>): ShipsAndCommandsS {
    return a.map(i => ({
        ship: ShipS(i[0]),
        commands: i[1],
    }));
}

const GameState = t.tuple([
    // gameTick
    bigint,
    t.unknown,
    // shipsAndCommands
    ShipsAndCommands,
]);

type GameStateS = {
    tick: bigint,
    shipsAndCommands: ShipsAndCommandsS,
}

function GameStateS(a: t.TypeOf<typeof GameState>): GameStateS {
    return {
        tick: a[0],
        shipsAndCommands: ShipsAndCommandsS(a[2]),
    }
}

const JoinGameResponse = t.tuple([
    bigliteral(1n),
    GameStage,
    StaticGameInfo,
    // GameState, // it's empty
]);

const GoodGameResponse = t.tuple([
    bigliteral(1n),
    GameStage,
    StaticGameInfo,
    GameState,
]);

export type GoodGameResponse = t.TypeOf<typeof GoodGameResponse>;

type GoodGameResponseS = {
    stage: GameStageS,
    info: StaticGameInfoS,
    state: GameStateS,
}

function GoodGameResponseS(gr: GoodGameResponse): GoodGameResponseS {
    return {
        stage: mkGameStageS(gr[1]),
        info: StaticGameInfoS(gr[2]),
        state: GameStateS(gr[3]),
    }
}

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

    // В состоянии корабля один из неивестных айтемов тоже всегда содежрит 4 числа, очень похожие на эти
    // Оно же похоже на 5 парамерт в статик инфо
    // Первое в состоянии корабля уменьшается после каждого ускорения
    // И инициализируетяс первым числом тут
    // Похоже на запас топлива
    const x0 = 255n;
    const x1 = 1n;
    const x2 = 1n;
    const x3 = 1n;
    return listToCons([3n, playerKey, listToCons([x0, x1, x2, x3])]);
}

function COMMANDS(playerKey: bigint, cs: Array<CommandS>): Data {
    const commands: Array<Data> = cs.map(serCommandS).map(listToCons);
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

    protected async gameRequest(data: Data, method: string): Promise<GoodGameResponseS> {
        const result = await this.sendAliens(data);

        const listResult = deepConsToList(result);
        // console.log(`${method} raw response: ${dataAsJson(listResult)}`);
        const gameResponse = decode(GameResponse, listResult);
        if (gameResponse[0] !== 1n) {
            throw new Error(`Bad response: ${result}`);
        }

        const r = GoodGameResponseS(gameResponse);
        console.log(`${method} response: ${dataAsJson(r)}`);
        return r;
    }

    async join(): Promise<void> {
        const result = await this.sendAliens(JOIN(this.playerKey));
        // console.log(`JOIN result: ${dataAsJson(result)}`);

        const listResult = deepConsToList(result);
        // console.log(`JOIN raw response: ${dataAsJson(listResult)}`);
        const gameResponse = decode(JoinGameResponse, listResult);
        if (gameResponse[0] !== 1n) {
            throw new Error(`Bad response: ${result}`);
        }

        // TODO JoinGameResponse
    }

    async start(): Promise<GoodGameResponseS> {
        return await this.gameRequest(START(this.playerKey), "START");
    }

    async commands(cs: Array<CommandS>): Promise<GoodGameResponseS> {
        console.log(`commands request: ${dataAsJson(cs)}`);
        return await this.gameRequest(COMMANDS(this.playerKey, cs), "COMMANDS");
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
    decode(StaticGameInfo, [256n, 0n, [512n, 1n, 64n], [16n, 128n], [1n, 1n, 1n, 1n]]);
}

function test_parse_vec() {
    decode(Vec, [0n, 0n]);
    decode(Vec, [1n, -17n]);
}

const s = [0n, 17n, [0n, 1n], [2n, 3n], [1n,1n,1n,1n,], -1n, -1n];

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
    // TODO it's join response with empty state
    // decode(GameState, []);

    decode(GameState, [1n, [16n, 128n], [[[1n, 0n, [-34n, -48n], [-1n, 0n], [0n, 1n, 1n, 1n], 7n, 64n, 1n], [[0n, [1n, 1n]]]], [[0n, 1n, [32n, 46n], [-1n, -2n], [0n, 1n, 1n, 1n], 7n, 64n, 1n], [[0n, [1n, 1n]]]]]]);
}

function test_parse_join_response() {
    decode(JoinGameResponse,
        [1n, 0n, [256n, 1n, [448n, 1n, 64n], [16n, 128n], []], []]
    );
}

function test_parse_game_response() {
    // TODO it's join response with empty state
    // decode(GoodGameResponse, [
    //     1n, // flag
    //     0n, // stage
    //     [ 256n, 1n, [ 448n, 1n, 64n ], [ 16n, 128n ], [] ], // static info
    //     [], // state
    // ]);

    decode(GoodGameResponse,
    [
            1n,
            1n,
            [256n, 0n, [512n, 1n, 64n], [16n, 128n], [1n, 1n, 1n, 1n]],
            [1n, [16n, 128n], [[[1n, 0n, [-34n, -48n], [-1n, 0n], [0n, 1n, 1n, 1n], 7n, 64n, 1n], [[0n, [1n, 1n]]]], [[0n, 1n, [32n, 46n], [-1n, -2n], [0n, 1n, 1n, 1n], 7n, 64n, 1n], [[0n, [1n, 1n]]]]]]
        ]
    );
    decode(
        GoodGameResponse,
        [
            1n,
            1n,
            [256n, 1n, [448n, 1n, 64n], [16n, 128n], []],
            [0n, [16n, 128n], [[[1n, 0n, [-48n, -23n], [0n, 0n], [255n, 1n, 1n, 1n], 0n, 64n, 1n], []], [[0n, 1n, [48n, 23n], [0n, 0n], [255n, 1n, 1n, 1n], 0n, 64n, 1n], []]]]]
    );
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
    test_parse_join_response();
    test_parse_game_response();
}

test();
