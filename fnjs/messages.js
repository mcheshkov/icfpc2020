const _ = require("./symbols").fn;

exports.message = [];

exports.message[5] = () => {
    _.assert_eq(_.inc(0), 1);
    _.assert_eq(_.inc(1), 2);
    _.assert_eq(_.inc(2), 3);
    _.assert_eq(_.inc(3), 4);

    _.assert_eq(_.inc(300), 301);
    _.assert_eq(_.inc(301), 302);

    _.assert_eq(_.inc(-1), 0);
    _.assert_eq(_.inc(-2), -1);
    _.assert_eq(_.inc(-3), -2);
}


exports.message[6] = () => {
    // ap _.dec 1   =   0
    _.assert_eq(_.dec(1), 0);
    // ap _.dec 2   =   1
    _.assert_eq(_.dec(2), 1);
    // ap _.dec 3   =   2
    _.assert_eq(_.dec(3), 2);
    // ap _.dec 4   =   3
    _.assert_eq(_.dec(4), 3);
    // ap _.dec 1024   =   1023
    _.assert_eq(_.dec(1024), 1023);

    // ap _.dec 0   =   -1
    _.assert_eq(_.dec(0), -1);
    // ap _.dec -1   =   -2
    _.assert_eq(_.dec(-1), -2);
    // ap _.dec -2   =   -3
    _.assert_eq(_.dec(-2), -3);
}


exports.message[7] = () => {
    // ap ap _.add 1 2   =   3
    _.assert_eq(_.add(1)(2), 3);
    // ap ap _.add 2 1   =   3
    _.assert_eq(_.add(2)(1), 3);
    // ap ap _.add 0 1   =   1
    _.assert_eq(_.add(0)(1), 1);
    // ap ap _.add 2 3   =   5
    _.assert_eq(_.add(2)(3), 5);
    // ap ap _.add 3 5   =   8
    _.assert_eq(_.add(3)(5), 8);
}

exports.message[8] = () => {
    let x0 = 100;
    let x1 = 1337;
    let x2 = 1488;

    // ap ap _.add 0 x0   =   x0
    _.assert_eq(_.add(0)(x0), x0);
    // ap ap _.add 0 x1   =   x1
    _.assert_eq(_.add(0)(x1), x1);
    // ap ap _.add 0 x2   =   x2
    _.assert_eq(_.add(0)(x2), x2);

    // ap ap _.add x0 0   =   x0
    _.assert_eq(_.add(x0)(0), x0);
    // ap ap _.add x1 0   =   x1
    _.assert_eq(_.add(x1)(0), x1);
    // ap ap _.add x2 0   =   x2
    _.assert_eq(_.add(x2)(0), x2);

    // ap ap _.add x0 x1   =   ap ap _.add x1 x0
    _.assert_eq(_.add(x0)(x1), _.add(x1)(x0));
}

exports.message[9] = () => {
    let x0 = -255;
    let x1 = 100500;

    // ap ap _.mul 4 2   =   8
    _.assert_eq(_.mul(4)(2), 8);
    // ap ap _.mul 3 4   =   12
    _.assert_eq(_.mul(3)(4), 12);
    // ap ap _.mul 3 -2   =   -6
    _.assert_eq(_.mul(3)(-2), -6);
    // ap ap _.mul x0 x1   =   ap ap _.mul x1 x0
    _.assert_eq(_.mul(x0)(x1), _.mul(x1)(x0));
    // ap ap _.mul x0 0   =   0
    _.assert_eq(_.mul(x0)(0), 0);
    // ap ap _.mul x0 1   =   x0
    _.assert_eq(_.mul(x0)(1), x0);
}

