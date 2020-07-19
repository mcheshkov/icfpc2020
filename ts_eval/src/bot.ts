import got from "got";

const serverUrl = process.argv[2];
const playerKey = process.argv[3];

console.log(`ServerUrl: ${serverUrl}; playerKey: ${playerKey}`);

async function sendRequest() {
    try {
        const response = await got.post(`${serverUrl}`, {body: `${playerKey}`});
        console.log(`Server response:`, response.body);
    } catch (e) {
        console.log(`Unexpected server response:\n`, e);
        if (typeof e.response !== 'undefined') {
            console.log(`\nResponse body:`, e.response.body);
        }
        process.exit(1);
    }
}

async function main() {
    await sendRequest();
}

main()
.catch((e) => {
    console.log(e);
    console.log(e.stack);
    process.exit(1);
});
