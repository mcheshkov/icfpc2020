import {Accel, Client, Clone, GameStageS, Shoot, VecS, CommandS} from "./client";

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
    return norm(pos) <= 16;
}

function hitTheBounds(pos: VecS) {
    return norm(pos) >= 128;
}

function willHit(startPos: VecS, startVel: VecS, steps:number): boolean {
    let result = hitThePlanet(startPos) || hitTheBounds(startPos);
    simulateGrav(startPos, startVel, [], steps, pos => result = result || hitThePlanet(pos) || hitTheBounds(pos));
    return result;
}
const HIT_DEPTH = 400;

function* eachAcc() {
    const deltas = [-1n,1n,0n];
    for (const ax of deltas) {
        for (const ay of deltas) {
            const acc: VecS = [ax, ay]
            yield acc;
        }
    }
}
export function searchInner(pos: VecS, vel: VecS, n: number, earlyExit=true): Array<VecS> | null {
    if (n === 0) {
        return null;
    }

    if (hitThePlanet(pos) || hitTheBounds(pos)) {
        return null;
    }

    if (earlyExit && !willHit(pos, vel, HIT_DEPTH)) {
        return [];
    }

    for (const acc of eachAcc()) {
        const res = simulateStep(pos, vel, acc);
        const actions = searchInner(res.pos, res.vel, n - 1, earlyExit);
        if (actions !== null) {
            return [acc, ...actions];
        }
    }

    return null;
}

