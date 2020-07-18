import {Lam, NumUnOp, NumBinOp, NewModulate, NumCons, unk, LamCons} from "./common";

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

export function eq(x: Lam) : Lam {
    return unk((y: Lam) => {
        if (x.type !== "number") {
            throw new Error("Bad eq left arg");
        }
        if (y.type !== "number") {
            throw new Error("Bad eq left arg");
        }

        if(x.value === y.value) {
            return t;
        } else {
            return f;
        }
    });
}

export function lt(x: Lam) : Lam {
    return unk((y: Lam) => {
        if (x.type !== "number") {
            throw new Error("Bad lt left arg");
        }
        if (y.type !== "number") {
            throw new Error("Bad lt left arg");
        }

        if(x.value < y.value) {
            return t;
        } else {
            return f;
        }
    });
}

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
export const nil = unk(function nil(): Lam {
    return t;
});
