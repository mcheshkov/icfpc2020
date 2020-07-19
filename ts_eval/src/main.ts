import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {
    Lam, LamCons, LamList, LamNumber, LamData,
    NumCons, unthunk, dataToString
} from "./common";
import {cons, nil, convertToPicture, vec} from "./symbols";
import {galaxy} from "./galaxy";
import {ListCons} from "./list";

// console.log("galaxy", galaxy);
const galaxy_u = unthunk(galaxy);
// console.log("galaxy unthunk", galaxy_u);

const consMap = (list: LamCons, fn: (l:Lam) => Lam): Lam & LamCons => {
    return cons(fn(list.left))(fn(list.right)) as any;
}

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

function interact(protocol: Lam, state: LamData, vector: LamData): [LamData, LamData] {
    while (true) {
        const protocol_response = protocol(state)(vector);
        const [flag, newState, data] = parseProtocolResponse(protocol_response);
        if (flag.value === 0n) {
            return [newState, data];
        } else {
            state = newState;
            vector = collectData(send(data));
        }
    }
}

export function interact_galaxy(x: number, y: number, state: LamData): [LamData, LamData] {
    const point = cons(NumCons(BigInt(x)))(NumCons(BigInt(y)));

    return interact(galaxy_u, state, point as LamData);
}

export const initState: LamData = vec(
    NumCons(1n)
)(
    vec(
        ListCons([NumCons(8n)])
    )(
        ListCons([NumCons(0n), ListCons([])])
    )
) as LamData;

export function main() {
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

    console.log("Test ok");
}

if (process && process.env && process.env.SHELL) {
    console.log("Running in shell, call main", process.env);
    main();
}
