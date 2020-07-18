fn inc(x: i64) -> i64 {
    x + 1
}

fn dec(x: i64) -> i64 {
    x - 1
}

fn add(x: i64) -> impl Fn(i64) -> i64 {
    return move |y| x + y;
}

fn mul(x: i64) -> impl Fn(i64) -> i64 {
    return move |y| x * y;
}

fn div(x: i64) -> impl Fn(i64) -> i64 {
    return move |y| x / y;
}


fn message5() {
    assert_eq!(inc(0), 1);
    assert_eq!(inc(1), 2);
    assert_eq!(inc(2), 3);
    assert_eq!(inc(3), 4);

    assert_eq!(inc(300), 301);
    assert_eq!(inc(301), 302);

    assert_eq!(inc(-1), 0);
    assert_eq!(inc(-2), -1);
    assert_eq!(inc(-3), -2);
}


fn message6() {
    // ap dec 1   =   0
    assert_eq!(dec(1), 0);
    // ap dec 2   =   1
    assert_eq!(dec(2), 1);
    // ap dec 3   =   2
    assert_eq!(dec(3), 2);
    // ap dec 4   =   3
    assert_eq!(dec(4), 3);
    // ap dec 1024   =   1023
    assert_eq!(dec(1024), 1023);

    // ap dec 0   =   -1
    assert_eq!(dec(0), -1);
    // ap dec -1   =   -2
    assert_eq!(dec(-1), -2);
    // ap dec -2   =   -3
    assert_eq!(dec(-2), -3);
}


fn message7() {
    // ap ap add 1 2   =   3
    assert_eq!(add(1)(2), 3);
    // ap ap add 2 1   =   3
    assert_eq!(add(2)(1), 3);
    // ap ap add 0 1   =   1
    assert_eq!(add(0)(1), 1);
    // ap ap add 2 3   =   5
    assert_eq!(add(2)(3), 5);
    // ap ap add 3 5   =   8
    assert_eq!(add(3)(5), 8);
}

fn message8() {
    let x0: i64 = 100;
    let x1: i64 = 1337;
    let x2: i64 = 1488;

    // ap ap add 0 x0   =   x0
    assert_eq!(add(0)(x0), x0);
    // ap ap add 0 x1   =   x1
    assert_eq!(add(0)(x1), x1);
    // ap ap add 0 x2   =   x2
    assert_eq!(add(0)(x2), x2);

    // ap ap add x0 0   =   x0
    assert_eq!(add(x0)(0), x0);
    // ap ap add x1 0   =   x1
    assert_eq!(add(x1)(0), x1);
    // ap ap add x2 0   =   x2
    assert_eq!(add(x2)(0), x2);

    // ap ap add x0 x1   =   ap ap add x1 x0
    assert_eq!(add(x0)(x1), add(x1)(x0));
}

fn message9() {
    let x0: i64 = -255;
    let x1: i64 = 100500;

    // ap ap mul 4 2   =   8
    assert_eq!(mul(4)(2), 8);
    // ap ap mul 3 4   =   12
    assert_eq!(mul(3)(4), 12);
    // ap ap mul 3 -2   =   -6
    assert_eq!(mul(3)(-2), -6);
    // ap ap mul x0 x1   =   ap ap mul x1 x0
    assert_eq!(mul(x0)(x1), mul(x1)(x0));
    // ap ap mul x0 0   =   0
    assert_eq!(mul(x0)(0), 0);
    // ap ap mul x0 1   =   x0
    assert_eq!(mul(x0)(1), x0);
}

fn message10() {
    let x0: i64 = 1008;

    // ap ap div 4 2   =   2
    assert_eq!(div(4)(2), 2);
    // ap ap div 4 3   =   1
    assert_eq!(div(4)(3), 1);
    // ap ap div 4 4   =   1
    assert_eq!(div(4)(4), 1);
    // ap ap div 4 5   =   0
    assert_eq!(div(4)(5), 0);
    // ap ap div 5 2   =   2
    assert_eq!(div(5)(2), 2);
    // ap ap div 6 -2   =   -3
    assert_eq!(div(6)(-2), -3);
    // ap ap div 5 -3   =   -1
    assert_eq!(div(5)(-3), -1);
    // ap ap div -5 3   =   -1
    assert_eq!(div(-5)(3), -1);
    // ap ap div -5 -3   =   1
    assert_eq!(div(-5)(-3), 1);
    // ap ap div x0 1   =   x0
    assert_eq!(div(x0)(1), x0);
}

pub fn main() {
    println!("Fn test");
    message5();
    message6();
    message7();
    message8();
    message9();
    message10();
}