import {
    inc, dec, add, mul, div, eq, pwr2,
    lt, t, f, mod, dem, c, b, s,
    neg, i,
    cons, car, cdr, nil, isnil, vec,
    convertToPicture, checkerboard, multipledraw
} from "./symbols";
import {ListCons} from "./list";
import {
    Lam, assertNum, assertNumNum, NumCons, NewModulate,
    assertModulate, assertPicture, NewPicture, drawSinglePicture,
    unk, unthunk
} from "./common";
import {strictEqual} from "assert";

function assertLamStrictEqual(l: Lam, r: Lam) {
    strictEqual(unthunk(l), unthunk(r));
}

let message: any[] = [];

message[5] = () => {
    // ap inc 0   =   1
    assertNum(inc(NumCons(0n)), 1n);
    assertNum(inc(NumCons(1n)), 2n);
    assertNum(inc(NumCons(2n)), 3n);
    assertNum(inc(NumCons(3n)), 4n);
    assertNum(inc(NumCons(300n)), 301n);
    assertNum(inc(NumCons(301n)), 302n);
    assertNum(inc(NumCons(-1n)), 0n);
    assertNum(inc(NumCons(-2n)), -1n);
    assertNum(inc(NumCons(-3n)), -2n);
}


message[6] = () => {
    // ap dec 1   =   0
    assertNum(dec(NumCons(1n)), 0n);
    // ap dec 2   =   1
    assertNum(dec(NumCons(2n)), 1n);
    // ap dec 3   =   2
    assertNum(dec(NumCons(3n)), 2n);
    // ap dec 4   =   3
    assertNum(dec(NumCons(4n)), 3n);
    // ap dec 1024   =   1023
    assertNum(dec(NumCons(1024n)), 1023n);

    // ap dec 0   =   -1
    assertNum(dec(NumCons(0n)), -1n);
    // ap dec -1   =   -2
    assertNum(dec(NumCons(-1n)), -2n);
    // ap dec -2   =   -3
    assertNum(dec(NumCons(-2n)), -3n);
}


message[7] = () => {
    // ap ap add 1 2   =   3
    assertNum(add(NumCons(1n))(NumCons(2n)), 3n);
    // ap ap add 2 1   =   3
    assertNum(add(NumCons(2n))(NumCons(1n)), 3n);
    // ap ap add 0 1   =   1
    assertNum(add(NumCons(0n))(NumCons(1n)), 1n);
    // ap ap add 2 3   =   5
    assertNum(add(NumCons(2n))(NumCons(3n)), 5n);
    // ap ap add 3 5   =   8
    assertNum(add(NumCons(3n))(NumCons(5n)), 8n);
}


message[8] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);
    let x2 = NumCons(1488n);

    // ap ap add 0 x0   =   x0
    assertNumNum(add(NumCons(0n))(x0), x0);
    // ap ap add 0 x1   =   x1
    assertNumNum(add(NumCons(0n))(x1), x1);
    // ap ap add 0 x2   =   x2
    assertNumNum(add(NumCons(0n))(x2), x2);

    // ap ap add x0 0   =   x0
    assertNumNum(add(x0)(NumCons(0n)), x0);
    // ap ap add x1 0   =   x1
    assertNumNum(add(x1)(NumCons(0n)), x1);
    // ap ap add x2 0   =   x2
    assertNumNum(add(x2)(NumCons(0n)), x2);

    // ap ap add x0 x1   =   ap ap add x1 x0
    assertNumNum(add(x0)(x1), add(x1)(x0));
}


message[9] = () => {
    let x0 = NumCons(-255n);
    let x1 = NumCons(100500n);

    // ap ap mul 4 2   =   8
    assertNum(mul(NumCons(4n))(NumCons(2n)), 8n);
    // ap ap mul 3 4   =   12
    assertNum(mul(NumCons(3n))(NumCons(4n)), 12n);
    // ap ap mul 3 -2   =   -6
    assertNum(mul(NumCons(3n))(NumCons(-2n)), -6n);
    // ap ap mul x0 x1   =   ap ap mul x1 x0
    assertNumNum(mul(x0)(x1), mul(x1)(x0));
    // ap ap mul x0 0   =   0
    assertNum(mul(x0)(NumCons(0n)), 0n);
    // ap ap mul x0 1   =   x0
    assertNumNum(mul(x0)(NumCons(1n)), x0);
}


