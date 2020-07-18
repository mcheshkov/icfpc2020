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
export type LamUnknown = {
    type: "unknown",
}
export type LamObj = LamNumber | LamLit | LamCons | LamList | LamUnknown | LamModulate;
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

export function ListCons(items: Array<Lam>): Lam & LamList {
    const res: Lam & LamList = function list(x2: Lam): Lam {
        let x0 = items[0];
        let x1 = ListCons(items.slice(1));
        return x2(x0)(x1);
    } as any;
    res.type = "list";
    res.items = items;

    return res;
}

import assert from "assert";

export function assertNum(l:Lam, n: bigint) {
    if (l.type !== "number") {
        throw new Error("NUmber expected");
    }
    assert.strictEqual(l.value, n);
}

export function assertNumNum(l:Lam, n: Lam) {
    if (l.type !== "number" || n.type !== "number") {
        throw new Error("NUmber expected");
    }
    assert.strictEqual(l.value, n.value);
}

export function assertModulate(l:Lam, n: Lam) {
    if (l.type !== "modulate" || n.type !== "modulate") {
        throw new Error("NUmber expected");
    }
    assert.strictEqual(l.value, n.value);
}

export function assertLit(l:Lam, ident: string) {
    if (l.type !== "literal") {
        throw new Error("Literal expected");
    }
    assert.strictEqual(l.ident, ident);
}
