import json, gzip, requests
c = json.load(gzip.open('data/catalog.json.gz', 'rt'))
AH = lambda x: f'https://static.ah.nl/dam/product/{x}?revLabel=1&rendition=200x200_JPG&fileType=binary'
seen = {}
for r in c['rows']:
    s = c['stores'][r[0]]
    if r[7] and seen.get(s, 0) < 2:
        url = AH(r[7]) if str(r[7]).startswith('AHI_') else (f"https://images.poiesz-supermarkten.nl/artikelen/{r[4].rstrip('/').split('/')[-1]}.png" if r[7] == 'P' else r[7])
        try:
            x = requests.get(url, timeout=20, headers={'user-agent': 'Mozilla/5.0 (iPhone)'})
            print(s, x.status_code, x.headers.get('content-type'), len(x.content), url[:110])
        except Exception as e: print(s, 'fout', e)
        seen[s] = seen.get(s, 0) + 1
