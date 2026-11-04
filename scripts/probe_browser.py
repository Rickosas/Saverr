import asyncio, json, re
from playwright.async_api import async_playwright
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
async def plus():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(locale='nl-NL', user_agent=UA); got = []
        async def on(r):
            if 'GetPromotionList' in r.url:
                try: got.append(await r.json())
                except Exception: pass
        pg.on('response', on)
        await pg.goto('https://www.plus.nl/aanbiedingen', wait_until='networkidle', timeout=60000); await pg.wait_for_timeout(3000)
        for _ in range(6): await pg.mouse.wheel(0, 4000); await pg.wait_for_timeout(800)
        print('PLUS responses', len(got))
        L = got[0]['data']['PromotionOfferList']['List']; print('groepen', len(L))
        tiles = [t for g in L for t in g['ProductPromotionBanner']['ProductPromotionTiles']['List']] if 'ProductPromotionBanner' in L[0] else []
        print('tiles', len(tiles)); print(json.dumps(tiles[0], ensure_ascii=False)[:2500] if tiles else json.dumps(L[0], ensure_ascii=False)[:2500])
        print('keys groep', list(L[0].keys()))
        for g in L[1:3]: print(json.dumps(g, ensure_ascii=False)[:1500])
        await b.close()
async def lidl():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(locale='nl-NL', user_agent=UA)
        await pg.goto('https://www.lidl.nl/c/eten-en-drinken/s10068374', wait_until='networkidle', timeout=60000); await pg.wait_for_timeout(3000)
        h = await pg.content(); i = h.find('Bio wortels'); print('\nLIDL html len', len(h), 'pos', i)
        print(h[max(0,i-3000):i+1500])
        for k in ['data-grid-data', 'gridbox', 'data-product', 'productId', 'odsc-tile']:
            print(k, h.count(k))
        await b.close()
asyncio.run(plus()); asyncio.run(lidl())