message[10] = () => {
    let x0 = NumCons(1008n);

    // ap ap div 4 2   =   2
    assertNum(div(NumCons(4n))(NumCons(2n)), 2n);
    // ap ap div 4 3   =   1
    assertNum(div(NumCons(4n))(NumCons(3n)), 1n);
    // ap ap div 4 4   =   1
    assertNum(div(NumCons(4n))(NumCons(4n)), 1n);
    // ap ap div 4 5   =   0
    assertNum(div(NumCons(4n))(NumCons(5n)), 0n);
    // ap ap div 5 2   =   2
    assertNum(div(NumCons(5n))(NumCons(2n)), 2n);
    // ap ap div 6 -2   =   -3
    assertNum(div(NumCons(6n))(NumCons(-2n)), -3n);
    // ap ap div 5 -3   =   -1
    assertNum(div(NumCons(5n))(NumCons(-3n)), -1n);
    // ap ap div -5 3   =   -1
    assertNum(div(NumCons(-5n))(NumCons(3n)), -1n);
    // ap ap div -5 -3   =   1
    assertNum(div(NumCons(-5n))(NumCons(-3n)), 1n);
    // ap ap div x0 1   =   x0
    assertNumNum(div(x0)(NumCons(1n)), x0);
}


message[11] = () => {
    let x0 = NumCons(42n);

    // ap ap eq x0 x0   =   t
    assertLamStrictEqual(eq(x0)(x0), t);

    // ap ap eq 0 -2   =   f
    assertLamStrictEqual(eq(NumCons(0n))(NumCons(-2n)), f);
    // ap ap eq 0 -1   =   f
    assertLamStrictEqual(eq(NumCons(0n))(NumCons(-1n)), f);
    // ap ap eq 0 0   =   t
    assertLamStrictEqual(eq(NumCons(0n))(NumCons(0n)), t);
    // ap ap eq 0 1   =   f
    assertLamStrictEqual(eq(NumCons(0n))(NumCons(1n)), f);
    // ap ap eq 0 2   =   f
    assertLamStrictEqual(eq(NumCons(0n))(NumCons(2n)), f);
    // ap ap eq 1 -1   =   f
    assertLamStrictEqual(eq(NumCons(1n))(NumCons(-1n)), f);
    // ap ap eq 1 0   =   f
    assertLamStrictEqual(eq(NumCons(1n))(NumCons(0n)), f);
    // ap ap eq 1 1   =   t
    assertLamStrictEqual(eq(NumCons(1n))(NumCons(1n)), t);
    // ap ap eq 1 2   =   f
    assertLamStrictEqual(eq(NumCons(1n))(NumCons(2n)), f);
    // ap ap eq 1 3   =   f
    assertLamStrictEqual(eq(NumCons(1n))(NumCons(3n)), f);
    // ap ap eq 2 0   =   f
    assertLamStrictEqual(eq(NumCons(2n))(NumCons(0n)), f);
    // ap ap eq 2 1   =   f
    assertLamStrictEqual(eq(NumCons(2n))(NumCons(1n)), f);
    // ap ap eq 2 2   =   t
    assertLamStrictEqual(eq(NumCons(2n))(NumCons(2n)), t);
    // ap ap eq 2 3   =   f
    assertLamStrictEqual(eq(NumCons(2n))(NumCons(3n)), f);
    // ap ap eq 2 4   =   f
    assertLamStrictEqual(eq(NumCons(2n))(NumCons(4n)), f);
    // ap ap eq 19 20   =   f
    assertLamStrictEqual(eq(NumCons(19n))(NumCons(20n)), f);
    // ap ap eq 20 20   =   t
    assertLamStrictEqual(eq(NumCons(20n))(NumCons(20n)), t);
    // ap ap eq 21 20   =   f
    assertLamStrictEqual(eq(NumCons(21n))(NumCons(20n)), f);
    // ap ap eq -19 -20   =   f
    assertLamStrictEqual(eq(NumCons(-19n))(NumCons(-20n)), f);
    // ap ap eq -20 -20   =   t
    assertLamStrictEqual(eq(NumCons(-20n))(NumCons(-20n)), t);
    // ap ap eq -21 -20   =   f
    assertLamStrictEqual(eq(NumCons(-21n))(NumCons(-20n)), f);
}


