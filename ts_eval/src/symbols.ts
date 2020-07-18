import {Lam, NumUnOp, NumBinOp, NewModulate, NumCons, unk} from "./common";

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
        throw new Error("Bad lt left arg");
    }

    return NewModulate(x.value);
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