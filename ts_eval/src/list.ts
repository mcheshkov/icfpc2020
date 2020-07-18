import {Lam, LamList} from "./common";
import {t} from "./symbols";

export function ListCons(items: Array<Lam>): Lam & LamList {
    const res: Lam & LamList = function list(x2: Lam): Lam {
        if (items.length === 0) {
            return t;
        }

        let x0 = items[0];
        let x1 = ListCons(items.slice(1));
        return x2(x0)(x1);
    } as any;
    res.type = "list";
    res.items = items;

    return res;
}