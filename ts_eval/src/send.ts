import * as _ from "./symbols";
import {Lam, NumUnOp, NumBinOp, NewModulate, NumCons, unk} from "./common";
// const got = require('got');

const response_example = 1337n;

const url = "https://icfpc2020-api.testkontur.ru/aliens/send?apiKey=4b5b59dead9e42fbbf203df4e634a2da";

export const send = unk((x: Lam): Lam => {
	console.log("send request");

    let request = _.mod(x);

    return _.dem(_.mod(NumCons(response_example)));
});


/*
exports.real_send = async () => {
    const {body} = await got.post(url, "1101000");

    console.log("response", body);

    return body;
}
*/