message[12] = () => {
    // ap ap lt 0 -1   =   f
    assertLamStrictEqual(lt(NumCons(0n))(NumCons(-1n)), f);

    // ap ap lt 0 0   =   f
    assertLamStrictEqual(lt(NumCons(0n))(NumCons(0n)), f);
    // ap ap lt 0 1   =   t
    assertLamStrictEqual(lt(NumCons(0n))(NumCons(1n)), t);
    // ap ap lt 0 2   =   t
    assertLamStrictEqual(lt(NumCons(0n))(NumCons(2n)), t);
    // ...
    // ap ap lt 1 0   =   f
    assertLamStrictEqual(lt(NumCons(1n))(NumCons(0n)), f);
    // ap ap lt 1 1   =   f
    assertLamStrictEqual(lt(NumCons(1n))(NumCons(1n)), f);
    // ap ap lt 1 2   =   t
    assertLamStrictEqual(lt(NumCons(1n))(NumCons(2n)), t);
    // ap ap lt 1 3   =   t
    assertLamStrictEqual(lt(NumCons(1n))(NumCons(3n)), t);
    // ...
    // ap ap lt 2 1   =   f
    assertLamStrictEqual(lt(NumCons(2n))(NumCons(1n)), f);
    // ap ap lt 2 2   =   f
    assertLamStrictEqual(lt(NumCons(2n))(NumCons(2n)), f);
    // ap ap lt 2 3   =   t
    assertLamStrictEqual(lt(NumCons(2n))(NumCons(3n)), t);
    // ap ap lt 2 4   =   t
    assertLamStrictEqual(lt(NumCons(2n))(NumCons(4n)), t);
    // ...
    // ap ap lt 19 20   =   t
    assertLamStrictEqual(lt(NumCons(19n))(NumCons(20n)), t);
    // ap ap lt 20 20   =   f
    assertLamStrictEqual(lt(NumCons(20n))(NumCons(20n)), f);
    // ap ap lt 21 20   =   f
    assertLamStrictEqual(lt(NumCons(21n))(NumCons(20n)), f);
    // ...
    // ap ap lt -19 -20   =   f
    assertLamStrictEqual(lt(NumCons(-19n))(NumCons(-20n)), f);
    // ap ap lt -20 -20   =   f
    assertLamStrictEqual(lt(NumCons(-20n))(NumCons(-20n)), f);
    // ap ap lt -21 -20   =   t
    assertLamStrictEqual(lt(NumCons(-21n))(NumCons(-20n)), t);
}


message[13] = () => {
    // ap mod 0   =   [0]
    assertModulate(mod(NumCons(0n)), NewModulate(0n));
    // ap mod 1   =   [1]
    assertModulate(mod(NumCons(1n)), NewModulate(1n));
    // ap mod -1   =   [-1]
    assertModulate(mod(NumCons(-1n)), NewModulate(-1n));
    // ap mod 2   =   [2]
    assertModulate(mod(NumCons(2n)), NewModulate(2n));
    // ap mod -2   =   [-2]
    assertModulate(mod(NumCons(-2n)), NewModulate(-2n));
    // ...
    // ap mod 16   =   [16]
    assertModulate(mod(NumCons(16n)), NewModulate(16n));
    // ap mod -16   =   [-16]
    assertModulate(mod(NumCons(-16n)), NewModulate(-16n));
    // ...
    // ap mod 255   =   [255]
    assertModulate(mod(NumCons(255n)), NewModulate(255n));
    // ap mod -255   =   [-255]
    assertModulate(mod(NumCons(-255n)), NewModulate(-255n));
    // ap mod 256   =   [256]
    assertModulate(mod(NumCons(256n)), NewModulate(256n));
    // ap mod -256   =   [-256]
    assertModulate(mod(NumCons(-256n)), NewModulate(-256n));
}


