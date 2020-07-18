export type LamNumber = {
    type: "number",
    value: bigint,
}
export type LamLit = {
    type: "literal",
    ident: string,
}
export type LamUnknown = {
    type: "unknown",
}
export type LamObj = LamNumber | LamLit | LamUnknown;
export type LamFn = (a: Lam) => Lam;
export type Lam = LamFn & LamObj;

const bindings = new Map<string, Lam>();

export function Lit(ident: string) : Lam {
    const res: Lam & LamLit = function literal(x: Lam): Lam {
        const body = bindings.get(ident);
        if (body === undefined) {
            throw new Error(`Literal ${ident} body not found`);
        }
        return body(x);
    } as any;
    res.type = "literal";
    res.ident = ident;

    return res;
}

export function NumCons(v: bigint): Lam {
    const res: Lam & LamNumber = function number(): Lam {
        return res;
    } as any;
    res.type = "number";
    res.value = v;

    return res;
}

function unk(f: (a: Lam) => Lam): Lam {
    (f as any).type = "unknown";
    return f as any;
}

function NumUnOp(_name:string, fn:(x: bigint) => bigint) : Lam {
    let res = function sum1(x: Lam): Lam {
        if (x.type !== "number") {
            throw new Error("Bad sum left arg");
        }
        return NumCons(fn(x.value));
    };
    // (res as any).name = name;
    return unk(res);
}

function NumBinOp(_name:string, fn:(x: bigint, y: bigint) => bigint) : Lam {
    let res = unk(function (x: Lam): Lam {
        let res1 = function sum1(y: Lam): Lam {
            if (x.type !== "number") {
                throw new Error("Bad sum left arg");
            }
            if (y.type !== "number") {
                throw new Error("Bad sum left arg");
            }
            return NumCons(fn(x.value, y.value));
        };
        // (res1 as any).name = name + "1";
        return unk(res1);
    });
    // (res as any).name = name;

    return res;
}

export const inc = NumUnOp("inc", (x) => x+1n);
export const dec = NumUnOp("dec", (x) => x-1n);
export const neg = NumUnOp("neg", (x) => -x);
export const add = NumBinOp("add", (x,y) => x+y);
export const mul = NumBinOp("mul", (x,y) => x*y);

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
})

// ap ap t x0 x1   =   x0
export const t = unk(function t(x0: Lam): Lam {
    return unk(function t1(x1) {
        return x0;
    });
});

// ap i x0   =   x0
export const i = unk(function i(x0: Lam): Lam {
    return x0;
});
