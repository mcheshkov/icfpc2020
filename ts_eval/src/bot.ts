import {Accel, Client, Clone, GameStageS, Shoot, VecS} from "./client";

function abs(a:bigint): bigint {
    return a<0 ? -1n*a : a;
}
function max(a:bigint, b:bigint): bigint {
    return a>b ? a : b;
}
function norm(a:VecS): bigint {
    return max(abs(a[0]), abs(a[1]));
}
function copy(a:VecS) : VecS {
    return [a[0], a[1]];
}
function add(a:VecS, b:VecS) : VecS {
    return [a[0]+b[0], a[1]+b[1]];
}
function mul(a:VecS, b:bigint) : VecS {
    return [a[0]*b, a[1]*b];
}
function div(a:VecS, b:bigint) : VecS {
    return [a[0]/b, a[1]/b];
}
function neg(a:VecS) : VecS {
    return [-a[0], -a[1]];
}
function clamp(a:bigint, l:bigint, r:bigint): bigint {
    return a < l ? l : a > r ? r : a;
}
function sign(a:bigint): bigint {
    return a < 0n ? -1n : a > 0n ? 1n : 0n;
}

function grav(pos: VecS): VecS {
    if (abs(pos[0]) > abs(pos[1])) {
        // gravity now works on X
        // will accel ship by [+-1, 0]
        return [
            -1n*sign(pos[0]),
            0n,
        ];
    } else if (abs(pos[0]) < abs(pos[1])) {
        // gravity now works on Y
        // will accel ship by [0, +-1]
        return [
            0n,
            -1n*sign(pos[1]),
        ];
    } else {
        // gravity now works on both
        // will accel ship by [+-1, +-1]
        return [
            -1n*sign(pos[0]),
            -1n*sign(pos[1]),
        ];
    }
}

function simulateStep(pos: VecS, vel: VecS, acc: VecS): {pos:VecS, vel:VecS} {
    let totalAcc: VecS = [0n,0n];
    totalAcc = add(totalAcc, grav(pos));
    totalAcc = add(totalAcc, acc);
    vel = add(vel, totalAcc);
    pos = add(pos, vel);

    return {
        pos, vel
    };
}

function simulateGrav(startPos: VecS, startVel: VecS, accs: Array<VecS>, steps:number, cb: (pos: VecS) => void) {
    let pos = startPos;
    let vel = startVel;

    for (let i=0; i<steps; i++) {
        let acc: VecS;
        if (accs.length > 0) {
            acc = accs[0];
            accs.shift();
        } else {
            acc = [0n,0n]
        }

        let res = simulateStep(pos, vel, acc);
        pos = res.pos;
        vel = res.vel;
        cb(pos);
    }
}

function hitThePlanet(pos: VecS) {
    return norm(pos) < 16;
}

function hitTheBounds(pos: VecS) {
    return norm(pos) > 128;
}

function willHit(startPos: VecS, startVel: VecS, steps:number): boolean {
    let result = false;
    simulateGrav(startPos, startVel, [], steps, pos => result = result || hitThePlanet(pos) || hitTheBounds(pos));
    return result;
}

export class Bot {
    protected client: Client;

    constructor(serverUrl: string, playerKey: bigint) {
        this.client = new Client(serverUrl, playerKey);
    }

