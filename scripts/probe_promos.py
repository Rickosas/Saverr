# Tijdelijke test: aanbiedingenpagina's van DekaMarkt, Vomar, Hoogvliet, Aldi, Poiesz
import re, requests, json
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9', 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}
def probe(url):
    try:
        r = requests.get(url, headers=UA, timeout=30); t = r.text
        print(f'\n===== {url}: HTTP {r.status_code} len {len(t)} -> {r.url}')
        for k in ['__NEXT_DATA__', '__NUXT_DATA__', 'application/ld+json', 'graphql', 'api', '1+1', 'gratis', 'halve prijs', '% korting', 'voor ', 'offerPrice', 'promotion', 'discount', 'data-price', 'price']:
            i = t.find(k); print(f'  [{k}] {t.count(k)}', re.sub(r'\s+', ' ', t[max(0,i-80):i+220]) if i >= 0 else '')
        links = re.findall(r'href="([^"]{5,140})"', t)
        print('  links', [l for l in links if any(x in l for x in ['product','aanbied','boodschap','/p/','artikel'])][:12])
    except Exception as e:
        print('fout', url, e)
for u in ['https://www.dekamarkt.nl/aanbiedingen', 'https://www.vomar.nl/aanbiedingen', 'https://www.hoogvliet.com/aanbiedingen',
          'https://www.aldi.nl/aanbiedingen.html', 'https://www.aldi.nl/producten.html', 'https://webwinkel.poiesz-supermarkten.nl/aanbiedingen',
          'https://www.poiesz-supermarkten.nl/aanbiedingen']:
    probe(u)
for g in ['https://web-gateway.dekamarkt.nl/graphql', 'https://webservice.aldi.nl/api/v1/products.json', 'https://api.aldi.nl/v1/products']:
    try:
        r = requests.post(g, json={'query': '{ __typename }'}, headers={**UA, 'content-type': 'application/json'}, timeout=20) if 'graphql' in g else requests.get(g, headers=UA, timeout=20)
        print('\n=====', g, r.status_code, r.text[:300])
    except Exception as e: print('fout', g, e)
