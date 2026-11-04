# Tijdelijke test, ronde 2
import json, re, requests
def show(name, r, n=1500): print(f'\n===== {name}: HTTP {r.status_code}'); print(r.text[:n])
AH_H = {'x-application': 'AHWEBSHOP', 'user-agent': 'Appie/8.22.3 Model/phone Android/13', 'content-type': 'application/json; charset=UTF-8'}
tok = requests.post('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', headers=AH_H, json={'clientId': 'appie'}, timeout=20).json()['access_token']
H = {**AH_H, 'Authorization': 'Bearer ' + tok}
r = requests.get('https://api.ah.nl/mobile-services/product/search/v2', params={'query': 'kaas', 'size': 50, 'page': 0, 'sortOn': 'RELEVANCE', 'filters': 'bonus'}, headers=H, timeout=20)
try:
    j = r.json(); print('\n===== AH kaas+bonus', r.status_code, j.get('page'))
    for p in j.get('products', [])[:8]: print(p['webshopId'], p['title'], p.get('bonusMechanism'), p.get('currentPrice'), p.get('priceBeforeBonus'), p.get('bonusEndDate'))
except Exception as e: show('AH kaas+bonus', r)
# AH bonus via website graphql
q = {"operationName": "FetchBonusPromotions", "variables": {"periodStart": "2026-11-02", "periodEnd": "2026-11-08"},
     "query": "query FetchBonusPromotions($periodStart: String, $periodEnd: String) { bonusPromotions(filterSet: WEB_BONUS_PAGE, input: {periodStart: $periodStart, periodEnd: $periodEnd}) { id title promotionLabels { topText centerText bottomText } price { now { amount } was { amount } } products { id title } } }"}
r = requests.post('https://www.ah.nl/gql', json=q, headers={'content-type': 'application/json', 'user-agent': 'Mozilla/5.0', 'x-client-name': 'ah-bonus', 'x-client-version': '1.0'}, timeout=30)
show('AH gql bonus', r, 2500)
# Jumbo product- en aanbiedingenpagina
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl'}
for url in ['https://www.jumbo.com/producten/jumbo-rookworst-275g-500706PAK', 'https://www.jumbo.com/aanbiedingen/nu']:
    try:
        r = requests.get(url, headers=UA, timeout=30)
        t = r.text; print(f'\n===== Jumbo {url}: HTTP {r.status_code} len {len(t)}')
        for k in ['__NEXT_DATA__', '__NUXT__', 'application/ld+json', 'promotion', 'tag', '1+1', 'halve prijs', 'korting']:
            i = t.find(k); print(k, i, t[i-80:i+200].replace('\n', ' ') if i >= 0 else '')
    except Exception as e: print('Jumbo fout', e)
