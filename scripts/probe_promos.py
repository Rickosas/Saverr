# Tijdelijke test: zijn de bonus-API's van AH en Jumbo bereikbaar vanaf GitHub?
import json, requests
def show(name, r, n=1500):
    print(f'\n===== {name}: HTTP {r.status_code}')
    print(r.text[:n])
AH_H = {'x-application': 'AHWEBSHOP', 'user-agent': 'Appie/8.22.3 Model/phone Android/13', 'content-type': 'application/json; charset=UTF-8'}
try:
    r = requests.post('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', headers=AH_H, json={'clientId': 'appie'}, timeout=20)
    show('AH token', r, 200)
    tok = r.json()['access_token']; H = {**AH_H, 'Authorization': 'Bearer ' + tok}
    r = requests.get('https://api.ah.nl/mobile-services/product/search/v2', params={'query': 'rookworst', 'size': 3, 'page': 0, 'sortOn': 'RELEVANCE'}, headers=H, timeout=20)
    show('AH search rookworst', r, 2500)
    r = requests.get('https://api.ah.nl/mobile-services/product/search/v2', params={'size': 5, 'page': 0, 'sortOn': 'RELEVANCE', 'filters': 'bonus'}, headers=H, timeout=20)
    show('AH search bonus filter (geen query)', r, 1500)
    r = requests.get('https://api.ah.nl/mobile-services/bonuspage/v1/metadata', headers=H, timeout=20)
    show('AH bonus metadata', r, 2000)
except Exception as e:
    print('AH fout', e)
for v in ['v17', 'v18']:
    try:
        r = requests.get(f'https://mobileapi.jumbo.com/{v}/search', params={'q': 'rookworst', 'limit': 2}, headers={'user-agent': 'Jumbo/9.0 (Android)'}, timeout=20)
        show(f'Jumbo {v} search', r, 2000)
        r = requests.get(f'https://mobileapi.jumbo.com/{v}/promotion-overview', headers={'user-agent': 'Jumbo/9.0 (Android)'}, timeout=20)
        show(f'Jumbo {v} promotions', r, 1500)
    except Exception as e:
        print('Jumbo fout', v, e)
try:
    r = requests.get('https://www.jumbo.com/api/graphql', timeout=20, headers={'user-agent': 'Mozilla/5.0'})
    show('Jumbo web graphql GET', r, 400)
except Exception as e:
    print('Jumbo graphql fout', e)
