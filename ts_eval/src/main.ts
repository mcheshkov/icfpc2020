import "source-map-support/register";

import {message} from "./messages";
import {send} from "./send";
import {Lam, NumCons, thunk, unk, unthunk, Defer} from "./common";
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

    const Z = unk(function z(f: Lam): Lam {
        let inner = unk(function z1(x) {
            return f(unk(function z2(v) {
                return thunk(() => x(x)(v))
            }));
        });

        return inner(inner);
    });

    console.log("Z", Z);

    // pwr2   =   ap ap s ap ap c ap eq 0 1 ap ap b ap mul 2 ap ap b pwr2 ap add -1
    // const pwr2 = s(c(eq(NumCons(0n)))(NumCons(1n)))(b(mul(NumCons(2n)))(b(pwr2)(add(NumCons(-1n)))));
    const pwr2_z = unk(
        (f) => s(c(eq(NumCons(0n)))(NumCons(1n)))(b(mul(NumCons(2n)))(b(f)(add(NumCons(-1n)))))
    );
    console.log("pwr2_z", pwr2_z);
    const pwr2 = Z(pwr2_z);



    console.log("Z(pwr2_z)", pwr2);
    console.log("thunk", pwr2(NumCons(0n)));
    console.log("unthunk", unthunk(Z(pwr2_z)(NumCons(5n))));
}

main();