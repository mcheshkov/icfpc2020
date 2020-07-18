import {Lam, Lit, NumCons, assertNum, assertLit} from "./common";
import {ListCons} from "./list";
import {add, b, c, car, cdr, cons, dec, inc, mul, s, t, i} from "./symbols";
import {strictEqual} from "assert";

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

function test_t(){
    // ap ap t 1 5   =   1
    assertNum(t(NumCons(1n))(NumCons(5n)), 1n);
    // ap ap t t i   =   t
    strictEqual(t(t)(i), t);
    // ap ap t t ap inc 5   =   t
    strictEqual(t(t)(inc(NumCons(5n))), t);
    // ap ap t ap inc 5 t   =   6
    assertNum(t(inc(NumCons(5n)))(t), 6n);
}

function test_i(){
//     ap i 1   =   1
    assertNum(i(NumCons(1n)), 1n);
//     ap i i   =   i
    strictEqual(i(i), i);
//     ap i add   =   add
    strictEqual(i(add), add);
    // TODO implement this
//     ap i ap add 1   =   ap add 1
//     strictEqual(i(add(1)), add);
}

function test_car(){
    // ap car ap ap cons x0 x1   =   x0
    assertLit(car(cons(Lit("x0"))(Lit("x1"))), "x0");
    assertLit(car(ListCons([Lit("x0"), (Lit("x1"))])), "x0");
}


function test_cdr(){
    // ap cdr ap ap cons x0 x1   =   x1
    assertLit(cdr(cons(Lit("x0"))(Lit("x1"))), "x1");
}

function test() {
    test_s();
    test_c();
    test_b();
    test_t();
    test_i();
    test_car();
    test_cdr();
}

test();
