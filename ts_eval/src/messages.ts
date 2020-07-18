import * as _ from "./symbols";
import {assertNum, assertNumNum, NumCons} from "./common";
import {strictEqual} from "assert";

let message: any[] = [];

message[5] = () => {
    // ap inc 0   =   1
    assertNum(_.inc(NumCons(0n)), 1n);
    assertNum(_.inc(NumCons(1n)), 2n);
    assertNum(_.inc(NumCons(2n)), 3n);
    assertNum(_.inc(NumCons(3n)), 4n);
    assertNum(_.inc(NumCons(300n)), 301n);
    assertNum(_.inc(NumCons(301n)), 302n);
    assertNum(_.inc(NumCons(-1n)), 0n);
    assertNum(_.inc(NumCons(-2n)), -1n);
    assertNum(_.inc(NumCons(-3n)), -2n);
}


message[6] = () => {
    // ap _.dec 1   =   0
    assertNum(_.dec(NumCons(1n)), 0n);
    // ap _.dec 2   =   1
    assertNum(_.dec(NumCons(2n)), 1n);
    // ap _.dec 3   =   2
    assertNum(_.dec(NumCons(3n)), 2n);
    // ap _.dec 4   =   3
    assertNum(_.dec(NumCons(4n)), 3n);
    // ap _.dec 1024   =   1023
    assertNum(_.dec(NumCons(1024n)), 1023n);

    // ap _.dec 0   =   -1
    assertNum(_.dec(NumCons(0n)), -1n);
    // ap _.dec -1   =   -2
    assertNum(_.dec(NumCons(-1n)), -2n);
    // ap _.dec -2   =   -3
    assertNum(_.dec(NumCons(-2n)), -3n);
}


exports.message[7] = () => {
    // ap ap _.add 1 2   =   3
    assertNum(_.add(NumCons(1n))(NumCons(2n)), 3n);
    // ap ap _.add 2 1   =   3
    assertNum(_.add(NumCons(2n))(NumCons(1n)), 3n);
    // ap ap _.add 0 1   =   1
    assertNum(_.add(NumCons(0n))(NumCons(1n)), 1n);
    // ap ap _.add 2 3   =   5
    assertNum(_.add(NumCons(2n))(NumCons(3n)), 5n);
    // ap ap _.add 3 5   =   8
    assertNum(_.add(NumCons(3n))(NumCons(5n)), 8n);
}


exports.message[8] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);
    let x2 = NumCons(1488n);

    // ap ap _.add 0 x0   =   x0
    assertNumNum(_.add(NumCons(0n))(x0), x0);
    // ap ap _.add 0 x1   =   x1
    assertNumNum(_.add(NumCons(0n))(x1), x1);
    // ap ap _.add 0 x2   =   x2
    assertNumNum(_.add(NumCons(0n))(x2), x2);

    // ap ap _.add x0 0   =   x0
    assertNumNum(_.add(x0)(NumCons(0n)), x0);
    // ap ap _.add x1 0   =   x1
    assertNumNum(_.add(x1)(NumCons(0n)), x1);
    // ap ap _.add x2 0   =   x2
    assertNumNum(_.add(x2)(NumCons(0n)), x2);

    // ap ap _.add x0 x1   =   ap ap _.add x1 x0
    assertNumNum(_.add(x0)(x1), _.add(x1)(x0));
}


exports.message[9] = () => {
    let x0 = NumCons(-255n);
    let x1 = NumCons(100500n);

    // ap ap _.mul 4 2   =   8
    assertNum(_.mul(NumCons(4n))(NumCons(2n)), 8n);
    // ap ap _.mul 3 4   =   12
    assertNum(_.mul(NumCons(3n))(NumCons(4n)), 12n);
    // ap ap _.mul 3 -2   =   -6
    assertNum(_.mul(NumCons(3n))(NumCons(-2n)), -6n);
    // ap ap _.mul x0 x1   =   ap ap _.mul x1 x0
    assertNumNum(_.mul(x0)(x1), _.mul(x1)(x0));
    // ap ap _.mul x0 0   =   0
    assertNum(_.mul(x0)(NumCons(0n)), 0n);
    // ap ap _.mul x0 1   =   x0
    assertNumNum(_.mul(x0)(NumCons(1n)), x0);
}


