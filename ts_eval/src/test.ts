import {Lam, Lit, NumCons, add, b, c, dec, inc, mul, s, assertNum, assertLit} from "./common";



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
