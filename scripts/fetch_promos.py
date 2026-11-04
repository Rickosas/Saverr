#!/usr/bin/env python3
"""
Saverr – actuele aanbiedingen ophalen (Albert Heijn bonus + Jumbo aanbiedingen).

Schrijft data/promos.json:
  { "updated": "2026-11-04", "items": { "ah|wi367556": {...}, "jumbo|751918PAK": {...} } }
Per product: l = label ("1+1 gratis"), t = geldig t/m, m = minimaal aantal, u = prijs per stuk
bij dat aantal (wordt in build_data.py berekend met de normale prijs), raw = mechanisme-info.

Let op: dit gebruikt de openbare website/app-gegevens van AH en Jumbo (geen officiële API).
Gaat er iets mis, dan blijft het vorige bestand staan en werkt de app gewoon verder.
"""
import datetime, html, json, os, re, sys, time
import requests

_get = requests.get
def get_retry(*a, **kw):
    """requests.get met 3 pogingen (sites zijn soms even traag)"""
    kw['timeout'] = max(kw.get('timeout', 30), 45)
    for i in range(3):
        try:
            return _get(*a, **kw)
        except requests.RequestException:
            if i == 2: raise
            time.sleep(5 * (i + 1))
requests.get = get_retry

sys.path.insert(0, os.path.dirname(__file__))
from specs import SPECS  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'promos.json')
UA_WEB = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          'accept-language': 'nl-NL,nl;q=0.9'}
items = {}
stats = {}
IMG = {}   # productfoto's per winkel: {winkel: {sleutel: url of AH-code}}
def img(store, key, url):
    if url: IMG.setdefault(store, {})[str(key)] = url

def lidl_norm(s):
    s = re.sub(r'^[-\s]+', '', (s or '').lower())
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9%+ ]', ' ', s)).strip()


# ------------------------------------------------------------------ Albert Heijn
def fetch_ah():
    H = {'x-application': 'AHWEBSHOP', 'user-agent': 'Appie/8.22.3 Model/phone Android/13', 'content-type': 'application/json; charset=UTF-8'}
    tok = requests.post('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', headers=H, json={'clientId': 'appie'}, timeout=20).json()['access_token']
    H['Authorization'] = 'Bearer ' + tok
    SKIP = re.compile(r'volume voordeel|kaartkorting|feestfavoriet|gall', re.I)
    horizon = (datetime.date.today() + datetime.timedelta(days=45)).isoformat()
    def add(products):
        for p in products:
            # foto van elk AH-product bewaren (alleen de code, de rest van de URL is altijd hetzelfde)
            for im in p.get('images') or []:
                m = re.search(r'/product/(AHI_[^?]+)', im.get('url') or '')
                if m: img('ah', f"wi{p.get('webshopId')}", m.group(1)); break
            mech = (p.get('bonusMechanism') or '').strip()
            end = p.get('bonusEndDate')
            # alleen echte (week)acties: geen permanente volumevoordelen of acties die "tot 2999" lopen
            start = p.get('bonusStartDate')
            if not mech or not p.get('webshopId') or SKIP.search(mech) or (end and end > horizon): continue
            if start and start > datetime.date.today().isoformat(): continue      # bonus van volgende week nog niet meetellen
            items[f"ah|wi{p['webshopId']}"] = dict(l=mech, t=end, now=p.get('currentPrice'), reg=p.get('priceBeforeBonus'), name=p.get('title'))
    def search(params):
        r = requests.get('https://api.ah.nl/mobile-services/product/search/v2', params=params, headers=H, timeout=30)
        r.raise_for_status(); return r.json()
    def crawl(tax_id, name):
        page = 0
        while page < 4:                       # AH toont maximaal 3000 resultaten (4 pagina's van 750)
            try:
                j = search({'taxonomyId': tax_id, 'bonus': 'true', 'size': 750, 'page': page, 'sortOn': 'RELEVANCE'})
            except Exception as e:
                print('AH mislukt:', name, e); return
            add(j.get('products', []))
            page += 1
            if page >= (j.get('page') or {}).get('totalPages', 1): return
            time.sleep(0.3)
    # het hele assortiment per categorie doorlopen (grote categorieën per subcategorie) → de complete bonuslijst
    cats = requests.get('https://api.ah.nl/mobile-services/v1/product-shelves/categories', headers=H, timeout=30).json()
    for c in cats:
        try:
            first = search({'taxonomyId': c['id'], 'bonus': 'true', 'size': 1, 'page': 0})
            total = (first.get('page') or {}).get('totalElements', 0)
        except Exception:
            total = 0
        if total > 3000:
            try:
                subs = requests.get(f"https://api.ah.nl/mobile-services/v1/product-shelves/categories/{c['id']}/sub-categories", headers=H, timeout=30).json()
                subs = subs.get('children', subs) if isinstance(subs, dict) else subs
            except Exception:
                subs = []
            for sc in subs or [{'id': c['id'], 'name': c['name']}]:
                crawl(sc['id'], sc.get('name')); time.sleep(0.2)
        else:
            crawl(c['id'], c.get('name'))
        time.sleep(0.3)
    stats['ah'] = len([k for k in items if k.startswith('ah|')])

