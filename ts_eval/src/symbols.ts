import {
    Lam, NumUnOp, NumBinOp, NewModulate, NumCons, unk, LamCons, LamList,
    NewPicture, Pixels, thunk, unthunk,
    empty_thunk
} from "./common";

export const add = NumBinOp("add", (x,y) => x+y);
export const mul = NumBinOp("mul", (x,y) => x*y);
export const neg = NumUnOp("neg", (x) => -x);
export const div = NumBinOp("div", (x,y) => x / y);


// inc   =   ap add 1
export const inc = add(NumCons(1n));

// dec   =   ap add ap neg 1
export const dec = add(neg(NumCons(1n)));


// ap ap t x0 x1   =   x0
export const t = unk(function t(x0: Lam): Lam {
    return unk(function t1(x1) {
        return x0;
    });
});

export const f = unk(function t(x0: Lam): Lam {
    return unk(function t1(x1) {
        return x1;
    });
});

export const eq = unk(function eq(x: Lam) : Lam {
    return unk((y: Lam) => {
        return thunk(() => {
            let xx = unthunk(x);
            if (xx.type !== "number") {
                throw new Error("Bad eq left arg");
            }
            let yy = unthunk(y);
            if (yy.type !== "number") {
                throw new Error("Bad eq left arg");
            }

            if (xx.value === yy.value) {
                return t;
            } else {
                return f;
            }
        });
    });
});

export const lt = unk(function lt(x: Lam) : Lam {
    return unk((y: Lam) => {
        return thunk(() => {
            let xx = unthunk(x);
            if (xx.type !== "number") {
                throw new Error("Bad lt left arg");
            }
            let yy = unthunk(y);
            if (yy.type !== "number") {
                throw new Error("Bad lt left arg");
            }

            if(xx.value < yy.value) {
                return t;
            } else {
                return f;
            }
        });
    });
});

export const mod = unk((x: Lam): Lam => {
    if (x.type !== "number") {
        throw new Error("Bad modulate left arg");
    }

    return NewModulate(x.value);
});

export const dem = unk((x: Lam): Lam => {
    if (x.type !== "modulate") {
        throw new Error("Bad demodulate left arg");
    }

    return NumCons(x.value);
});

// ap i x0   =   x0
export const i = unk(function i(x0: Lam): Lam {
    return x0;
});

// ap ap ap s x0 x1 x2   =   ap ap x0 x2 ap x1 x2
export const s = unk(function s(x0: Lam): Lam {
    return unk(function s1(x1) {
        return unk(function s2(x2) {
            let b = x0(x2);
            let c = x1(x2);
            return b(c);
        });
    });
});

// ap ap ap c x0 x1 x2   =   ap ap x0 x2 x1
export const c = unk(function c(x0: Lam): Lam {
    return unk(function s1(x1) {
        return unk(function s2(x2) {
            let b = x0(x2);
            return b(x1);
        });
    });
});

// ap ap ap b x0 x1 x2   =   ap x0 ap x1 x2
export const b = unk(function b(x0: Lam): Lam {
    return unk(function b1(x1) {
        return unk(function b2(x2) {
            let b = x1(x2);
            return x0(b);
        });
    });
});

const Z = unk(function z(f: Lam): Lam {
    let inner = unk(function z1(x) {
        return f(unk(function z2(v) {
            return thunk(() => x(x)(v))
        }));
    });

    return inner(inner);
});

// pwr2   =   ap ap s ap ap c ap eq 0 1 ap ap b ap mul 2 ap ap b pwr2 ap add -1
// const pwr2 = s(c(eq(NumCons(0n)))(NumCons(1n)))(b(mul(NumCons(2n)))(b(pwr2)(add(NumCons(-1n)))));
const pwr2_z = unk(
    (f) => s(c(eq(NumCons(0n)))(NumCons(1n)))(b(mul(NumCons(2n)))(b(f)(add(NumCons(-1n)))))
);
export const pwr2 = Z(pwr2_z);

// ap ap ap cons x0 x1 x2   =   ap ap x2 x0 x1
export const cons = unk(function cons(x0: Lam): Lam {
    return unk(function cons1(x1) {
        const cons2 : Lam & LamCons = function cons2(x2: Lam): Lam {
            return x2(x0)(x1);
        } as any;
        cons2.type = "cons";
        cons2.left = x0;
        cons2.right = x1;

        return cons2;
    });
});

// ap car x2   =   ap x2 t
export const car = unk(function car(x0: Lam): Lam {
    return x0(t);
});

// ap cdr x2   =   ap x2 f
export const cdr = unk(function cdr(x0: Lam): Lam {
    return x0(f);
});

// ap nil x0   =   t
export const nil: Lam & LamList = function nil(): Lam {
    return t;
} as any;
nil.type = "list";
nil.items = [];

// ap isnil nil   =   t
// ap isnil ap ap cons x0 x1   =   f
export const isnil = unk(function isnil(x0: Lam): Lam {
    if (x0 == nil) {
        return t;
    } else {
        // TODO proper implementation
        return f;
    }
});

export const vec = cons;

function list_unpack(pixels: Pixels, l: Lam): Pixels {
    l = unthunk(l);

    // console.log(l.type);

    if(l.type === "cons") {
        // console.log(l.left.type, l.right.type);

        let left = unthunk(l.left);
        let right = unthunk(l.right);

        if(left.type === "number" && right.type === "number") {
            return [...pixels, [left.value, right.value]];
        } else {
            // try to iterate over list
            let list: Lam = l;
            while(isnil(list) === f) {
                pixels = list_unpack(pixels, car(list));
                list = unthunk(cdr(list));
            }

            return pixels;
        }

    } else if(l.type === "list") {

        return l.items.reduce((acc, x) => list_unpack(acc, x), pixels);

    } else {

        throw new Error("Bad list in picture:" + l);

    }
}

export const draw = unk((x: Lam): Lam => {
    return NewPicture(list_unpack([], x));
});

export const checkerboard = empty_thunk();
checkerboard.result = s(b(s)(c(b(c)(b(c(c(s(b(s)(b(b(s(i)(i)))(lt)))(eq))))(s(mul)(i))))(nil)))(s(b(s)(b(b(cons))(s(b(s)(b(b(cons))(c(div))))(c(s(b(b)(c(b(b)(add))(neg)))(b(s(mul))(div)))))))(c(b(b)(checkerboard))(c(add)(NumCons(2n)))));