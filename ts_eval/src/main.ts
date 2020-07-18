import {NumCons, add, inc, mul, s} from "./common";

import {message} from "./messages";
// import {send, real_send} from "./send";

function main() {
    console.log(inc(add(NumCons(1n))(NumCons(2n))));

    console.log("test S");
    // ap ap ap s add inc 1   =   3
    console.log(s(add)(inc)(NumCons(1n)));
    // ap ap ap s mul ap add 1 6   =   42
    console.log(s(mul)(add(NumCons(1n)))(NumCons(6n)));

    console.log("Fn test");
    message[5]();
    message[6]();
    /*
    message[7]();
    message[8]();
    message[9]();
    message[10]();
    message[11]();
    message[12]();
    message[13]();
    message[14]();

    // console.log("send result:", send(42));

    message[16]();
    message[17]();
    message[18]();
    */

    console.log("Test ok");

    // real_send();
}

main();