message[14] = () => {
    let x0 = NumCons(100500n);
    // пришлось добавить особую переменую, потому что dem не работает с числами
    let x1 = NewModulate(100500n);

    // ap dem ap mod x0   =   x0
    assertNumNum(dem(mod(x0)), x0);
    // ap mod ap dem x0   =   x0
    assertModulate(mod(dem(x1)), x1);
}


message[16] = () => {
    // ap neg 0   =   0
    assertNum(neg(NumCons(0n)), 0n);
    // ap neg 1   =   -1
    assertNum(neg(NumCons(1n)), -1n);
    // ap neg -1   =   1
    assertNum(neg(NumCons(-1n)), 1n);
    // ap neg 2   =   -2
    assertNum(neg(NumCons(2n)), -2n);
    // ap neg -2   =   2
    assertNum(neg(NumCons(-2n)), 2n);
}


message[17] = () => {
    let x0 = NumCons(-42n);

    // ap inc ap inc 0   =   2
    assertNum(inc(inc(NumCons(0n))), 2n);
    // ap inc ap inc ap inc 0   =   3
    assertNum(inc(inc(inc(NumCons(0n)))), 3n);
    // ap inc ap dec x0   =   x0
    assertNumNum(dec(inc(x0)), x0);
    // ap dec ap inc x0   =   x0
    assertNumNum(dec(inc(x0)), x0);
    // ap dec ap ap add x0 1   =   x0
    assertNumNum(dec(add(x0)(NumCons(1n))), x0);
    // ap ap add ap ap add 2 3 4   =   9
    assertNum(add(add(NumCons(2n))(NumCons(3n)))(NumCons(4n)), 9n);

    // ap ap add 2 ap ap add 3 4   =   9
    {
        let b = add(NumCons(3n))(NumCons(4n));
        let a = add(NumCons(2n))(b);
        assertNum(a, 9n);
    }

    // ap ap add ap ap mul 2 3 4   =   10
    {
        let c = mul(NumCons(2n))(NumCons(3n));
        let b = add(c);
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
    */
    {
        let d = add(NumCons(3n));
        let c = d(NumCons(4n));
        let b = mul(NumCons(2n));
        let a = b(c);
        assertNum(a, 14n);
    }

    // inc and dec used as function-definition
}

message[18] = () => {
    // used as fn definition
    // ap ap ap s x0 x1 x2   =   ap ap x0 x2 ap x1 x2

    // ap ap ap s add inc 1   =   3
    /*
    a: ap
        b: ap
            c: ap
                s
                add
            inc
        1
    */
    {
        let c = s(add);
        let b = c(inc);
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
    */
    {
        let d = add(NumCons(1n));
        let c = s(mul);
        let b = c(d);
        let a = b(NumCons(6n));
        assertNum(a, 42n);
    }
}

message[19] = () => {
    // used as fn definition
    // ap ap ap c x0 x1 x2   =   ap ap x0 x2 x1

    // ap ap ap c add 1 2   =   3
    /*
        a: ap
            b: ap
                c: ap
                    c
                    add
                1
            2
    */
    {
        /*
        let c = c(add);
        let b = c(NumCons(1n));
        let a = b(NumCons(2n));
        */
        let a = c(add)(NumCons(1n))(NumCons(2n));
        assertNum(a, 3n);
    }
}

message[20] = () => {
    let x0 = NumCons(-42n);

    // used as fn definition
    // ap ap ap b x0 x1 x2   =   ap x0 ap x1 x2
    // ap ap ap b inc dec x0   =   x0
    let a = b(inc)(dec)(x0);
    assertNumNum(a, x0);
}

message[21] = () => {
    let x0 = NumCons(-42n);
    let x1 = NumCons(100n);
    /*
    ap ap t x0 x1   =   x0
    ap ap t 1 5   =   1
    ap ap t t i   =   t
    ap ap t t ap inc 5   =   t
    ap ap t ap inc 5 t   =   6
    */

    const val_1 = t(x0)(x1);
    const val_2 = t(NumCons(1n))(NumCons(5n));
    const val_3 = t(t)(i);
    const val_4 = t(t)(inc(NumCons(5n)));
    const val_5 = t(inc(NumCons(5n)))(t);

    assertNumNum(val_1, x0);
    assertNum(val_2, 1n);
    strictEqual(val_3, t);
    strictEqual(val_4, t);
    assertNum(val_5, 6n);
}

message[22] = () => {
    let x0 = NumCons(-42n);
    let x1 = NumCons(100n);

    // ap ap f x0 x1   =   x1
    assertNumNum(f(x0)(x1), x1);
    // f   =   ap s t
    assertNumNum(f(x0)(x1), s(t)(x0)(x1));
}

message[23] = () => {
    // ap pwr2 2   =   4
    assertNum(pwr2(NumCons(2n)), 4n);
    assertNum(pwr2(NumCons(3n)), 8n);
    assertNum(pwr2(NumCons(4n)), 16n);
}

message[24] = () => {
    let x0 = NumCons(-42n);

    // ap i x0   =   x0
    assertNumNum(i(x0), x0);
    // ap i 1   =   1
    assertNum(i(NumCons(1n)), 1n);
    // ap i i   =   i
    strictEqual(i(i), i);
    // ap i add   =   add
    strictEqual(i(add), add);
    // ap i ap add 1   =   ap add 1
    assertNumNum(i(add(NumCons(1n)))(x0), add(NumCons(1n))(x0));
};

message[25] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);
    let x2 = NumCons(1488n);

    // ap ap ap cons x0 x1 x2   =   ap ap x2 x0 x1
    // no check
}

