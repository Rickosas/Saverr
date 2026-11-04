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

sys.path.insert(0, os.path.dirname(__file__))
from specs import SPECS  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'promos.json')
UA_WEB = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          'accept-language': 'nl-NL,nl;q=0.9'}
items = {}
stats = {}

# ------------------------------------------------------------------ Albert Heijn
def fetch_ah():
    H = {'x-application': 'AHWEBSHOP', 'user-agent': 'Appie/8.22.3 Model/phone Android/13', 'content-type': 'application/json; charset=UTF-8'}
    tok = requests.post('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', headers=H, json={'clientId': 'appie'}, timeout=20).json()['access_token']
    H['Authorization'] = 'Bearer ' + tok
    # zoektermen: de namen van de producten die Saverr vergelijkt, plus wat brede termen
    terms = sorted({re.sub(r'\s*[\d,±]+.*$|\(.*?\)', '', sp[1]).strip() for sp in SPECS} |
                   {'kaas', 'koffie', 'bier', 'frisdrank', 'chips', 'chocolade', 'yoghurt', 'vlees', 'kip', 'groente', 'fruit', 'brood',
                    'pasta', 'wasmiddel', 'toiletpapier', 'shampoo', 'koekjes', 'ijs', 'pizza', 'sap', 'thee', 'snoep', 'vis', 'soep'})
    n = 0
    for q in terms:
        if not q: continue
        try:
            r = requests.get('https://api.ah.nl/mobile-services/product/search/v2',
                             params={'query': q, 'size': 60, 'page': 0, 'sortOn': 'RELEVANCE'}, headers=H, timeout=20)
            r.raise_for_status()
        except Exception as e:
            print('AH zoeken mislukt:', q, e); continue
        for p in r.json().get('products', []):
            mech = p.get('bonusMechanism')
            if not mech or not p.get('webshopId'): continue
            end = p.get('bonusEndDate')
            items[f"ah|wi{p['webshopId']}"] = dict(l=mech.strip(), t=end, now=p.get('currentPrice'), reg=p.get('priceBeforeBonus'),
                                                   name=p.get('title'))
            n += 1
        time.sleep(0.4)
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
        for pid in ids:
            items[f'jumbo|{pid}'] = dict(l=pr['l'], t=pr['t'], name=pr['title'])
        time.sleep(0.6)
    stats['jumbo_promoties'] = len(seen)
    stats['jumbo'] = len([k for k in items if k.startswith('jumbo|')])

# ------------------------------------------------------------------ Dirk
def euro_txt(x): return f'{x:.2f}'.replace('.', ',')

def fetch_dirk():
    t = requests.get('https://www.dirk.nl/aanbiedingen', headers=UA_WEB, timeout=30).text
    arr = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
    def res(i, depth=0):
        if depth > 40: return None
        v = arr[i] if isinstance(i, int) else i
        if isinstance(v, list):
            if v and v[0] in ('ShallowReactive', 'Reactive', 'Ref', 'ShallowRef'): return res(v[1], depth + 1)
            return [res(x, depth + 1) for x in v]
        if isinstance(v, dict): return {k: res(x, depth + 1) for k, x in v.items()}
        return v
    groups = res(0)['data']['offers-currentOffers']
    n = 0
    for g in groups or []:
        if not isinstance(g, dict): continue
        for o in g.get('currentOffers') or []:
            if not isinstance(o, dict): continue
            weekend = 'VR, ZA' in (o.get('textPriceSign') or '')
            end = (o.get('endDate') or '')[:10] or None
            for pr in o.get('products') or []:
                if not isinstance(pr, dict): continue
                price = pr.get('offerPrice') or o.get('offerPrice')
                if not pr.get('productId') or not price: continue
                label = ('Weekendactie ' if weekend else 'Actie ') + '€' + euro_txt(price)
                items[f"dirk|{pr['productId']}"] = dict(l=label, t=end, unit=price, reg=pr.get('normalPrice') or None, name=o.get('headerText'))
                n += 1
    stats['dirk'] = n

# ------------------------------------------------------------------ Lidl
def lidl_norm(s):
    s = re.sub(r'^[-\s]+', '', (s or '').lower())
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9%+ ]', ' ', s)).strip()

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
        items[f'lidlname|{lidl_norm(title)}'] = dict(l=label, t=end or None, unit=unit, reg=old or price, name=title)
        n += 1
    stats['lidl'] = n

for name, fn in (('Albert Heijn', fetch_ah), ('Jumbo', fetch_jumbo), ('Dirk', fetch_dirk), ('Lidl', fetch_lidl)):
    try:
        fn()
    except Exception as e:
        print(f'{name}: ophalen mislukt ({e})')

if not items:
    print('Geen aanbiedingen opgehaald; vorig bestand blijft staan.')
    sys.exit(0)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(dict(updated=datetime.date.today().isoformat(), stats=stats, items=items), f, ensure_ascii=False, separators=(',', ':'))
print('Aanbiedingen opgehaald:', stats)
