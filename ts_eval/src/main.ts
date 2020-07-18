import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {Lam, NumCons, unthunk} from "./common";
import {cons, nil} from "./symbols";
import {galaxy} from "./galaxy";

export function main(ctx: CanvasRenderingContext2D) {
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

    const walkList = (list: Lam): void => {
        let l = unthunk(list);
        while(l.type === "cons") {
            console.log("LEFT", l.left);
            console.log("LEFT unthunk", unthunk(l.left));
            console.log("RIGHT", l.right);
            l = unthunk(l.right);
        }
    };

    walkList(first_iter);
}

// main(null);