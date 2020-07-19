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
            const myShips = state.shipsAndCommands
                .filter(scs => scs.ship.role === role)
                .map(scs => scs.ship.id);

            const accels = myShips.map(id => {
                const ship = state.shipsAndCommands.find(sc => sc.ship.id === id)!.ship;
                const pos = ship.position;
                const tangent: VecS = [pos[1], -pos[0]];
                const dist = norm(pos);

                let thrust = tangent;
                if (dist < 40n) {
                    const amp = (40n - dist);
                    const dir = neg(pos);
                    thrust = add(thrust, mul(dir, amp))
                }

                return Accel(id, thrust);
            });


            const resp = await this.client.commands([
                ...accels
            ]);

            state = resp.state;
        }
    }
}