exports.message[10] = () => {
    let x0 = NumCons(1008n);

    // ap ap _.div 4 2   =   2
    assertNum(_.div(NumCons(4n))(NumCons(2n)), 2n);
    // ap ap _.div 4 3   =   1
    assertNum(_.div(NumCons(4n))(NumCons(3n)), 1n);
    // ap ap _.div 4 4   =   1
    assertNum(_.div(NumCons(4n))(NumCons(4n)), 1n);
    // ap ap _.div 4 5   =   0
    assertNum(_.div(NumCons(4n))(NumCons(5n)), 0n);
    // ap ap _.div 5 2   =   2
    assertNum(_.div(NumCons(5n))(NumCons(2n)), 2n);
    // ap ap _.div 6 -2   =   -3
    assertNum(_.div(NumCons(6n))(NumCons(-2n)), -3n);
    // ap ap _.div 5 -3   =   -1
    assertNum(_.div(NumCons(5n))(NumCons(-3n)), -1n);
    // ap ap _.div -5 3   =   -1
    assertNum(_.div(NumCons(-5n))(NumCons(3n)), -1n);
    // ap ap _.div -5 -3   =   1
    assertNum(_.div(NumCons(-5n))(NumCons(-3n)), 1n);
    // ap ap _.div x0 1   =   x0
    assertNumNum(_.div(x0)(NumCons(1n)), x0);
}


exports.message[11] = () => {
    let x0 = NumCons(42n);

    // ap ap _.eq x0 x0   =   t
    strictEqual(_.eq(x0)(x0), _.t);

    // ap ap _.eq 0 -2   =   f
    strictEqual(_.eq(NumCons(0n))(NumCons(-2n)), _.f);
    // ap ap _.eq 0 -1   =   f
    strictEqual(_.eq(NumCons(0n))(NumCons(-1n)), _.f);
    // ap ap _.eq 0 0   =   t
    strictEqual(_.eq(NumCons(0n))(NumCons(0n)), _.t);
    // ap ap _.eq 0 1   =   f
    strictEqual(_.eq(NumCons(0n))(NumCons(1n)), _.f);
    // ap ap _.eq 0 2   =   f
    strictEqual(_.eq(NumCons(0n))(NumCons(2n)), _.f);
    // ap ap _.eq 1 -1   =   f
    strictEqual(_.eq(NumCons(1n))(NumCons(-1n)), _.f);
    // ap ap _.eq 1 0   =   f
    strictEqual(_.eq(NumCons(1n))(NumCons(0n)), _.f);
    // ap ap _.eq 1 1   =   t
    strictEqual(_.eq(NumCons(1n))(NumCons(1n)), _.t);
    // ap ap _.eq 1 2   =   f
    strictEqual(_.eq(NumCons(1n))(NumCons(2n)), _.f);
    // ap ap _.eq 1 3   =   f
    strictEqual(_.eq(NumCons(1n))(NumCons(3n)), _.f);
    // ap ap _.eq 2 0   =   f
    strictEqual(_.eq(NumCons(2n))(NumCons(0n)), _.f);
    // ap ap _.eq 2 1   =   f
    strictEqual(_.eq(NumCons(2n))(NumCons(1n)), _.f);
    // ap ap _.eq 2 2   =   t
    strictEqual(_.eq(NumCons(2n))(NumCons(2n)), _.t);
    // ap ap _.eq 2 3   =   f
    strictEqual(_.eq(NumCons(2n))(NumCons(3n)), _.f);
    // ap ap _.eq 2 4   =   f
    strictEqual(_.eq(NumCons(2n))(NumCons(4n)), _.f);
    // ap ap _.eq 19 20   =   f
    strictEqual(_.eq(NumCons(19n))(NumCons(20n)), _.f);
    // ap ap _.eq 20 20   =   t
    strictEqual(_.eq(NumCons(20n))(NumCons(20n)), _.t);
    // ap ap _.eq 21 20   =   f
    strictEqual(_.eq(NumCons(21n))(NumCons(20n)), _.f);
    // ap ap _.eq -19 -20   =   f
    strictEqual(_.eq(NumCons(-19n))(NumCons(-20n)), _.f);
    // ap ap _.eq -20 -20   =   t
    strictEqual(_.eq(NumCons(-20n))(NumCons(-20n)), _.t);
    // ap ap _.eq -21 -20   =   f
    strictEqual(_.eq(NumCons(-21n))(NumCons(-20n)), _.f);
}


