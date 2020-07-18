import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {Lam, NumCons, thunk, unk, unthunk} from "./common";
import {ListCons} from "./list";
import {b, c, i, s, t, car, cdr, cons, isnil, nil, add, div, eq, lt, mul, neg} from "./symbols";

function main() {
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
    message[32]();

    console.log("Test ok");

    // real_send();
}

main();