exports.message[10] = () => {
    let x0 = 1008;

    // ap ap _.div 4 2   =   2
    _.assert_eq(_.div(4)(2), 2);
    // ap ap _.div 4 3   =   1
    _.assert_eq(_.div(4)(3), 1);
    // ap ap _.div 4 4   =   1
    _.assert_eq(_.div(4)(4), 1);
    // ap ap _.div 4 5   =   0
    _.assert_eq(_.div(4)(5), 0);
    // ap ap _.div 5 2   =   2
    _.assert_eq(_.div(5)(2), 2);
    // ap ap _.div 6 -2   =   -3
    _.assert_eq(_.div(6)(-2), -3);
    // ap ap _.div 5 -3   =   -1
    _.assert_eq(_.div(5)(-3), -1);
    // ap ap _.div -5 3   =   -1
    _.assert_eq(_.div(-5)(3), -1);
    // ap ap _.div -5 -3   =   1
    _.assert_eq(_.div(-5)(-3), 1);
    // ap ap _.div x0 1   =   x0
    _.assert_eq(_.div(x0)(1), x0);
}

exports.message[11] = () => {
    let x0 = 42;

    // ap ap _.eq x0 x0   =   t
    _.assert_eq(_.eq(x0)(x0), _.t);

    // ap ap _.eq 0 -2   =   f
    _.assert_eq(_.eq(0)(-2), _.f);
    // ap ap _.eq 0 -1   =   f
    _.assert_eq(_.eq(0)(-1), _.f);
    // ap ap _.eq 0 0   =   t
    _.assert_eq(_.eq(0)(0), _.t);
    // ap ap _.eq 0 1   =   f
    _.assert_eq(_.eq(0)(1), _.f);
    // ap ap _.eq 0 2   =   f
    _.assert_eq(_.eq(0)(2), _.f);
    // ap ap _.eq 1 -1   =   f
    _.assert_eq(_.eq(1)(-1), _.f);
    // ap ap _.eq 1 0   =   f
    _.assert_eq(_.eq(1)(0), _.f);
    // ap ap _.eq 1 1   =   t
    _.assert_eq(_.eq(1)(1), _.t);
    // ap ap _.eq 1 2   =   f
    _.assert_eq(_.eq(1)(2), _.f);
    // ap ap _.eq 1 3   =   f
    _.assert_eq(_.eq(1)(3), _.f);
    // ap ap _.eq 2 0   =   f
    _.assert_eq(_.eq(2)(0), _.f);
    // ap ap _.eq 2 1   =   f
    _.assert_eq(_.eq(2)(1), _.f);
    // ap ap _.eq 2 2   =   t
    _.assert_eq(_.eq(2)(2), _.t);
    // ap ap _.eq 2 3   =   f
    _.assert_eq(_.eq(2)(3), _.f);
    // ap ap _.eq 2 4   =   f
    _.assert_eq(_.eq(2)(4), _.f);
    // ap ap _.eq 19 20   =   f
    _.assert_eq(_.eq(19)(20), _.f);
    // ap ap _.eq 20 20   =   t
    _.assert_eq(_.eq(20)(20), _.t);
    // ap ap _.eq 21 20   =   f
    _.assert_eq(_.eq(21)(20), _.f);
    // ap ap _.eq -19 -20   =   f
    _.assert_eq(_.eq(-19)(-20), _.f);
    // ap ap _.eq -20 -20   =   t
    _.assert_eq(_.eq(-20)(-20), _.t);
    // ap ap _.eq -21 -20   =   f
    _.assert_eq(_.eq(-21)(-20), _.f);
}

exports.message[12] = () => {
    // ap ap lt 0 -1   =   f
    _.assert_eq(_.lt(0)(-1), _.f);

    // ap ap lt 0 0   =   f
    _.assert_eq(_.lt(0)(0), _.f);
    // ap ap lt 0 1   =   t
    _.assert_eq(_.lt(0)(1), _.t);
    // ap ap lt 0 2   =   t
    _.assert_eq(_.lt(0)(2), _.t);
    // ...
    // ap ap lt 1 0   =   f
    _.assert_eq(_.lt(1)(0), _.f);
    // ap ap lt 1 1   =   f
    _.assert_eq(_.lt(1)(1), _.f);
    // ap ap lt 1 2   =   t
    _.assert_eq(_.lt(1)(2), _.t);
    // ap ap lt 1 3   =   t
    _.assert_eq(_.lt(1)(3), _.t);
    // ...
    // ap ap lt 2 1   =   f
    _.assert_eq(_.lt(2)(1), _.f);
    // ap ap lt 2 2   =   f
    _.assert_eq(_.lt(2)(2), _.f);
    // ap ap lt 2 3   =   t
    _.assert_eq(_.lt(2)(3), _.t);
    // ap ap lt 2 4   =   t
    _.assert_eq(_.lt(2)(4), _.t);
    // ...
    // ap ap lt 19 20   =   t
    _.assert_eq(_.lt(19)(20), _.t);
    // ap ap lt 20 20   =   f
    _.assert_eq(_.lt(20)(20), _.f);
    // ap ap lt 21 20   =   f
    _.assert_eq(_.lt(21)(20), _.f);
    // ...
    // ap ap lt -19 -20   =   f
    _.assert_eq(_.lt(-19)(-20), _.f);
    // ap ap lt -20 -20   =   f
    _.assert_eq(_.lt(-20)(-20), _.f);
    // ap ap lt -21 -20   =   t
    _.assert_eq(_.lt(-21)(-20), _.t);
}