exports.message[12] = () => {
    // ap ap lt 0 -1   =   f
    strictEqual(_.lt(NumCons(0n))(NumCons(-1n)), _.f);

    // ap ap lt 0 0   =   f
    strictEqual(_.lt(NumCons(0n))(NumCons(0n)), _.f);
    // ap ap lt 0 1   =   t
    strictEqual(_.lt(NumCons(0n))(NumCons(1n)), _.t);
    // ap ap lt 0 2   =   t
    strictEqual(_.lt(NumCons(0n))(NumCons(2n)), _.t);
    // ...
    // ap ap lt 1 0   =   f
    strictEqual(_.lt(NumCons(1n))(NumCons(0n)), _.f);
    // ap ap lt 1 1   =   f
    strictEqual(_.lt(NumCons(1n))(NumCons(1n)), _.f);
    // ap ap lt 1 2   =   t
    strictEqual(_.lt(NumCons(1n))(NumCons(2n)), _.t);
    // ap ap lt 1 3   =   t
    strictEqual(_.lt(NumCons(1n))(NumCons(3n)), _.t);
    // ...
    // ap ap lt 2 1   =   f
    strictEqual(_.lt(NumCons(2n))(NumCons(1n)), _.f);
    // ap ap lt 2 2   =   f
    strictEqual(_.lt(NumCons(2n))(NumCons(2n)), _.f);
    // ap ap lt 2 3   =   t
    strictEqual(_.lt(NumCons(2n))(NumCons(3n)), _.t);
    // ap ap lt 2 4   =   t
    strictEqual(_.lt(NumCons(2n))(NumCons(4n)), _.t);
    // ...
    // ap ap lt 19 20   =   t
    strictEqual(_.lt(NumCons(19n))(NumCons(20n)), _.t);
    // ap ap lt 20 20   =   f
    strictEqual(_.lt(NumCons(20n))(NumCons(20n)), _.f);
    // ap ap lt 21 20   =   f
    strictEqual(_.lt(NumCons(21n))(NumCons(20n)), _.f);
    // ...
    // ap ap lt -19 -20   =   f
    strictEqual(_.lt(NumCons(-19n))(NumCons(-20n)), _.f);
    // ap ap lt -20 -20   =   f
    strictEqual(_.lt(NumCons(-20n))(NumCons(-20n)), _.f);
    // ap ap lt -21 -20   =   t
    strictEqual(_.lt(NumCons(-21n))(NumCons(-20n)), _.t);
}

