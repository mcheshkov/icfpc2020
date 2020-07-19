import * as _ from "./symbols";
import {Lam, NumUnOp, NumBinOp, NewModulate, NumCons, unk} from "./common";
import {modulateLam, demodulate} from "./modulation";

const url = "https://icfpc2020-api.testkontur.ru/aliens/send?apiKey=4b5b59dead9e42fbbf203df4e634a2da";

export async function send(x: Lam): Promise<Lam> {

    let request = modulateLam(x);

    console.log("send request", request);

    let response = await fetch(url, {
    	method: 'POST', 
    	body: request
    });

    let response_text = await response.text();

    let demodulated = demodulate(response_text);

    console.log("get response", response_text);
    console.log("demod", demodulated);

    return NumCons(0n);
};