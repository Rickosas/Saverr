import asyncio, json
from playwright.async_api import async_playwright
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
async def plus():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(locale='nl-NL', user_agent=UA); got = []; urls=[]
        async def on(r):
            if 'screenservices' in r.url and 'Promotion' in r.url:
                urls.append(r.url)
                try: got.append(await r.json())
                except Exception: pass
        pg.on('response', on)
        await pg.goto('https://www.plus.nl/aanbiedingen', wait_until='networkidle', timeout=60000)
        for _ in range(25): await pg.mouse.wheel(0, 3000); await pg.wait_for_timeout(700)
        await pg.wait_for_timeout(2000)
        print('PLUS urls', [u.split('/')[-1] for u in urls])
        tiles=[]
        def walk(o):
            if isinstance(o, dict):
                if 'PromotionId' in o and o.get('PromotionId'): tiles.append(o)
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        for g in got: walk(g)
        uniq = {t['Slug']: t for t in tiles}
        print('tiles uniek', len(uniq), 'met SKU', sum(1 for t in uniq.values() if t.get('ProductSKU')), 'IsProduct', sum(1 for t in uniq.values() if t.get('IsProduct')))
        for t in list(uniq.values())[:25]:
            print({k: t.get(k) for k in ['Slug','ProductName','Brand','PromotionLabel','PromotionBasedLabel','DisplayInfo_Label','DisplayInfo_PromotionBasedLabel','NewPrice','PriceOriginal','PriceOriginal_Highest','PromotionVariant','PromotionExplanation','ProductSKU','IsProduct','EndDate']})
        txt = await pg.inner_text('body'); i = txt.find('Langlekker'); print('TEKST rond Langlekker', txt[max(0,i-300):i+500].replace('\n',' | '))
        await b.close()
asyncio.run(plus())
