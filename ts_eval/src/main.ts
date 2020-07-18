import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {Lam, LamCons, LamList, LamNumber, NumCons, unthunk} from "./common";
import {cons, nil} from "./symbols";
import {galaxy} from "./galaxy";
import {ListCons} from "./list";

export function main(ctx: CanvasRenderingContext2D | null) {
    console.log("Fn test");
    message[5]();
    message[6]();
    message[7]();
    message[8]();
    message[9]();
    message[10]();
    message[11]();

    message[12]();
    message[13]();

    message[14]();

    console.log("send result:", send(NumCons(42n)));

    message[16]();
    message[17]();
    message[18]();
    message[19]();
    message[20]();
    message[21]();
    message[22]();
    message[23]();
    message[24]();
    message[25]();
    message[26]();
    message[27]();
    message[28]();
    message[29]();
    message[30]();
    // message[32](ctx); // sample draw
    message[33](ctx); // draw checkerboard

    console.log("Test ok");

    // real_send();

    console.log("galaxy", galaxy);
    const galaxy_u = unthunk(galaxy);
    console.log("galaxy unthunk", galaxy_u);

    const start_state = nil;
    const start_point = cons(NumCons(0n))(NumCons(0n));
    const first_iter = galaxy_u(start_state)(start_point);
    console.log("first_iter", first_iter);
    console.log("first_iter unthunk", unthunk(first_iter));

    const collectConsList = (list: LamCons): Lam & LamList => {
        const res = [];
        while (true) {
            res.push(list.left);
            const tail = unthunk(list.right);
            if (tail === nil) {
                break;
            } else if (tail.type == "cons") {
                list = tail;
            } else {
                throw new Error("Not a cons");
            }
        }
        return ListCons(res);
    }

    const collectList = (list: Lam): Lam & LamList => {
        const l = unthunk(list);
        if (l.type === "list") {
            return l;
        } else if (l.type === "cons") {
            return collectConsList(l);
        } else {
            throw new Error("Not a list");
        }
    }

    // (flag, newState, data)
    const parseProtocolResponse = (response: Lam): [Lam & LamNumber, Lam & LamList, Lam & LamList] => {
        const respList = collectList(response);
        if (respList.items.length < 3) {
            throw new Error("Not enough elems in response");
        }

        const [flagLam, stateLam, dataLam] = respList.items;
        const flag = unthunk(flagLam);
        if (flag.type !== "number") {
            throw new Error("Flag is not a number");
        }

        // TODO maybe single number?
        const state = collectList(stateLam);

        // TODO maybe single number?
        const data = collectList(dataLam);

        return [flag, state, data];
    };

    console.log(parseProtocolResponse(first_iter));
}

main(null);