const precalcedActions: Record<string, Array<VecS>> = {
    '0_48': [ [ -1n, 1n ], [ -1n, 0n ] ],
    '0_-48': [ [ -1n, -1n ], [ -1n, 0n ] ],
    '48_0': [ [ 1n, -1n ], [ 0n, -1n ] ],
    '-48_0': [ [ -1n, -1n ], [ 0n, -1n ] ],
    '1_48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '1_-48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 0n ] ],
    '-1_48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-1_-48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '48_1': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '-48_1': [ [ -1n, -1n ], [ -1n, -1n ], [ 0n, -1n ] ],
    '48_-1': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '-48_-1': [ [ -1n, -1n ], [ -1n, -1n ], [ 1n, -1n ] ],
    '2_48': [ [ -1n, 1n ], [ -1n, 1n ] ],
    '2_-48': [ [ -1n, -1n ], [ -1n, -1n ] ],
    '-2_48': [ [ -1n, -1n ], [ -1n, 1n ] ],
    '-2_-48': [ [ -1n, -1n ], [ -1n, 1n ] ],
    '48_2': [ [ -1n, 1n ], [ 1n, 1n ] ],
    '-48_2': [ [ -1n, -1n ], [ -1n, -1n ] ],
    '48_-2': [ [ -1n, -1n ], [ 1n, -1n ] ],
    '-48_-2': [ [ -1n, -1n ], [ 1n, -1n ] ],
    '3_48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '3_-48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-3_48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-3_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '48_3': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '-48_3': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '48_-3': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '-48_-3': [ [ -1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '4_48': [ [ 1n, -1n ], [ 1n, 0n ] ],
    '4_-48': [ [ 1n, 1n ], [ 1n, 0n ] ],
    '-4_48': [ [ -1n, -1n ], [ -1n, 0n ] ],
    '-4_-48': [ [ -1n, 1n ], [ -1n, 0n ] ],
    '48_4': [ [ -1n, 1n ], [ 0n, 1n ] ],
    '-48_4': [ [ 1n, 1n ], [ 0n, 1n ] ],
    '48_-4': [ [ -1n, -1n ], [ 0n, -1n ] ],
    '-48_-4': [ [ 1n, -1n ], [ 0n, -1n ] ],
    '5_48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '5_-48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-5_48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-5_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '48_5': [ [ -1n, 1n ], [ -1n, 0n ], [ 1n, 1n ] ],
    '-48_5': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '48_-5': [ [ -1n, -1n ], [ -1n, 0n ], [ 1n, -1n ] ],
    '-48_-5': [ [ -1n, -1n ], [ 1n, -1n ], [ 0n, -1n ] ],
    '6_48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '6_-48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-6_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-6_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_6': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_6': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '48_-6': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 0n ] ],
    '-48_-6': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '7_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '7_-48': [ [ 1n, -1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-7_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-7_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_7': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_7': [ [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-7': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 0n ] ],
    '-48_-7': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '8_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '8_-48': [ [ 1n, -1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-8_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-8_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_8': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_8': [ [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-8': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 0n ] ],
    '-48_-8': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '9_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '9_-48': [ [ 1n, -1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-9_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-9_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_9': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_9': [ [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-9': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 0n ] ],
    '-48_-9': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '10_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '10_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-10_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-10_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_10': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_10': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-10': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-10': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '11_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '11_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-11_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-11_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_11': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_11': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-11': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-11': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '12_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '12_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-12_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-12_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_12': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_12': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-12': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-12': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '13_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '13_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-13_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-13_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_13': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_13': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-13': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-13': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '14_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '14_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-14_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-14_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_14': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_14': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-14': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-14': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '15_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '15_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-15_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-15_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_15': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_15': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-15': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-15': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '16_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '16_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-16_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-16_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_16': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_16': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-16': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-16': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '17_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '17_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-17_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-17_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_17': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_17': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-17': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-17': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '18_48': [ [ 1n, 0n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '18_-48': [ [ 1n, 0n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-18_48': [ [ -1n, 0n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-18_-48': [ [ -1n, 0n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_18': [ [ 0n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_18': [ [ 0n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-18': [ [ 0n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-18': [ [ 0n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '19_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '19_-48': [ [ 1n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '-19_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-19_-48': [ [ -1n, 1n ], [ -1n, -1n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '48_19': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_19': [ [ 1n, 1n ], [ -1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '48_-19': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-19': [ [ 1n, -1n ], [ -1n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '20_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '20_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '-20_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-20_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '48_20': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_20': [ [ 1n, 1n ], [ 1n, 1n ], [ -1n, 1n ], [ 1n, 1n ] ],
    '48_-20': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-20': [ [ 1n, -1n ], [ 1n, -1n ], [ -1n, -1n ], [ 1n, -1n ] ],
    '21_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '21_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '-21_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-21_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '48_21': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_21': [ [ 1n, 1n ], [ 1n, 1n ], [ -1n, 1n ], [ 1n, 1n ] ],
    '48_-21': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-21': [ [ 1n, -1n ], [ 1n, -1n ], [ -1n, -1n ], [ 1n, -1n ] ],
    '22_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '22_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-22_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-22_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_22': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_22': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-22': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-22': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '23_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '23_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, -1n ] ],
    '-23_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-23_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '48_23': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_23': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ -1n, 1n ] ],
    '48_-23': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-23': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '24_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '24_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-24_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-24_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_24': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_24': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-24': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-24': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '25_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '25_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-25_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-25_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_25': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_25': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-25': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-25': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '26_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '26_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-26_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-26_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_26': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_26': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-26': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-26': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '27_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '27_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-27_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-27_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_27': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_27': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-27': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-27': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '28_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '28_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-28_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-28_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_28': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_28': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-28': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-28': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '29_48': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '29_-48': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-29_48': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-29_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_29': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_29': [ [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-29': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-29': [ [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '30_48': [ [ -1n, -1n ], [ 1n, -1n ], [ -1n, -1n ], [ 1n, -1n ], [ 0n, -1n ] ],
    '30_-48': [ [ -1n, 1n ], [ 1n, 1n ], [ -1n, 1n ], [ 1n, 1n ], [ 0n, 1n ] ],
    '-30_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ]
    ],
    '-30_-48': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '48_30': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_30': [ [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '48_-30': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ]
    ],
    '-48_-30': [ [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '31_48': [ [ -1n, -1n ], [ 1n, -1n ], [ -1n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '31_-48': [ [ -1n, 1n ], [ 1n, 1n ], [ -1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '-31_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 0n ]
    ],
    '-31_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_31': [ [ -1n, -1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '-48_31': [ [ 1n, -1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '48_-31': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, -1n ]
    ],
    '-48_-31': [ [ 1n, -1n ], [ -1n, 0n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '32_48': [ [ -1n, -1n ], [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ], [ 0n, -1n ] ],
    '32_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ], [ 0n, 1n ] ],
    '-32_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 0n ]
    ],
    '-32_-48': [ [ -1n, -1n ], [ -1n, 0n ], [ 0n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_32': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 0n ] ],
    '-48_32': [ [ -1n, 1n ], [ 0n, 1n ], [ 1n, 0n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '48_-32': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, -1n ]
    ],
    '-48_-32': [ [ -1n, -1n ], [ 0n, -1n ], [ 1n, 0n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '33_48': [ [ -1n, -1n ], [ -1n, -1n ], [ 1n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '33_-48': [ [ -1n, 1n ], [ -1n, 1n ], [ 1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '-33_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ]
    ],
    '-33_-48': [ [ -1n, -1n ], [ -1n, 0n ], [ 1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '48_33': [ [ -1n, -1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '-48_33': [ [ -1n, 1n ], [ 0n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, -1n ] ],
    '48_-33': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ]
    ],
    '-48_-33': [ [ -1n, -1n ], [ 0n, -1n ], [ 1n, 1n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '34_48': [ [ 1n, 0n ], [ 1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '34_-48': [ [ 1n, 0n ], [ 1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-34_48': [ [ -1n, 0n ], [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '-34_-48': [ [ -1n, 0n ], [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_34': [ [ 0n, 1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_34': [ [ 0n, 1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '48_-34': [ [ 0n, -1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_-34': [ [ 0n, -1n ], [ 1n, -1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '35_48': [ [ 1n, 0n ], [ 0n, -1n ], [ 0n, -1n ], [ -1n, -1n ] ],
    '35_-48': [ [ 1n, 0n ], [ 0n, 1n ], [ 0n, 1n ], [ -1n, 1n ] ],
    '-35_48': [ [ -1n, 0n ], [ 0n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '-35_-48': [ [ -1n, 0n ], [ 0n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '48_35': [ [ 0n, 1n ], [ -1n, 0n ], [ -1n, 0n ], [ -1n, -1n ] ],
    '-48_35': [ [ 0n, 1n ], [ 1n, 0n ], [ 1n, 0n ], [ 1n, -1n ] ],
    '48_-35': [ [ 0n, -1n ], [ -1n, 0n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '-48_-35': [ [ 0n, -1n ], [ 1n, 0n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '36_48': [ [ 1n, 0n ], [ -1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '36_-48': [ [ 1n, 0n ], [ -1n, 1n ], [ 1n, 1n ], [ -1n, 1n ] ],
    '-36_48': [ [ -1n, 0n ], [ 1n, -1n ], [ -1n, -1n ], [ 1n, -1n ] ],
    '-36_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ -1n, 1n ], [ 1n, 1n ] ],
    '48_36': [ [ 0n, 1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '-48_36': [ [ 0n, 1n ], [ 1n, -1n ], [ 1n, 1n ], [ 1n, -1n ] ],
    '48_-36': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-48_-36': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '37_48': [ [ 1n, 0n ], [ -1n, -1n ], [ 0n, -1n ], [ 0n, -1n ] ],
    '37_-48': [ [ 1n, 0n ], [ -1n, 1n ], [ 0n, 1n ], [ 0n, 1n ] ],
    '-37_48': [ [ -1n, 0n ], [ 1n, -1n ], [ 0n, -1n ], [ 0n, -1n ] ],
    '-37_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ 0n, 1n ], [ 0n, 1n ] ],
    '48_37': [ [ 0n, 1n ], [ -1n, -1n ], [ -1n, 0n ], [ -1n, 0n ] ],
    '-48_37': [ [ 0n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, 0n ] ],
    '48_-37': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, 0n ], [ -1n, 0n ] ],
    '-48_-37': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, 0n ], [ 1n, 0n ] ],
    '38_48': [ [ -1n, 0n ], [ 1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '38_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ 1n, 1n ], [ -1n, 1n ] ],
    '-38_48': [ [ -1n, 0n ], [ 1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '-38_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ 1n, 1n ], [ -1n, 1n ] ],
    '48_38': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '-48_38': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, -1n ] ],
    '48_-38': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '-48_-38': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, 1n ], [ 1n, -1n ] ],
    '39_48': [ [ -1n, 0n ], [ 1n, -1n ], [ 0n, -1n ], [ 0n, -1n ] ],
    '39_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ 0n, 1n ], [ 0n, 1n ] ],
    '-39_48': [ [ 1n, 0n ], [ -1n, -1n ], [ 0n, -1n ], [ 0n, -1n ] ],
    '-39_-48': [ [ 1n, 0n ], [ -1n, 1n ], [ 0n, 1n ], [ 0n, 1n ] ],
    '48_39': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, 0n ], [ -1n, 0n ] ],
    '-48_39': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, 0n ], [ 1n, 0n ] ],
    '48_-39': [ [ 0n, 1n ], [ -1n, -1n ], [ -1n, 0n ], [ -1n, 0n ] ],
    '-48_-39': [ [ 0n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, 0n ] ],
    '40_48': [ [ -1n, 0n ], [ 1n, -1n ], [ -1n, -1n ], [ 1n, -1n ] ],
    '40_-48': [ [ -1n, 0n ], [ 1n, 1n ], [ -1n, 1n ], [ 1n, 1n ] ],
    '-40_48': [ [ 1n, 0n ], [ -1n, -1n ], [ 1n, -1n ], [ -1n, -1n ] ],
    '-40_-48': [ [ 1n, 0n ], [ -1n, 1n ], [ 1n, 1n ], [ -1n, 1n ] ],
    '48_40': [ [ 0n, -1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, 1n ] ],
    '-48_40': [ [ 0n, -1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, 1n ] ],
    '48_-40': [ [ 0n, 1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, -1n ] ],
    '-48_-40': [ [ 0n, 1n ], [ 1n, -1n ], [ 1n, 1n ], [ 1n, -1n ] ],
    '41_48': [ [ -1n, 0n ], [ 0n, -1n ], [ 0n, -1n ], [ 1n, -1n ] ],
    '41_-48': [ [ -1n, 0n ], [ 0n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '-41_48': [ [ 1n, 0n ], [ 0n, -1n ], [ 0n, -1n ], [ -1n, -1n ] ],
    '-41_-48': [ [ 1n, 0n ], [ 0n, 1n ], [ 0n, 1n ], [ -1n, 1n ] ],
    '48_41': [ [ 0n, -1n ], [ -1n, 0n ], [ -1n, 0n ], [ -1n, 1n ] ],
    '-48_41': [ [ 0n, -1n ], [ 1n, 0n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '48_-41': [ [ 0n, 1n ], [ -1n, 0n ], [ -1n, 0n ], [ -1n, -1n ] ],
    '-48_-41': [ [ 0n, 1n ], [ 1n, 0n ], [ 1n, 0n ], [ 1n, -1n ] ],
    '42_48': [ [ -1n, 0n ], [ -1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '42_-48': [ [ -1n, 0n ], [ -1n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-42_48': [ [ 1n, 0n ], [ 1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-42_-48': [ [ 1n, 0n ], [ 1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_42': [ [ 0n, -1n ], [ -1n, -1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_42': [ [ 0n, -1n ], [ 1n, -1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-42': [ [ 0n, 1n ], [ -1n, 1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-42': [ [ 0n, 1n ], [ 1n, 1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '43_48': [ [ -1n, -1n ], [ -1n, 0n ], [ 1n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '43_-48': [ [ -1n, -1n ], [ -1n, 0n ], [ 1n, 1n ], [ 0n, 1n ], [ 1n, 1n ] ],
    '-43_48': [ [ 1n, -1n ], [ 1n, 0n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-43_-48': [ [ 1n, -1n ], [ 1n, 0n ], [ -1n, 1n ], [ 0n, 1n ], [ -1n, 1n ] ],
    '48_43': [ [ -1n, -1n ], [ 0n, -1n ], [ -1n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_43': [ [ -1n, -1n ], [ 0n, -1n ], [ 1n, 1n ], [ 1n, 0n ], [ 1n, 1n ] ],
    '48_-43': [ [ -1n, 1n ], [ 0n, 1n ], [ -1n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-43': [ [ -1n, 1n ], [ 0n, 1n ], [ 1n, -1n ], [ 1n, 0n ], [ 1n, -1n ] ],
    '44_48': [ [ -1n, 1n ], [ -1n, 0n ], [ 0n, -1n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '44_-48': [ [ -1n, -1n ], [ -1n, 0n ], [ 0n, 1n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '-44_48': [ [ 1n, 1n ], [ 1n, 0n ], [ 0n, -1n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-44_-48': [ [ 1n, -1n ], [ 1n, 0n ], [ 0n, 1n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '48_44': [ [ 1n, -1n ], [ 0n, -1n ], [ -1n, 0n ], [ -1n, 1n ], [ -1n, 1n ] ],
    '-48_44': [ [ -1n, -1n ], [ 0n, -1n ], [ 1n, 0n ], [ 1n, 1n ], [ 1n, 1n ] ],
    '48_-44': [ [ 1n, 1n ], [ 0n, 1n ], [ -1n, 0n ], [ -1n, -1n ], [ -1n, -1n ] ],
    '-48_-44': [ [ -1n, 1n ], [ 0n, 1n ], [ 1n, 0n ], [ 1n, -1n ], [ 1n, -1n ] ],
    '45_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ 0n, -1n ],
        [ 1n, -1n ]
    ],
    '45_-48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, 0n ],
        [ -1n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-45_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ -1n, -1n ]
    ],
    '-45_-48': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ],
        [ -1n, 1n ]
    ],
    '48_45': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, 0n ],
        [ -1n, 1n ]
    ],
    '-48_45': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, 1n ],
        [ 1n, -1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '48_-45': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, -1n ]
    ],
    '-48_-45': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 0n, -1n ],
        [ 1n, 1n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '46_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ 1n, 0n ],
        [ 1n, -1n ]
    ],
    '46_-48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, 0n ],
        [ 0n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-46_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, 1n ],
        [ 1n, 0n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-46_-48': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 1n, -1n ],
        [ 1n, 0n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '48_46': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 0n, 1n ],
        [ -1n, 1n ]
    ],
    '-48_46': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, 0n ],
        [ 1n, 0n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '48_-46': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, 1n ],
        [ 0n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-48_-46': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 0n, 0n ],
        [ 1n, 0n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '47_48': [
        [ -1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ -1n, -1n ]
    ],
    '47_-48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ -1n, 0n ],
        [ 1n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-47_48': [
        [ -1n, -1n ],
        [ 0n, -1n ],
        [ 0n, 1n ],
        [ 1n, 0n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-47_-48': [
        [ -1n, 1n ],
        [ 0n, 1n ],
        [ 0n, -1n ],
        [ 1n, 0n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '48_47': [
        [ -1n, -1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ -1n, -1n ]
    ],
    '-48_47': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, -1n ],
        [ 1n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '48_-47': [
        [ -1n, -1n ],
        [ -1n, 0n ],
        [ 1n, 0n ],
        [ 0n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-48_-47': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 0n, 1n ],
        [ 1n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '48_48': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 1n, 0n ],
        [ 0n, -1n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ],
    '48_-48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 1n, 0n ],
        [ 0n, 1n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-48_48': [
        [ -1n, -1n ],
        [ -1n, -1n ],
        [ 0n, 1n ],
        [ 1n, 0n ],
        [ 1n, 1n ],
        [ 1n, 1n ]
    ],
    '-48_-48': [
        [ -1n, 1n ],
        [ -1n, 1n ],
        [ 0n, -1n ],
        [ 1n, 0n ],
        [ 1n, -1n ],
        [ 1n, -1n ]
    ]
};

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
        const x3 = 8n;

        const startResp = await this.client.start([x0,x1,x2,x3]);

        let stage = startResp.stage;
        const role = startResp.info.role;
        let state = startResp.state;

        const myShip = state.shipsAndCommands
            .filter(scs => scs.ship.role === role)
            .map(scs => scs.ship)[0];

        const orbitActions = precalcedActions[`${myShip.position[0]}_${myShip.position[1]}`];
        if (orbitActions) {
            console.log(`Found precalced actions for place x: ${myShip.position[0]}, y: ${myShip.position[1]}`, orbitActions);
        }

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

                let thrust = tangent;

                function orbit() {
                    const SEARCH_DEPTH = 4;
                    if (orbitActions && orbitActions[Number(state.tick)]) {
                        console.log(`Applying action from precalc`);
                        thrust = neg(orbitActions[Number(state.tick)]);
                    } else if (! orbitActions && state.tick < 6) {
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
                .map(ship => {
                    const clone = Clone(ship.id, [0n,0n,0n,1n]);
                    const move = searchInner(ship.position, ship.velocity, 1, false);
                    let res: Array<CommandS> = [clone];
                    if (move) {
                        res.push(Accel(ship.id, move[0]));
                    }
                    return res;
                })
                .reduce((acc, item) => [...acc, ...item], []);

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
