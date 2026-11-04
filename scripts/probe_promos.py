import re, requests, json, html
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9'}
def nuxt(t):
    arr = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1)); memo, busy = {}, set()
    def res(i):
        if not isinstance(i, int) or isinstance(i, bool): return i
        if i in memo: return memo[i]
        if i in busy or i < 0 or i >= len(arr): return None
        busy.add(i); v = arr[i]
        if isinstance(v, list): out = res(v[1]) if (v and v[0] in ('ShallowReactive','Reactive','Ref','ShallowRef')) else [res(x) for x in v]
        elif isinstance(v, dict): out = {k: res(x) for k, x in v.items()}
        else: out = v
        busy.discard(i); memo[i] = out; return out
    return res(0)
def walk(o, pred, out):
    if isinstance(o, dict):
        if pred(o): out.append(o)
        for v in o.values(): walk(v, pred, out)
    elif isinstance(o, list):
        for v in o: walk(v, pred, out)
    return out
def short(o, n=1800): return json.dumps(o, ensure_ascii=False)[:n]
# DEKA
t = requests.get('https://www.dekamarkt.nl/aanbiedingen', headers=UA, timeout=30).text
offs = walk(nuxt(t), lambda d: 'offerPrice' in d and 'products' in d, [])
print('DEKA offers', len(offs), 'labels', sorted({(o.get('textPriceSign') or '')+' | '+str(o.get('subText') or '') for o in offs})[:30])
x = [o for o in offs if '1+1' in json.dumps(o)][:1] or offs[:1]
print(short(x[0]))
# POIESZ
t = requests.get('https://webwinkel.poiesz-supermarkten.nl/aanbiedingen', headers=UA, timeout=30).text
pz = walk(nuxt(t), lambda d: 'offerTypeLine1' in d or 'commercialTextLine1' in d, [])
print('\nPOIESZ objs', len(pz)); print(short(pz[0], 2500)); print(short(pz[5], 1500))
keys = set(); [keys.update(o.keys()) for o in pz]; print('keys', sorted(keys))
# HOOGVLIET
t = requests.get('https://hoogvliet.nl/aanbiedingen', headers=UA, timeout=30).text
nd = json.loads(re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
hv = walk(nd, lambda d: 'promotion_meta_data' in d, [])
print('\nHOOGVLIET', len(hv)); print(short(hv[0], 2500)); print(short(hv[3], 1200))
# ALDI
t = requests.get('https://www.aldi.nl/aanbiedingen.html', headers=UA, timeout=30).text
for k in ['algolia', 'appId', 'applicationId', 'apiKey', 'indexName']:
    i = t.find(k); print('ALDI', k, t.count(k), re.sub(r'\s+',' ',t[max(0,i-150):i+250]) if i>=0 else '')
nd = json.loads(re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
s = json.dumps(nd); i = s.find('promotionPrices'); print('ALDI rond promotionPrices', s[max(0,i-2500):i+800])
