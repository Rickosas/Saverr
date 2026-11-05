# Tijdelijk: kandidaat-foto's per recept zoeken op Wikimedia Commons (vrije licenties)
import json, os, re, requests, time, html
UA = {'user-agent': 'SaverrBeta/1.0 (recipe photo selection; github.com/Rickosas/Saverr)'}
Q_ALL = {
 'kipcurry': 'chicken curry spinach', 'zalmoven': 'baked salmon broccoli sweet potato', 'kippasta': 'pasta chicken mushrooms spinach',
 'chili': 'chili con carne', 'wok': 'chicken stir fry broccoli', 'koolvis': 'fish fillet leek potatoes', 'paprikavul': 'stuffed peppers minced meat rice',
 'bloemkoolschotel': 'cauliflower casserole minced meat', 'kipsperzie': 'chicken breast green beans potatoes', 'couscouskip': 'couscous chicken vegetables',
 'bolognesegroente': 'penne bolognese', 'nasigroente': 'nasi goreng', 'zalmspinazie': 'salmon spinach pasta', 'wrapskip': 'chicken wraps vegetables',
 'hutspotbal': 'hutspot', 'zoeteovenschotel': 'sweet potato casserole', 'cheat-pizza': 'pizza margherita', 'cheat-pannenkoek': 'pannenkoeken',
 'cheat-friet': 'french fries meatballs'}
Q_ALL.update({'zalmoven': 'salmon fillet broccoli', 'koolvis': 'fish leeks dish', 'bloemkoolschotel': 'cauliflower oven dish', 'kippasta': 'pasta spinach mushrooms', 'paprikavul': 'stuffed bell peppers'})
SKIP = {'kipcurry', 'chili', 'wok', 'couscouskip', 'kipsperzie'}
Q = {k: v for k, v in Q_ALL.items() if k not in SKIP}
os.makedirs('kandidaten', exist_ok=True); out = {}
for rid, q in Q.items():
    p = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': q + ' filetype:bitmap', 'gsrlimit': 6,
         'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 500}
    try:
        for attempt in range(4):
            rr = requests.get('https://commons.wikimedia.org/w/api.php', params=p, headers=UA, timeout=30)
            if rr.status_code == 200 and rr.text.startswith('{'): break
            time.sleep(15 * (attempt + 1))
        j = rr.json()
    except Exception as e:
        print('fout', rid, e); continue
    pages = sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda x: x.get('index', 99))
    out[rid] = []
    for n, pg in enumerate(pages[:6]):
        ii = (pg.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata') or {}
        lic = (md.get('LicenseShortName') or {}).get('value', '')
        if not ii.get('thumburl') or ii.get('width', 0) < 400: continue
        artist = re.sub('<[^>]+>', '', html.unescape((md.get('Artist') or {}).get('value', ''))).strip()
        fn = f'kandidaten/{rid}_{n}.jpg'
        try:
            r = requests.get(ii['thumburl'], headers=UA, timeout=30); open(fn, 'wb').write(r.content)
        except Exception: continue
        out[rid].append(dict(file=fn, title=pg['title'], thumb=ii['thumburl'], page=ii.get('descriptionurl'), license=lic, artist=artist[:80]))
        time.sleep(0.3)
    print(rid, len(out[rid])); time.sleep(4)
json.dump(out, open('kandidaten/kandidaten2.json', 'w'), ensure_ascii=False, indent=1)
