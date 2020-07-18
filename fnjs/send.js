const _ = require("./symbols").fn;

let response_example = 1337;

const url = "https://icfpc2020-api.testkontur.ru/aliens/send?apiKey=4b5b59dead9e42fbbf203df4e634a2da";

exports.send = (x) => {
    let request = _.mod(x);

    const example_request = "1101000";



    return _.dem(_.mod(response_example));
};

const got = require('got');

exports.real_send = async () => {
    const {body} = await got.post(url, "1101000");

    console.log("response", body);

    return body;
}