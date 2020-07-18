import assert from "assert";

import {Lam, NumCons, add, inc, mul, s} from "./common";

function assertNum(l:Lam, n: bigint) {
    if (l.type !== "number") {
        throw new Error("NUmber expected");
    }
    assert.strictEqual(l.value, n);
}

function test_s() {
    assertNum(s(add)(inc)(NumCons(1n)), 3n);
    assertNum(s(mul)(add(NumCons(1n)))(NumCons(6n)), 42n);
}

function test() {
    test_s();
}

test();