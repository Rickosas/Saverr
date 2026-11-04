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
t = requests.get('https://webwinkel.poiesz-supermarkten.nl/aanbiedingen', headers=UA, timeout=30).text
pz = walk(nuxt(t), lambda d: 'offerTypeLine1' in d, [])
print('POIESZ offerTypes', sorted({' '.join(str(o.get(k) or '') for k in ['offerTypeLine1','offerTypeLine2','offerTypeLine3']).strip() for o in pz})[:40])
x=[o for o in pz if 'GRATIS' in json.dumps(o)][:1]; print(short(x[0],1500) if x else '')
t = requests.get('https://hoogvliet.nl/aanbiedingen', headers=UA, timeout=30).text
nd = json.loads(re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
hv = walk(nd, lambda d: 'promotion_meta_data' in d, [])
import collections
print('\nHOOGVLIET types', collections.Counter(h.get('type') for h in hv), 'labels', sorted({(h['promotion_meta_data'] or {}).get('korting_label') for h in hv if h.get('promotion_meta_data')})[:40])
x=[h for h in hv if h.get('type')!='GroupedProduct'][:2]
for h in x: print(short({k:v for k,v in h.items() if k not in ('product_flags','child_skus')},1500))
t = requests.get('https://www.aldi.nl/aanbiedingen.html', headers=UA, timeout=30).text
nd = json.loads(re.search(r'id="__NEXT_DATA__"[^>]*>(.*?)</script>', t, re.S).group(1))
def find_api(o):
    if isinstance(o, dict):
        for k,v in o.items():
            if k=='apiData': return v
            r=find_api(v)
            if r: return r
    elif isinstance(o, list):
        for v in o:
            r=find_api(v)
            if r: return r
api = json.loads(find_api(nd))
m = api[0][1]['res']['algoliaDataMap']
print('\nALDI items', len(m), 'res keys', list(api[0][1]['res'].keys()))
vals=list(m.values()); print(short(vals[0],2500)); 
print('price keys', sorted({k for v in vals for k in (v.get('currentPrice') or {}).keys()}))
print('labels', collections.Counter(json.dumps((v.get('currentPrice') or {}).get('priceTagLabels'),ensure_ascii=False) for v in vals).most_common(15))
print('cats', collections.Counter(v.get('mainCategoryID') for v in vals).most_common(20))
