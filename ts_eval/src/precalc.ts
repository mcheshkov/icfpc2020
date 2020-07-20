import {searchInner} from "./bot";
import {VecS} from "./client";

function getBest(x: number, y: number): Array<VecS> | null  {
    for (let depth = 1; depth < 10; depth += 1) {
        const res = searchInner([BigInt(x), BigInt(y)], [0n, 0n], depth);
        if (res) {
            console.log(`Found res for ${x}, ${y}`, res);
            return res;
        }
    }
    return null;
}

let actions: Record<string, Array<VecS> | null> = {};

function calc(x: number, y: number) {
    const key = `${x}_${y}`;
    actions[key] = getBest(x, y);
}

for (let i = 0; i < 49; i++) {
    calc(i, 48);
    calc(i, -48);
    calc(-i, 48);
    calc(-i, -48);
    calc(48, i);
    calc(-48, i);
    calc(48, -i);
    calc(-48, -i);
}

console.log(actions);
