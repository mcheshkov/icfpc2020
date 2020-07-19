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

                if (state.tick < 8 ) {
                    if (abs(pos[0]) > abs(pos[1])) {
                        // gravity now works on X
                        thrust = [
                            0n,
                            -1n*sign(pos[1])
                        ]
                    } else if (abs(pos[0]) > abs(pos[1])) {
                        // gravity now works on Y
                        thrust = [
                            -1n*sign(pos[0]),
                            0n,
                        ]
                    } else {
                        // gravity now works on both
                        thrust = [
                            -1n*sign(pos[0]),
                            -1n*sign(pos[1]),
                        ]
                    }
                }

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
