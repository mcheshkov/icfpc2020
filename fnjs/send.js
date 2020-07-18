const _ = require("./symbols").fn;

let response_example = 1337;

exports.send = (x) => {
	let request = _.mod(x);

	return _.dem(_.mod(response_example));
};