message[26] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);

    let x2 = i;

    // ap car ap ap cons x0 x1   =   x0
    assertNumNum(car(cons(x0)(x1)), x0);
    // ap car x2   =   ap x2 t
    strictEqual(car(x2), x2(t)); // works only for i
}

message[27] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);

    let x2 = i;

    // ap cdr ap ap cons x0 x1   =   x1
    assertNumNum(cdr(cons(x0)(x1)), x1);
    // ap cdr x2   =   ap x2 f
    strictEqual(cdr(x2), x2(f)); // works only for i
}

message[28] = () => {
    let x0 = NumCons(100n);

    // ap nil x0   =   t
    strictEqual(nil(x0), t);
}

message[29] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);

    // ap isnil nil   =   t
    assertLamStrictEqual(isnil(nil), t);
    // ap isnil ap ap cons x0 x1   =   f
    assertLamStrictEqual(isnil(cons(x0)(x1)), f);
}

message[30] = () => {
    let x0 = NumCons(100n);
    let x1 = NumCons(1337n);
    let x2 = NumCons(-1488n);
    let x5 = NumCons(-50n);

    let test_list = [x0, x1, x2, x5];

    // ( )
    {
        // strictEqual(isnil(ListCons([])), t);
    }

    // ( x0 )   =   ap ap cons x0 nil
    {
        let list_a: Lam = cons(x0)(nil);
        let list_b: Lam = ListCons([x0]);

        for(let j = 0; j < 1; j++) {
            assertLamStrictEqual(isnil(list_a), f);
            assertLamStrictEqual(isnil(list_b), f);
            assertNumNum(car(list_a), test_list[j]);
            assertNumNum(car(list_b), test_list[j]);
            list_a = cdr(list_a);
            list_b = cdr(list_b);
        }
        assertLamStrictEqual(isnil(list_a), t);
        assertLamStrictEqual(isnil(list_b), t);
    }
    // ( x0 , x1 )   =   ap ap cons x0 ap ap cons x1 nil
    {
        let list_a: Lam = cons(x0)(cons(x1)(nil));
        let list_b: Lam = ListCons([x0, x1]);

        for(let j = 0; j < 2; j++) {
            assertLamStrictEqual(isnil(list_a), f);
            assertLamStrictEqual(isnil(list_b), f);
            assertNumNum(car(list_a), test_list[j]);
            assertNumNum(car(list_b), test_list[j]);
            list_a = cdr(list_a);
            list_b = cdr(list_b);
        }
        assertLamStrictEqual(isnil(list_a), t);
        assertLamStrictEqual(isnil(list_b), t);
    }
    // ( x0 , x1 , x2 )   =   ap ap cons x0 ap ap cons x1 ap ap cons x2 nil
    // ( x0 , x1 , x2 , x5 )   =   ap ap cons x0 ap ap cons x1 ap ap cons x2 ap ap cons x5 nil
    {
        let list_a: Lam = cons(x0)(cons(x1)(cons(x2)(cons(x5)(nil))));
        let list_b: Lam = ListCons([x0, x1, x2, x5]);

        for(let j = 0; j < 4; j++) {
            assertLamStrictEqual(isnil(list_a), f);
            assertLamStrictEqual(isnil(list_b), f);
            assertNumNum(car(list_a), test_list[j]);
            assertNumNum(car(list_b), test_list[j]);
            list_a = cdr(list_a);
            list_b = cdr(list_b);
        }
        assertLamStrictEqual(isnil(list_a), t);
        assertLamStrictEqual(isnil(list_b), t);
    }
}

