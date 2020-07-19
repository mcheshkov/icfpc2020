import {Accel, Client, VecS} from "./client";

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

function simulateGrav(startPos: VecS, startVel: VecS, accs: Array<VecS>, steps:number, cb: (pos: VecS) => void) {
    let pos = startPos;
    let vel = startVel;

    for (let i=0; i<steps; i++) {
        let totalAcc: VecS = [0n,0n];
        totalAcc = add(totalAcc, grav(pos));
        if (accs.length > 0) {
            let [acc, ...tail] = accs;
            totalAcc = add(totalAcc, acc);
            accs = tail;
        }
        vel = add(vel, totalAcc);
        pos = add(pos, vel);

        cb(pos);
    }
}

function willHit(startPos: VecS, startVel: VecS, steps:number): boolean {
    let result = false;
    simulateGrav(startPos, startVel, [], steps, pos => result = result || (norm(pos) < 16));
    return result;
}

export class Bot {
    protected client: Client;

    constructor(serverUrl: string, playerKey: bigint) {
        this.client = new Client(serverUrl, playerKey);
    }

    async run() {
        await this.client.join();
        const startResp = await this.client.start();

        const role = startResp.info.role;
        let state = startResp.state;

        for (let i=0; i<256; i++) {
            console.log("tick", state.tick);

            const myShips = state.shipsAndCommands
                .filter(scs => scs.ship.role === role)
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
                    if (state.tick < 8) {
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
                    } else if (willHit(ship.position, ship.velocity, 4)) {
                        // Это не работает - ускорители не могут преодолеть гравитацию, и скорость не уменьшается, надо искать другой манёвр
                        const g = grav(ship.position);
                        thrust = g; // point thruster to gravity direction
                    }
                }

                function standStill() {
                    // Получается очень дорого - чем дальше тем больше "топлива" тратится на каждое ускорение
                    const g = grav(ship.position);
                    thrust = g; // point thruster to gravity direction
                }

                //orbit();
                standStill();

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


            const resp = await this.client.commands([
                ...accels
            ]);

            state = resp.state;
        }
    }
}
