const messages = require("./messages");
const {send, real_send} = require("./send");

function main() {
    console.log("Fn test");
    messages.message[5]();
    messages.message[6]();
    messages.message[7]();
    messages.message[8]();
    messages.message[9]();
    messages.message[10]();
    messages.message[11]();
    messages.message[12]();
    messages.message[13]();
    messages.message[14]();

    console.log("send result:", send(42));

    messages.message[16]();
    messages.message[17]();
    messages.message[18]();

    console.log("Test ok");

    // real_send();
}

main();