# ------------------------------------------------------------------ Jumbo
MONTHS = {'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6, 'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12}
def until_date(txt):
    m = re.search(r't/m \w{2} (\d{1,2}) (\w{3})', txt or '')
    if not m or m.group(2) not in MONTHS: return None
    today = datetime.date.today(); y = today.year
    d = datetime.date(y, MONTHS[m.group(2)], int(m.group(1)))
    if d < today - datetime.timedelta(days=60): d = d.replace(year=y + 1)
    return d.isoformat()

def clean(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>|<!--.*?-->', ' ', s))).strip()

def fetch_jumbo():
    t = requests.get('https://www.jumbo.com/aanbiedingen/nu', headers=UA_WEB, timeout=30).text
    promos = []
    for m in re.finditer(r'<a href="(/aanbiedingen/[^"#?]+/\d+)" class="title-link"[^>]*>(.*?)</a>', t, re.S):
        link, title = m.group(1), clean(m.group(2))
        before = t[max(0, m.start() - 2500):m.start()]
        tags = re.findall(r'data-testid="jum-tag"[^>]*>(.*?)</span>', before, re.S)
        label = clean(tags[-1]) if tags else ''
        after = clean(t[m.end():m.end() + 700])
        promos.append(dict(link=link, title=title, l=label, t=until_date(after)))
    seen = set()
    for pr in promos:
        if pr['link'] in seen or not pr['l']: continue
        seen.add(pr['link'])
        try:
            t2 = requests.get('https://www.jumbo.com' + pr['link'], headers=UA_WEB, timeout=30).text
        except Exception as e:
            print('Jumbo promo mislukt', pr['link'], e); continue
        ids = set(re.findall(r'href="/producten/[^"#?]*-(\d+[A-Z]+)"', t2))
        for m in re.finditer(r'href="/producten/[^"#?]*-(\d+[A-Z]+)"', t2):   # foto die bij de producttegel hoort
            im = re.search(r'(https://www\.jumbo\.com/dam-images/[^"\s]+)', t2[m.end():m.end() + 2500])
            if im and m.group(1) not in IMG.get('jumbo', {}): img('jumbo', m.group(1), im.group(1).replace('&amp;', '&'))
        for pid in ids:
            items[f'jumbo|{pid}'] = dict(l=pr['l'], t=pr['t'], name=pr['title'])
        time.sleep(0.6)
    stats['jumbo_promoties'] = len(seen)
    stats['jumbo'] = len([k for k in items if k.startswith('jumbo|')])

# ------------------------------------------------------------------ Dirk
def euro_txt(x): return f'{x:.2f}'.replace('.', ',')

def nuxt_payload(t):
    arr = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
    memo, busy = {}, set()
    def res(i):
        # Nuxt-payload: getallen verwijzen naar andere plekken in de lijst; elk item maar één keer uitpakken
        if not isinstance(i, int) or isinstance(i, bool): return i
        if i in memo: return memo[i]
        if i in busy or i < 0 or i >= len(arr): return None
        busy.add(i); v = arr[i]
        if isinstance(v, list):
            out = res(v[1]) if (v and v[0] in ('ShallowReactive', 'Reactive', 'Ref', 'ShallowRef')) else [res(x) for x in v]
        elif isinstance(v, dict):
            out = {k: res(x) for k, x in v.items()}
        else:
            out = v
        busy.discard(i); memo[i] = out
        return out
    return res(0)

def walk(o, pred, out):
    if isinstance(o, dict):
        if pred(o): out.append(o)
        for v in o.values(): walk(v, pred, out)
    elif isinstance(o, list):
        for v in o: walk(v, pred, out)
    return out

MECH = re.compile(r'gratis|voor|korting|halve', re.I)

def fetch_detailresult(store, url):
    """Dirk en DekaMarkt draaien op hetzelfde systeem."""
    t = requests.get(url, headers=UA_WEB, timeout=30).text
    offers = walk(nuxt_payload(t), lambda d: 'offerPrice' in d and isinstance(d.get('products'), list), [])
    n = 0
    for o in offers:
        sign = re.sub(r'\s+', ' ', (o.get('textPriceSign') or '')).strip()
        end = (o.get('endDate') or '')[:10] or None
        mech = bool(MECH.search(sign))
        for pr in o['products']:
            if not isinstance(pr, dict) or not pr.get('productId'): continue
            price = pr.get('offerPrice') or o.get('offerPrice')
            if mech:
                label = sign[:1].upper() + sign[1:].lower()        # bijv. "1+1 gratis", "2 voor 1,99", "25% korting"
                items[f"{store}|{pr['productId']}"] = dict(l=label, t=end, reg=pr.get('normalPrice') or None, name=o.get('headerText'))
            elif price:
                label = ('Weekendactie ' if 'VR, ZA' in sign else 'Actie ') + '€' + euro_txt(price)
                items[f"{store}|{pr['productId']}"] = dict(l=label, t=end, unit=price, reg=pr.get('normalPrice') or None, name=o.get('headerText'))
            else:
                continue
            pim = (pr.get('productInformation') or {}).get('image')
            if pim: img(store, pr['productId'], f'https://web-fileserver.{"dirk" if store == "dirk" else "dekamarkt"}.nl/' + pim)
            # ook op productnaam opslaan (DekaMarkt gebruikt op de site andere nummers dan in de prijsdata)
            nm = ((pr.get('productInformation') or {}).get('headerText') or '')
            if nm and pim: img(store + 'name', lidl_norm(nm), f'https://web-fileserver.{"dirk" if store == "dirk" else "dekamarkt"}.nl/' + pim)
            if nm: items[f"{store}name|{lidl_norm(nm)}"] = items[f"{store}|{pr['productId']}"]
            n += 1
    stats[store] = n

def fetch_dirk(): fetch_detailresult('dirk', 'https://www.dirk.nl/aanbiedingen')
def fetch_deka(): fetch_detailresult('dekamarkt', 'https://www.dekamarkt.nl/aanbiedingen')

# ------------------------------------------------------------------ Poiesz
def fetch_poiesz():
    t = requests.get('https://webwinkel.poiesz-supermarkten.nl/aanbiedingen', headers=UA_WEB, timeout=30).text
    promos = walk(nuxt_payload(t), lambda d: 'offerTypeLine1' in d and 'productIDs' in d, [])
    n = 0
    for o in promos:
        typ = ' '.join(str(o.get(k) or '') for k in ('offerTypeLine1', 'offerTypeLine2', 'offerTypeLine3')).strip()
        lo, hi = o.get('newPriceLow'), o.get('newPriceHigh')
        end = (o.get('validUntil') or '')[:10] or None
        if end:  # 'validUntil' is middernacht ná de laatste dag
            end = (datetime.date.fromisoformat(end) - datetime.timedelta(days=1)).isoformat()
        m = re.match(r'(\d+)\s*VOOR', typ, re.I)
        per_product = {p.get('id'): p for p in (o.get('overviewProducts') or []) if isinstance(p, dict)}
        for pid in o.get('productIDs') or []:
            op = per_product.get(pid, {})
            if m and lo:
                d = dict(l=f'{m.group(1)} voor {euro_txt(lo)}')
            elif MECH.search(typ):
                d = dict(l=typ[:1].upper() + typ[1:].lower())
            elif lo and (lo == hi or op.get('price')):
                price = op.get('price') or lo
                d = dict(l='Actie €' + euro_txt(price), unit=price)
            else:
                continue
            d.update(t=end, reg=op.get('strikeThroughPrice') or None, name=o.get('commercialTextLine1'))
            items[f'poiesz|{pid}'] = d; n += 1
    stats['poiesz'] = n

# ------------------------------------------------------------------ Aldi (zit niet in Checkjebon: we nemen de aanbiedingen zelf op)
ALDI = []
def fetch_aldi():
    t = requests.get('https://www.aldi.nl/aanbiedingen.html', headers=UA_WEB, timeout=30).text
    nd = json.loads(re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
    api = walk(nd, lambda d: 'apiData' in d, [])
    data = json.loads(api[0]['apiData'])
    for entry in data:
        res = entry[1].get('res') if isinstance(entry, list) and len(entry) > 1 else None
        if not isinstance(res, dict) or 'algoliaDataMap' not in res: continue
        for v in res['algoliaDataMap'].values():
            cp = v.get('currentPrice') or {}
            price, strike = cp.get('priceValue'), cp.get('strikePrice')
            if isinstance(strike, dict): strike = strike.get('strikePriceValue') or strike.get('priceValue') or strike.get('value')
            if not price or not strike or strike <= price: continue          # alleen echte kortingen
            lab = ((cp.get('priceTagLabels') or {}).get('promoText1') or '').strip()
            until = ((v.get('promotionPrices') or [{}])[0]).get('validUntilLocalDate')
            nm = ((v.get('brandName') or '').title() + ' ' + (v.get('name') or '')).strip()
            ALDI.append([nm, round(price, 2), round(strike, 2), v.get('salesUnit') or '', (v.get('productSlug') or '') + '.html',
                         lab if lab and lab not in ('OP=OP', 'NU VOOR', 'VANAF') else f'-{round((1 - price / strike) * 100)}%', until,
                         ((v.get('assets') or [{}])[0].get('url') or '')])
    stats['aldi'] = len(ALDI)

# ------------------------------------------------------------------ Lidl
def fetch_lidl():
    t = requests.get('https://www.lidl.nl/c/eten-en-drinken/s10068374', headers=UA_WEB, timeout=30).text
    n = 0
    for g in re.findall(r'data-grid-data="([^"]+)"', t):
        try:
            j = json.loads(html.unescape(g))
        except Exception:
            continue
        title = j.get('fullTitle') or j.get('title')
        rp = j.get('regionsPrices') or {}
        reg = rp.get('1') or (next(iter(rp.values())) if rp else None)
        if not title or not reg: continue
        cur = reg.get('currentPrice') or {}
        plus = (reg.get('currentLidlPlusPrice') or {}).get('price') or {}
        price, old = cur.get('price'), cur.get('oldPrice') or ((cur.get('discount') or {}).get('deletedPrice'))
        if price and old and price < old:
            unit, label, end = price, 'Actie €' + euro_txt(price), (cur.get('endDate') or '')[:10]
        elif plus.get('price') and price and plus['price'] < price:
            unit, label, end = plus['price'], 'Lidl Plus €' + euro_txt(plus['price']), (plus.get('endDate') or '')[:10]
        else:
            continue
        if end.startswith('2200'): end = None
        il = j.get('imageList_V1') or []
        if il: img('lidlname', lidl_norm(title), il[0].get('image'))
        items[f'lidlname|{lidl_norm(title)}'] = dict(l=label, t=end or None, unit=unit, reg=old or price, name=title)
        n += 1
    stats['lidl'] = n

for name, fn in (('Albert Heijn', fetch_ah), ('Jumbo', fetch_jumbo), ('Dirk', fetch_dirk), ('DekaMarkt', fetch_deka),
                 ('Poiesz', fetch_poiesz), ('Lidl', fetch_lidl), ('Aldi', fetch_aldi)):
    try:
        fn()
    except Exception as e:
        print(f'{name}: ophalen mislukt ({e})')

# winkels die vandaag mislukten: acties van de vorige keer gebruiken (verlopen acties vallen er in build_data vanzelf af)
try:
    prev = json.load(open(OUT, encoding='utf-8'))
except Exception:
    prev = {}
for prefix in ('ah|', 'jumbo|', 'dirk|', 'dirkname|', 'dekamarkt|', 'dekamarktname|', 'poiesz|', 'lidlname|'):
    if not any(k.startswith(prefix) for k in items):
        old = {k: v for k, v in (prev.get('items') or {}).items() if k.startswith(prefix)}
        if old: items.update(old); print('vorige acties gebruikt voor', prefix.rstrip('|'))
if not ALDI and prev.get('aldi'):
    ALDI.extend(prev['aldi']); print('vorige acties gebruikt voor aldi')
if not items:
    print('Geen aanbiedingen opgehaald; vorig bestand blijft staan.')
    sys.exit(0)
# foto's bewaren (samengevoegd met eerdere dagen, zodat we ze niet elke dag opnieuw nodig hebben)
IMG_OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'images.json')
try:
    old = json.load(open(IMG_OUT, encoding='utf-8'))
except Exception:
    old = {}

# foto's van de vergeleken producten: de productpagina bij elke winkel bezoeken (eenmalig per product, daarna uit de cache)
def page_image(url):
    t = requests.get(url, headers=UA_WEB, timeout=30).text
    for rx in (r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"',
               r'<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"', r'"image"\s*:\s*\[?\s*"(https?://[^"]+)"'):
        m = re.search(rx, t)
        if m and not re.search(r'logo|favicon|placeholder|share|social', m.group(1), re.I):
            return html.unescape(m.group(1))
    return '-'      # geen foto gevonden; niet elke dag opnieuw proberen
try:
    prods = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'products.json'), encoding='utf-8'))['products']
except Exception:
    prods = []
cache = old.setdefault('url', {})
todo = [v[3] for p in prods for sid, v in p['st'].items() if sid not in ('ah', 'poiesz') and v[3] not in cache][:250]
for u in todo:
    try:
        cache[u] = page_image(u)
    except Exception:
        pass
    time.sleep(0.4)
stats['productpaginas'] = f'{len(todo)} nieuw, {sum(1 for v in cache.values() if v != "-")} met foto'
for st_, m in IMG.items():
    old.setdefault(st_, {}).update(m)
with open(IMG_OUT, 'w', encoding='utf-8') as f:
    json.dump(old, f, ensure_ascii=False, separators=(',', ':'))
stats['fotos'] = {k: len(v) for k, v in old.items()}
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(dict(updated=datetime.date.today().isoformat(), stats=stats, items=items, aldi=ALDI), f, ensure_ascii=False, separators=(',', ':'))
print('Aanbiedingen opgehaald:', stats)
