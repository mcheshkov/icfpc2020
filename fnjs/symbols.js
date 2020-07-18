let _ = {};

_.add  = (x) => ((y) => x + y);
_.mul = (x) => ((y) => x * y);
_.div = (x) => ((y) => {
    let res = x / y;
    if(res >= 0) {
        return Math.floor(res);
    } else {
        return Math.ceil(res);
    }
});

_.assert_eq = (x, y) => {
    if(x !== y) {
        console.trace();
        console.log("assert failed", x, y);
        throw("");
    }
}

_.t = (x) => ((y) => x);
_.f = (x) => ((y) => y);

_.eq = (x) => ((y) => (x === y ? _.t : _.f));

_.lt = (x) => ((y) => (x < y ? _.t : _.f));

_.mod = (x) => {
    if(typeof(x) === "number") {
        return JSON.stringify({signal:x});
    } else {
        console.trace();
        console.log("cannot modulate", x);
        throw("");
    }
};

_.dem = (x) => JSON.parse(x).signal;

_.neg = (x) => -x;

// inc   =   ap add 1
_.inc = _.add(1);

// dec   =   ap add ap neg 1
_.dec = _.add(_.neg(1));

exports.fn = _;