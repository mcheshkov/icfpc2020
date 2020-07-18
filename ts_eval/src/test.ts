import assert from "assert";

import {Lam, Lit, NumCons, add, b, c, dec, inc, mul, s} from "./common";

function assertNum(l:Lam, n: bigint) {
    if (l.type !== "number") {
        throw new Error("Number expected");
    }
    assert.strictEqual(l.value, n);
}

function assertLit(l:Lam, ident: string) {
    if (l.type !== "literal") {
        throw new Error("Literal expected");
    }
    assert.strictEqual(l.ident, ident);
}


function test_s() {
    // ap ap ap s add inc 1   =   3
    assertNum(s(add)(inc)(NumCons(1n)), 3n);
    // ap ap ap s mul ap add 1 6   =   42
    assertNum(s(mul)(add(NumCons(1n)))(NumCons(6n)), 42n);
}

function test_c() {
    //ap ap ap c add 1 2   =   3
    assertNum(c(add)(NumCons(1n))(NumCons(2n)), 3n);
}

function test_b() {
// TODO this test requires optimizng inc(dec) and appyling it to literal
    // ap ap ap b inc dec x0   =   x0
//    assertLit(b(inc)(dec)(Lit("x0")), "x0");
}

function test() {
    test_s();
    test_c();
    test_b();
}

test();
