import json, re, requests, html
from urllib.parse import unquote
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9'}
for url in ['https://www.lidl.nl/c/eten-en-drinken/s10068374', 'https://www.lidl.nl/c/store/aanbiedingen/a10008785']:
    t = requests.get(url, headers=UA, timeout=30).text
    gd = re.findall(r'data-grid-data="([^"]+)"', t)
    print('\nLIDL', url, 'len', len(t), 'grid-data', len(gd))
    if gd:
        j = json.loads(html.unescape(gd[0])); print(json.dumps(j, ensure_ascii=False)[:2500])
        names = []
        for g in gd:
            try:
                j = json.loads(html.unescape(g)); pr = j.get('price', {})
                names.append((j.get('fullTitle') or j.get('title'), pr.get('price'), pr.get('oldPrice'), (j.get('lidlPlus') or [{}])[0].get('price', {}).get('price') if isinstance(j.get('lidlPlus'), list) and j.get('lidlPlus') else None, (j.get('stockAvailability') or {}).get('badgeInfo', {}).get('badgeList', [{}])[0].get('text') if j.get('stockAvailability') else None))
            except Exception as e: names.append(('ERR', str(e)[:80]))
        print(names[:45])