    async run() {
        await this.client.join();

        // В состоянии корабля один из неивестных айтемов тоже всегда содежрит 4 числа, очень похожие на эти
        // Оно же похоже на 5 парамерт в статик инфо
        // Первое в состоянии корабля уменьшается после каждого ускорения
        // И инициализируетяс x0 тут
        // Похоже на запас топлива

        // Значения скопировал из игры с оппонентом
        const x0 = 82n;
        const x1 = 50n;
        const x2 = 5n;
        const x3 = 2n;

        const startResp = await this.client.start([x0,x1,x2,x3]);

        let stage = startResp.stage;
        const role = startResp.info.role;
        let state = startResp.state;

        for (let i=0; i<256; i++) {
            console.time("tick");
            console.log("tick", state.tick);

            if (stage !== GameStageS.InProgress) {
                return;
            }

            const myShips = state.shipsAndCommands
                .filter(scs => scs.ship.role === role)
                .map(scs => scs.ship.id);

            const enemyShips = state.shipsAndCommands
                .filter(scs => scs.ship.role !== role)
                .map(scs => scs.ship.id);

            // Хочу выйти на орбиту и крутится
            // похоже гравитация действует только вдоль одной оси - той, вдоль которой расстояние БОЛЬШЕ, типа бесконечная (кубическая) норма
            // в ускорение можно передатьва ТОЛЬКО +-1

            const accels = myShips.map(id => {
                const ship = state.shipsAndCommands.find(sc => sc.ship.id === id)!.ship;
                const pos = ship.position;
                const tangent: VecS = [pos[1], -pos[0]];
                const dist = norm(pos);
                const vel = norm(ship.velocity);

                if (vel > 7) {
                    return Accel(id, [0n, 0n]);
                }

                let thrust = tangent;

                function orbit() {
                    const HIT_DEPTH = 128;
                    const SEARCH_DEPTH = 4;

                    if (state.tick < 6) {
                        if (abs(pos[0]) > abs(pos[1])) {
                            // gravity now works on X
                            // will accel ship by [+-1, 0]
                            thrust = [
                                -1n*sign(pos[0]), // fight gravity
                                sign(pos[1]), // slide on loger arc
                            ];
                        } else if (abs(pos[0]) < abs(pos[1])) {
                            // gravity now works on Y
                            // will accel ship by [0, +-1]
                            thrust = [
                                sign(pos[0]), // slide on loger arc
                                -1n*sign(pos[1]), // fight gravity
                            ];
                        } else {
                            // gravity now works on both
                            // will accel ship by [+-1, +-1]
                            thrust = [
                                -1n*sign(pos[0]), // fight gravity
                                -1n*sign(pos[1]), // fight gravity
                            ]
                        }
                    } else if (willHit(ship.position, ship.velocity, HIT_DEPTH)) {
                        function* eachAcc() {
                            const deltas = [-1n,0n,1n];
                            for (const ax of deltas) {
                                for (const ay of deltas) {
                                    const acc: VecS = [ax, ay]
                                    yield acc;
                                }
                            }
                        }
                        function searchInner(pos: VecS, vel: VecS, n: number): Array<VecS> {
                            if (n === 0) {
                                return [];
                            }

                            for (const acc of eachAcc()) {
                                const res = simulateStep(pos, vel, acc);
                                if (! willHit(res.pos, res.vel, HIT_DEPTH)) {
                                    return [acc];
                                }

                                const deeper = searchInner(res.pos, res.vel, n-1);

                                if (deeper.length > 0) {
                                    return [acc, ...deeper];
                                }
                            }

                            return [];
                        }
                        function search(): Array<VecS> {
                            return searchInner(ship.position, ship.velocity, SEARCH_DEPTH);
                        }

                        const searchResult = search();
                        console.log("SEARCH RESULT", searchResult);
                        if (searchResult.length > 0) {
                            thrust = neg(searchResult[0]);
                        } else {
                            // Это не работает - ускорители не могут преодолеть гравитацию, и скорость не уменьшается, надо искать другой манёвр
                            const g = grav(ship.position);
                            thrust = g; // point thruster to gravity direction
                        }
                    }
                }

                function standStill() {
                    // Получается очень дорого - чем дальше тем больше "топлива" тратится на каждое ускорение
                    const g = grav(ship.position);
                    thrust = g; // point thruster to gravity direction
                }

                orbit();
                // standStill();

                // if (vel > 7) {
                //     thrust = [0n, 1n];
                // }
                //
                // thrust = ship.velocity;
                // thrust = [
                //     clamp(ship.velocity[0], -1n, 1n),
                //     clamp(ship.velocity[1], -1n, 1n),
                // ]
                return Accel(id, thrust);
            });

            const shoots = enemyShips.length === 0 ? [] : myShips.map(id => {
                const ship = state.shipsAndCommands.find(sc => sc.ship.id === id)!.ship;

                const enemy = enemyShips[0];
                const enemyShip = state.shipsAndCommands.find(sc => sc.ship.id === enemy)!.ship;

                let target = enemyShip.position;
                simulateGrav(enemyShip.position, enemyShip.velocity, [], 1, pos => target = pos);

                const maxPower = ship.maxTemperature - ship.temperature;
                let targetPower = maxPower * 2n/3n;
                if (targetPower < 10n) {
                    targetPower = 0n;
                }

                return Shoot(id, target, targetPower);
            });

            const clones = state.tick < 10 ? [] : myShips
                .map(id => state.shipsAndCommands.find(sc => sc.ship.id === id)!.ship)
                .filter(ship => ship.params[3] > 1)
                .map(ship => Clone(ship.id, [0n,0n,0n,1n]));


            const resp = await this.client.commands([
                ...accels,
                ...shoots,
                ...clones,
            ]);

            state = resp.state;
            stage = resp.stage;

            console.timeEnd("tick");
        }
    }
}