exports.message[13] = () => {
    // ap mod 0   =   [0]
    _.assert_eq(_.mod(0), JSON.stringify({signal:0}));
    // ap mod 1   =   [1]
    _.assert_eq(_.mod(1), JSON.stringify({signal:1}));
    // ap mod -1   =   [-1]
    _.assert_eq(_.mod(-1), JSON.stringify({signal:-1}));
    // ap mod 2   =   [2]
    _.assert_eq(_.mod(2), JSON.stringify({signal:2}));
    // ap mod -2   =   [-2]
    _.assert_eq(_.mod(-2), JSON.stringify({signal:-2}));
    // ...
    // ap mod 16   =   [16]
    _.assert_eq(_.mod(16), JSON.stringify({signal:16}));
    // ap mod -16   =   [-16]
    _.assert_eq(_.mod(-16), JSON.stringify({signal:-16}));
    // ...
    // ap mod 255   =   [255]
    _.assert_eq(_.mod(255), JSON.stringify({signal:255}));
    // ap mod -255   =   [-255]
    _.assert_eq(_.mod(-255), JSON.stringify({signal:-255}));
    // ap mod 256   =   [256]
    _.assert_eq(_.mod(256), JSON.stringify({signal:256}));
    // ap mod -256   =   [-256]
    _.assert_eq(_.mod(-256), JSON.stringify({signal:-256}));
}

exports.message[14] = () => {
    let x0 = 100500;
    // пришлось добавить особую переменую, потому что dem не работает с числами
    let x1 = JSON.stringify({signal:100500});

    // ap dem ap mod x0   =   x0
    _.assert_eq(_.dem(_.mod(x0)), x0);
    // ap mod ap dem x0   =   x0
    _.assert_eq(_.mod(_.dem(x1)), x1);
}

exports.message[16] = () => {
    // ap neg 0   =   0
    _.assert_eq(_.neg(0), 0);
    // ap neg 1   =   -1
    _.assert_eq(_.neg(1), -1);
    // ap neg -1   =   1
    _.assert_eq(_.neg(-1), 1);
    // ap neg 2   =   -2
    _.assert_eq(_.neg(2), -2);
    // ap neg -2   =   2
    _.assert_eq(_.neg(-2), 2);
}

exports.message[17] = () => {
    let x0 = -42;

    // ap inc ap inc 0   =   2
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap inc ap inc ap inc 0   =   3
    _.assert_eq(_.inc(_.inc(_.inc(0))), 3);
    // ap inc ap dec x0   =   x0
    _.assert_eq(_.dec(_.inc(x0)), x0);
    
    /*
    // ap dec ap inc x0   =   x0
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap dec ap ap add x0 1   =   x0
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap ap add ap ap add 2 3 4   =   9
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap ap add 2 ap ap add 3 4   =   9
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap ap add ap ap mul 2 3 4   =   10
    _.assert_eq(_.inc(_.inc(0)), 2);
    // ap ap mul 2 ap ap add 3 4   =   14
    _.assert_eq(_.inc(_.inc(0)), 2);
    // inc   =   ap add 1
    _.assert_eq(_.inc(_.inc(0)), 2);
    // dec   =   ap add ap neg 1
    _.assert_eq(_.inc(_.inc(0)), 2);
    */
}