message[32] = (ctx: CanvasRenderingContext2D) => {
    // ap draw ( )   =   |picture1|
    assertPicture(convertToPicture(ListCons([])), NewPicture([]));

    // ap draw ( ap ap vec 1 1 )   =   |picture2|
    assertPicture(convertToPicture(ListCons([vec(NumCons(1n))(NumCons(1n))])), NewPicture([[1n, 1n]]));
    // ap draw ( ap ap vec 1 2 )   =   |picture3|
    assertPicture(convertToPicture(ListCons([vec(NumCons(1n))(NumCons(2n))])), NewPicture([[1n, 2n]]));
    // ap draw ( ap ap vec 2 5 )   =   |picture4|
    assertPicture(convertToPicture(ListCons([vec(NumCons(2n))(NumCons(5n))])), NewPicture([[2n, 5n]]));
    // ap draw ( ap ap vec 1 2 , ap ap vec 3 1 )   =   |picture5|
    assertPicture(convertToPicture(ListCons([
        vec(NumCons(1n))(NumCons(1n)),
        vec(NumCons(3n))(NumCons(1n)),
    ])), NewPicture([[1n, 1n], [3n, 1n]]));

    assertPicture(convertToPicture(ListCons([
        vec(NumCons(1n))(NumCons(1n)),
        vec(NumCons(3n))(NumCons(1n)),
    ])), NewPicture([[3n, 1n], [1n, 1n]]));

    // ap draw ( ap ap vec 5 3 , ap ap vec 6 3 , ap ap vec 4 4 , ap ap vec 6 4 , ap ap vec 4 5 )   =   |picture6|
    let picture6 = convertToPicture(ListCons([
        vec(NumCons(5n))(NumCons(3n)),
        vec(NumCons(6n))(NumCons(3n)),
        vec(NumCons(4n))(NumCons(4n)),
        vec(NumCons(6n))(NumCons(4n)),
        vec(NumCons(4n))(NumCons(5n)),
    ]));

    assertPicture(picture6, NewPicture([[5n, 3n], [6n, 3n], [4n, 4n], [6n, 4n], [4n, 5n]]));
    drawSinglePicture(picture6, ctx);
}

message[33] = (ctx: CanvasRenderingContext2D) => {
    // ap ap checkerboard 7 0   =   |picture1|
    let board = unthunk(checkerboard(NumCons(11n))(NumCons(0n)));
    // console.log(board);
    let picture1 = convertToPicture(board);
    drawSinglePicture(picture1, ctx);
}

message[34] = (ctx: CanvasRenderingContext2D) => {
    {
        let list = ListCons([
            ListCons([
                vec(NumCons(5n))(NumCons(3n)),
                vec(NumCons(6n))(NumCons(3n)),
                vec(NumCons(4n))(NumCons(4n)),
                vec(NumCons(6n))(NumCons(4n)),
                vec(NumCons(4n))(NumCons(5n)),
            ]),
            ListCons([
                vec(NumCons(1n))(NumCons(1n)),
                vec(NumCons(3n))(NumCons(1n)),
            ]),
        ]);
        // drawPictures(list, ctx);
    }
}

export {message};
