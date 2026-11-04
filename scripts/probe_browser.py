# Tijdelijke test: welke data-verzoeken doen PLUS en Lidl in de browser?
import asyncio, json
from playwright.async_api import async_playwright
async def run(url, keys):
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(locale='nl-NL', user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36')
        hits = []
        async def on_resp(r):
            try:
                ct = r.headers.get('content-type', '')
                if 'json' in ct:
                    body = await r.text()
                    if any(k in body for k in keys): hits.append((r.request.method, r.url, len(body), body[:700]))
            except Exception: pass
        pg.on('response', on_resp)
        await pg.goto(url, wait_until='networkidle', timeout=60000)
        await pg.wait_for_timeout(4000)
        print(f'\n===== {url}: {len(hits)} json-responses met prijs/aanbieding')
        for h in hits[:8]: print(h[0], h[1][:200], h[2]); print('   ', h[3].replace('\n', ' ')[:700])
        txt = await pg.inner_text('body'); print('TEKST', txt[:1500].replace('\n', ' | '))
        await b.close()
asyncio.run(run('https://www.plus.nl/aanbiedingen', ['Price', 'price', 'Promotion', 'korting', 'gratis']))
asyncio.run(run('https://www.lidl.nl/c/eten-en-drinken/s10068374', ['price', 'discount', 'deletedPrice']))
