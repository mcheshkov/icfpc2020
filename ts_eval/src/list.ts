import {Lam, LamList} from "./common";
import {nil, t} from "./symbols";

export function ListCons(items: Array<Lam>): Lam & LamList {
    if (items.length === 0) return nil;

    const res: Lam & LamList = function list(x2: Lam): Lam {
        if (items.length === 0) {
            return t;
        }

        let x0 = items[0];
        const tail = items.slice(1);
        let x1;
        if (tail.length > 0) {
            x1 = ListCons(tail);
        } else {
            x1 = nil;
        }
        return x2(x0)(x1);
    } as any;
    res.type = "list";
    res.items = items;

    return res;
}