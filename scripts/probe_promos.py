# Tijdelijke test: aanbiedingenpagina's van Dirk, PLUS en Lidl
import re, requests
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9', 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}
def probe(url):
    try:
        r = requests.get(url, headers=UA, timeout=30); t = r.text
        print(f'\n===== {url}: HTTP {r.status_code} len {len(t)} final {r.url}')
        for k in ['__NEXT_DATA__', '__NUXT_DATA__', '__NUXT__', 'application/ld+json', 'graphql', 'gateway', '1+1', 'gratis', 'halve prijs', '% korting', 'voor ', 'offer', 'promotion', 'discount', 'apollo', 'screenservices', 'OSVSTATE', 'odsc', 'price']:
            i = t.find(k)
            print(f'  [{k}] {i}', re.sub(r'\s+', ' ', t[max(0,i-100):i+250]) if i >= 0 else '')
        links = re.findall(r'href="(/[^"]{5,120})"', t)
        print('  links sample', [l for l in links if any(x in l for x in ['product','aanbied','boodschap','/p/','/c/'])][:15])
        return t
    except Exception as e:
        print('fout', url, e)
for u in ['https://www.dirk.nl/aanbiedingen', 'https://www.plus.nl/aanbiedingen', 'https://www.lidl.nl/c/aanbiedingen/s10008785', 'https://www.lidl.nl/']:
    probe(u)
# Dirk graphql gok
for g in ['https://web-gateway.dirk.nl/graphql', 'https://api.dirk.nl/graphql', 'https://www.dirk.nl/api/graphql']:
    try:
        r = requests.post(g, json={'query': '{ __typename }'}, headers={**UA, 'content-type': 'application/json'}, timeout=20)
        print('\n=====', g, r.status_code, r.text[:300])
    except Exception as e: print('fout', g, e)
