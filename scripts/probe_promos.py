import json, re, requests
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9'}
t = requests.get('https://www.dirk.nl/aanbiedingen', headers=UA, timeout=30).text
arr = json.loads(re.search(r'id="__NUXT_DATA__">(.*?)</script>', t, re.S).group(1))
def res(i, depth=0):
    if depth > 14: return '…'
    v = arr[i] if isinstance(i, int) else i
    if isinstance(v, list):
        if v and v[0] in ('ShallowReactive', 'Reactive', 'Ref', 'ShallowRef'): return res(v[1], depth+1)
        return [res(x, depth+1) for x in v]
    if isinstance(v, dict): return {k: res(x, depth+1) for k, x in v.items()}
    return v
co = res(0)['data']['offers-currentOffers']
print('DIRK groepen', len(co), [ (g.get('name') or g.get('title') or list(g.keys())) for g in co][:12])
o = co[0]['currentOffers'][1]; print(json.dumps(o, ensure_ascii=False)[:2500])
n = sum(len(g.get('currentOffers', [])) for g in co); print('aantal offers', n)
labels = sorted({(x.get('textPriceSign') or '').strip() for g in co for x in g.get('currentOffers', [])}); print('textPriceSign', labels[:40])