/*
exports.message[13] = () => {
    // ap mod 0   =   [0]
    assertNum(_.mod(NumCons(0n)), JSON.stringify({signal:0}));
    // ap mod 1   =   [1]
    assertNum(_.mod(NumCons(1n)), JSON.stringify({signal:1}));
    // ap mod -1   =   [-1]
    assertNum(_.mod(NumCons(-1n)), JSON.stringify({signal:-1}));
    // ap mod 2   =   [2]
    assertNum(_.mod(NumCons(2n)), JSON.stringify({signal:2}));
    // ap mod -2   =   [-2]
    assertNum(_.mod(NumCons(-2n)), JSON.stringify({signal:-2}));
    // ...
    // ap mod 16   =   [16]
    assertNum(_.mod(NumCons(16n)), JSON.stringify({signal:16}));
    // ap mod -16   =   [-16]
    assertNum(_.mod(NumCons(-16n)), JSON.stringify({signal:-16}));
    // ...
    // ap mod 255   =   [255]
    assertNum(_.mod(NumCons(255n)), JSON.stringify({signal:255}));
    // ap mod -255   =   [-255]
    assertNum(_.mod(NumCons(-255n)), JSON.stringify({signal:-255}));
    // ap mod 256   =   [256]
    assertNum(_.mod(NumCons(256n)), JSON.stringify({signal:256}));
    // ap mod -256   =   [-256]
    assertNum(_.mod(NumCons(-256n)), JSON.stringify({signal:-256}));
}

exports.message[14] = () => {
    let x0 = 100500;
    // пришлось добавить особую переменую, потому что dem не работает с числами
    let x1 = JSON.stringify({signal:100500});

    // ap dem ap mod x0   =   x0
    assertNum(_.dem(_.mod(x0n)), x0n);
    // ap mod ap dem x0   =   x0
    assertNum(_.mod(_.dem(x1n)), x1n);
}

exports.message[16] = () => {
    // ap neg 0   =   0
    assertNum(_.neg(NumCons(0n)), 0n);
    // ap neg 1   =   -1
    assertNum(_.neg(NumCons(1n)), -1n);
    // ap neg -1   =   1
    assertNum(_.neg(NumCons(-1n)), 1n);
    // ap neg 2   =   -2
    assertNum(_.neg(NumCons(2n)), -2n);
    // ap neg -2   =   2
    assertNum(_.neg(NumCons(-2n)), 2n);
}
*/

/*
exports.message[17] = () => {
    let x0 = -42;

    // ap inc ap inc 0   =   2
    assertNum(_.inc(_.inc(NumCons(0n))), 2n);
    // ap inc ap inc ap inc 0   =   3
    assertNum(_.inc(_.inc(_.inc(NumCons(0n)))), 3n);
    // ap inc ap dec x0   =   x0
    assertNum(_.dec(_.inc(x0n)), x0n);
    // ap dec ap inc x0   =   x0
    assertNum(_.dec(_.inc(x0n)), x0n);
    // ap dec ap ap add x0 1   =   x0
    assertNum(_.dec(_.add(x0n)(NumCons(1n))), x0n);
    // ap ap add ap ap add 2 3 4   =   9
    assertNum(_.add(_.add(NumCons(2n))(NumCons(3n)))(NumCons(4n)), 9n);

    // ap ap add 2 ap ap add 3 4   =   9
    {
        let b = _.add(NumCons(3n))(NumCons(4n));
        let a = _.add(NumCons(2n))(b);
        assertNum(a, 9n);
    }

    // ap ap add ap ap mul 2 3 4   =   10
    {
        let c = _.mul(NumCons(2n))(NumCons(3n));
        let b = _.add(c);
        let a = b(NumCons(4n));
        assertNum(a, 10n);
    }

    /*
    ap ap mul 2 ap ap add 3 4   =   14

    a: ap
        b: ap
            mul
            2
        c: ap
            d: ap
                add
                3
            4
    =   14
    *
    {
        let d = _.add(NumCons(3n));
        let c = d(NumCons(4n));
        let b = _.mul(NumCons(2n));
        let a = b(c);
        assertNum(a, 14n);
    }

    // inc and dec used as function-definition
}
*/

/*
exports.message[18] = () => {
    let x0 = x => y => x + 2 * y;
    let x1 = x => y => x * (y - 1n);
    let x2 = x => y => (1 + y * x);

    // ap ap ap s x0 x1 x2   =   ap ap x0 x2 ap x1 x2
    let a = _.s(x0n)(x1n)(x2n);
    let b = x0(x2n)(x1(x2n));
    // console.log(a, b);
    assertNum(a, b);

    // ap ap ap s add inc 1   =   3
    /*
    a: ap
        b: ap
            c: ap
                s
                add
            inc
        1
    *
    {
        let c = _.s(_.add);
        let b = c(_.inc);
        let a = b(NumCons(1n));
        assertNum(a, 3n);
    }
    // ap ap ap s mul ap add 1 6   =   42
    /*
        a: ap
            b: ap
                c: ap
                    s
                    mul
                d: ap
                    add
                    1
            6   =   42
    *
    {
        let d = _.add(NumCons(1n));
        let c = _.s(_.mul);
        let b = c(d);
        let a = b(NumCons(6n));
        assertNum(a, 42n);
    }
}
*/

export {message};
