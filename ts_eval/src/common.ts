export type LamNumber = {
    type: "number",
    value: bigint,
}
export type LamUnknown = {
    type: "unknown",
}
export type LamObj = LamNumber | LamUnknown;
export type LamFn = (a: Lam) => Lam;
export type Lam = LamFn & LamObj;

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
export const add = NumBinOp("add", (x,y) => x+y);
export const mul = NumBinOp("mul", (x,y) => x*y);

export function s(x0: Lam): Lam {
    return unk(function s1(x1) {
        return unk(function s2(x2) {
            let b = x0(x2);
            let c = x1(x2);
            return b(c);
        });
    });
}