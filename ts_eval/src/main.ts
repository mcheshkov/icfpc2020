import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {Lam, LamCons, LamList, LamNumber, NumCons, unthunk, drawPicture} from "./common";
import {cons, nil, draw} from "./symbols";
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
    // message[33](ctx); // draw checkerboard

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

    const collectConsList = (list: LamCons): (Lam & LamList) | null => {
        const res = [];
        while (true) {
            res.push(list.left);
            const tail = unthunk(list.right);
            if (tail === nil) {
                break;
            } else if (tail.type == "cons") {
                list = tail;
            } else {
                return null;
            }
        }
        return ListCons(res);
    }

    const collectList = (list: Lam): Lam & (LamList|LamCons) => {
        const l = unthunk(list);
        if (l.type === "list") {
            return l;
        } else if (l.type === "cons") {
            const collected = collectConsList(l);
            return collected != null ? collected : l;
        } else {
            throw new Error("Not a list");
        }
    }

    const consMap = (list: LamCons, fn: (l:Lam) => Lam): Lam & LamCons => {
        return cons(fn(list.left))(fn(list.right)) as any;
    }

    type LamData = LamCons|LamList|LamNumber;

    const collectData = (data: Lam): Lam & (LamData) => {
        const l = unthunk(data);
        if (l.type === "list") {
            return ListCons(l.items.map(collectData));
        } else if (l.type === "cons") {
            let list = collectList(l);
            if (list.type === "list") {
                return collectData(list);
            } else {
                return consMap(list, collectData);
            }
        } else if (l.type === "number") {
            return l;
        } else {
            throw new Error(`Not a data ${l}`);
        }
    }

    function dataToString(data: LamData): string {
        function isData(l: Lam): l is Lam & LamData {
            return l.type === "number" || l.type === "list" || l.type === "cons";
        }

        switch (data.type) {
            case "list":
                return "[" + data.items
                        .map(i => {
                            if (!isData(i)) {
                                throw new Error(`Bad type in data: ${i}`);
                            }
                            return i;
                        })
                        .filter(i => isData(i))
                        .map(i => dataToString(i))
                        .join(", ")
                    + "]";
            case "number":
                return data.value.toString(10);
            case "cons": {
                const left = data.left;
                if (! isData(left)) {
                    throw new Error(`Left in cons is not data: ${left}`);
                }

                const right = data.right;
                if (! isData(right)) {
                    throw new Error(`Right in cons is not data: ${right}`);
                }

                return `(${dataToString(left)},${dataToString(right)})`;
            }
        }
    }

    // (flag, newState, data)
    const parseProtocolResponse = (response: Lam): [Lam & LamNumber, Lam & LamData, Lam & LamData] => {
        const respList = collectList(response);
        if (respList.type !== "list") {
            throw new Error("Not a list in response");
        }
        if (respList.items.length < 3) {
            throw new Error("Not enough elems in response");
        }

        const [flagLam, stateLam, dataLam] = respList.items;
        const flag = unthunk(flagLam);
        if (flag.type !== "number") {
            throw new Error("Flag is not a number");
        }

        const state = collectData(stateLam);
        const data = collectData(dataLam);

        return [flag, state, data];
    };

    const parsed = parseProtocolResponse(first_iter);

    console.log("parsed", parsed);
    console.log("newState", dataToString(parsed[1]));
    console.log("data", dataToString(parsed[2]));

    drawPicture(draw(parseProtocolResponse(first_iter)[2]), ctx);
}

// main(null);