# Tijdelijke test ronde 2
import json, re, requests, html, asyncio
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9'}
# ---- Dirk: NUXT payload ontleden
t = requests.get('https://www.dirk.nl/aanbiedingen', headers=UA, timeout=30).text
raw = re.search(r'id="__NUXT_DATA__">(.*?)</script>', t, re.S).group(1)
arr = json.loads(raw)
def res(i, depth=0):
    if depth > 8: return '…'
    v = arr[i] if isinstance(i, int) else i
    if isinstance(v, list):
        if v and v[0] in ('ShallowReactive', 'Reactive', 'Ref', 'ShallowRef'): return res(v[1], depth+1)
        return [res(x, depth+1) for x in v]
    if isinstance(v, dict): return {k: res(x, depth+1) for k, x in v.items()}
    return v
root = res(0)
d = root['data']
print('keys', list(d.keys()))
co = d.get('offers-currentOffers')
print(type(co), (list(co.keys()) if isinstance(co, dict) else len(co)))
s = json.dumps(co, ensure_ascii=False)
print(s[:3000])
# ---- Lidl: links naar aanbiedingen
t = requests.get('https://www.lidl.nl/', headers=UA, timeout=30).text
links = sorted(set(re.findall(r'href="(/[a-z]/[^"]+)"', t)))
print('\nLIDL links', [l for l in links if any(k in l.lower() for k in ['aanbied', 'week', 'folder', 'actie', 'deal', 'korting'])][:40])
