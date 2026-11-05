import json, os, re, requests, time, html
UA = {'user-agent': 'SaverrBeta/1.0 (recipe photo selection; github.com/Rickosas/Saverr)'}
Q = {'cheat-burger': 'smash burger cheese fries', 'cheat-kapsalon': 'kapsalon', 'cheat-nachos': 'nachos cheese beans', 'cheat-macncheese': 'macaroni and cheese bacon',
     'cheat-lasagne': 'lasagna', 'cheat-nuggets': 'chicken nuggets fries', 'cheat-shoarma': 'shawarma wrap'}
os.makedirs('kandidaten', exist_ok=True); out = {}
for rid, q in Q.items():
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': q + ' filetype:bitmap', 'gsrlimit': 8,
         'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 500}
    for attempt in range(4):
        rr = requests.get('https://commons.wikimedia.org/w/api.php', params=p, headers=UA, timeout=30)
        if rr.status_code == 200 and rr.text.startswith('{'): break
        time.sleep(15 * (attempt + 1))
    pages = sorted((rr.json().get('query') or {}).get('pages', {}).values(), key=lambda x: x.get('index', 99))
    out[rid] = []
    for n, pg in enumerate(pages[:8]):
        ii = (pg.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata') or {}
        if not ii.get('thumburl') or ii.get('width', 0) < 400: continue
        artist = re.sub('<[^>]+>', '', html.unescape((md.get('Artist') or {}).get('value', ''))).strip()
        fn = f'kandidaten/{rid}_{n}.jpg'
        try: open(fn, 'wb').write(requests.get(ii['thumburl'], headers=UA, timeout=30).content)
        except Exception: continue
        out[rid].append(dict(file=fn, title=pg['title'], page=ii.get('descriptionurl'), license=(md.get('LicenseShortName') or {}).get('value', ''), artist=artist[:80]))
        time.sleep(0.5)
    print(rid, len(out[rid])); time.sleep(4)
json.dump(out, open('kandidaten/kandidaten3.json', 'w'), ensure_ascii=False, indent=1)
