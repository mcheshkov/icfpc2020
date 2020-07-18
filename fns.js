const inc = (x) => x + 1;
const dec = (x) => x  - 1;
const add  = (x) => ((y) => x + y);
const mul = (x) => ((y) => x * y);
const div = (x) => ((y) => {
    let res = x / y;
    if(res >= 0) {
        return Math.floor(res);
    } else {
        return Math.ceil(res);
    }
});

const assert_eq = (x, y) => {
    if(x !== y) {
        console.trace();
        console.log("assert failed", x, y);
        throw("");
    }
}

/*
fn t(x) -> impl Fn(i64) -> i64 {
    return move |y| x;
}

fn f(x) -> impl Fn(i64) -> i64 {
    return move |y| y;
}

fn eq(x) -> impl Fn(i64) -> dyn Fn(i64) {
    return move |y| if x == y {t} else {f};
}
*/


const message5 = () => {
    assert_eq(inc(0), 1);
    assert_eq(inc(1), 2);
    assert_eq(inc(2), 3);
    assert_eq(inc(3), 4);

    assert_eq(inc(300), 301);
    assert_eq(inc(301), 302);

    assert_eq(inc(-1), 0);
    assert_eq(inc(-2), -1);
    assert_eq(inc(-3), -2);
}


const message6 = () => {
    // ap dec 1   =   0
    assert_eq(dec(1), 0);
    // ap dec 2   =   1
    assert_eq(dec(2), 1);
    // ap dec 3   =   2
    assert_eq(dec(3), 2);
    // ap dec 4   =   3
    assert_eq(dec(4), 3);
    // ap dec 1024   =   1023
    assert_eq(dec(1024), 1023);

    // ap dec 0   =   -1
    assert_eq(dec(0), -1);
    // ap dec -1   =   -2
    assert_eq(dec(-1), -2);
    // ap dec -2   =   -3
    assert_eq(dec(-2), -3);
}


const message7 = () => {
    // ap ap add 1 2   =   3
    assert_eq(add(1)(2), 3);
    // ap ap add 2 1   =   3
    assert_eq(add(2)(1), 3);
    // ap ap add 0 1   =   1
    assert_eq(add(0)(1), 1);
    // ap ap add 2 3   =   5
    assert_eq(add(2)(3), 5);
    // ap ap add 3 5   =   8
    assert_eq(add(3)(5), 8);
}

const message8 = () => {
    let x0 = 100;
    let x1 = 1337;
    let x2 = 1488;

    // ap ap add 0 x0   =   x0
    assert_eq(add(0)(x0), x0);
    // ap ap add 0 x1   =   x1
    assert_eq(add(0)(x1), x1);
    // ap ap add 0 x2   =   x2
    assert_eq(add(0)(x2), x2);

    // ap ap add x0 0   =   x0
    assert_eq(add(x0)(0), x0);
    // ap ap add x1 0   =   x1
    assert_eq(add(x1)(0), x1);
    // ap ap add x2 0   =   x2
    assert_eq(add(x2)(0), x2);

    // ap ap add x0 x1   =   ap ap add x1 x0
    assert_eq(add(x0)(x1), add(x1)(x0));
}

const message9 = () => {
    let x0 = -255;
    let x1 = 100500;

    // ap ap mul 4 2   =   8
    assert_eq(mul(4)(2), 8);
    // ap ap mul 3 4   =   12
    assert_eq(mul(3)(4), 12);
    // ap ap mul 3 -2   =   -6
    assert_eq(mul(3)(-2), -6);
    // ap ap mul x0 x1   =   ap ap mul x1 x0
    assert_eq(mul(x0)(x1), mul(x1)(x0));
    // ap ap mul x0 0   =   0
    assert_eq(mul(x0)(0), 0);
    // ap ap mul x0 1   =   x0
    assert_eq(mul(x0)(1), x0);
}

const message10 = () => {
    let x0 = 1008;

    // ap ap div 4 2   =   2
    assert_eq(div(4)(2), 2);
    // ap ap div 4 3   =   1
    assert_eq(div(4)(3), 1);
    // ap ap div 4 4   =   1
    assert_eq(div(4)(4), 1);
    // ap ap div 4 5   =   0
    assert_eq(div(4)(5), 0);
    // ap ap div 5 2   =   2
    assert_eq(div(5)(2), 2);
    // ap ap div 6 -2   =   -3
    assert_eq(div(6)(-2), -3);
    // ap ap div 5 -3   =   -1
    assert_eq(div(5)(-3), -1);
    // ap ap div -5 3   =   -1
    assert_eq(div(-5)(3), -1);
    // ap ap div -5 -3   =   1
    assert_eq(div(-5)(-3), 1);
    // ap ap div x0 1   =   x0
    assert_eq(div(x0)(1), x0);
}

const message11 = () => {
    let x0 = 42;

    // ap ap eq x0 x0   =   t
    // assert_eq(eq(x0)(x0), t);

    // ap ap eq 0 -2   =   f
    // ap ap eq 0 -1   =   f
    // ap ap eq 0 0   =   t
    // ap ap eq 0 1   =   f
    // ap ap eq 0 2   =   f
    // ap ap eq 1 -1   =   f
    // ap ap eq 1 0   =   f
    // ap ap eq 1 1   =   t
    // ap ap eq 1 2   =   f
    // ap ap eq 1 3   =   f
    // ap ap eq 2 0   =   f
    // ap ap eq 2 1   =   f
    // ap ap eq 2 2   =   t
    // ap ap eq 2 3   =   f
    // ap ap eq 2 4   =   f
    // ap ap eq 19 20   =   f
    // ap ap eq 20 20   =   t
    // ap ap eq 21 20   =   f
    // ap ap eq -19 -20   =   f
    // ap ap eq -20 -20   =   t
    // ap ap eq -21 -20   =   f
}

function main() {
    console.log("Fn test");
    message5();
    message6();
    message7();
    message8();
    message9();
    message10();
    message11();
    console.log("Test ok");
}

main();