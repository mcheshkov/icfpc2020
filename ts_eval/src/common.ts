export type Pixel = [bigint, bigint];
export type Pixels = Array<Pixel>;

export type LamNumber = {
    type: "number",
    value: bigint,
}
export type LamModulate = {
    type: "modulate",
    value: bigint,
}
export type LamLit = {
    type: "literal",
    ident: string,
}
export type LamCons = {
    type: "cons",
    left: Lam,
    right: Lam,
}
export type LamList = {
    type: "list",
    items: Array<Lam>,
}
export type LamPicture = {
    type: "picture",
    value: Pixels,
}
export type LamUnknown = {
    type: "unknown",
}
export type LamObj = LamNumber | LamLit | LamCons | LamList | LamUnknown | LamModulate | LamPicture;
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

export function NewModulate(v: bigint): Lam {
    const res: Lam & LamModulate = function modulate(): Lam {
        return res;
    } as any;
    res.type = "modulate";
    res.value = v;

    return res;
}

export function NewPicture(v: Pixels) {
    const res: Lam & LamPicture = function picture(): Lam {
        return res;
    } as any;
    res.type = "picture";
    res.value = v;

    return res;
}

export function unk(f: (a: Lam) => Lam): Lam {
    (f as any).type = "unknown";
    return f as any;
}

export function NumUnOp(_name:string, fn:(x: bigint) => bigint) : Lam {
    let res = function sum1(x: Lam): Lam {
        if (x.type !== "number") {
            throw new Error("Bad sum left arg");
        }
        return NumCons(fn(x.value));
    };
    // (res as any).name = name;
    return unk(res);
}

export function NumBinOp(_name:string, fn:(x: bigint, y: bigint) => bigint) : Lam {
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

import {strictEqual, deepStrictEqual} from "assert";

export function assertNum(l:Lam, n: bigint) {
    if (l.type !== "number") {
        throw new Error("Number expected");
    }
    strictEqual(l.value, n);
}

export function assertNumNum(l:Lam, n: Lam) {
    if (l.type !== "number" || n.type !== "number") {
        throw new Error("NUmber expected");
    }
    strictEqual(l.value, n.value);
}

export function assertModulate(l:Lam, n: Lam) {
    if (l.type !== "modulate" || n.type !== "modulate") {
        throw new Error("NUmber expected");
    }
    strictEqual(l.value, n.value);
}

export function assertPicture(l:Lam, n: Lam) {
    if (n.type !== "picture") {
        throw new Error("NUmber expected");
    }
    if (l.type !== "picture") {
        throw new Error("NUmber expected");
    }

    const comparator: ((x: Pixel, y: Pixel) => number) = ([x1, y1], [x2, y2]) => {
        if(x1 < x2) {
            return -1;
        } else if(x1 > x2) {
            return 1;
        } else {
            if(y1 < y2) {
                return -1;
            } else if(y1 > y2) {
                return 1;
            } else {
                return 0;
            }
        }
    };

    let l_sorted = [...l.value];
    l_sorted.sort(comparator);

    let n_sorted = [...n.value];
    n_sorted.sort(comparator);

    deepStrictEqual(l_sorted, n_sorted);
}

export function assertLit(l:Lam, ident: string) {
    if (l.type !== "literal") {
        throw new Error("Literal expected");
    }
    strictEqual(l.ident, ident);
}
