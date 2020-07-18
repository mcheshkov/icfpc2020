import {NumCons, add, inc, mul, s} from "./common";

console.log(inc(add(NumCons(1n))(NumCons(2n))));

console.log("test S");
// ap ap ap s add inc 1   =   3
console.log(s(add)(inc)(NumCons(1n)));
// ap ap ap s mul ap add 1 6   =   42
console.log(s(mul)(add(NumCons(1n)))(NumCons(6n)));
