import requests, json
H = {'x-application': 'AHWEBSHOP', 'user-agent': 'Appie/8.22.3 Model/phone Android/13', 'content-type': 'application/json; charset=UTF-8'}
H['Authorization'] = 'Bearer ' + requests.post('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', headers=H, json={'clientId': 'appie'}, timeout=20).json()['access_token']
def get(path, **params):
    r = requests.get('https://api.ah.nl' + path, params=params, headers=H, timeout=30)
    return r.status_code, r.text
c, t = get('/mobile-services/v1/product-shelves/categories'); print('categories', c, t[:600])
cats = json.loads(t) if c == 200 else []
cid = cats[0]['id'] if cats else None
for params in [dict(taxonomyId=cid, size=200, page=0), dict(taxonomyId=cid, size=750, page=0, sortOn='RELEVANCE'), dict(query='', taxonomyId=cid, size=50),
               dict(query='xxl nutrition', size=20), dict(query='fitmeals', size=20, filters='bonus'), dict(query='fitmeals', size=20, bonus='true')]:
    c, t = get('/mobile-services/product/search/v2', **params)
    try:
        j = json.loads(t); pr = j.get('products', [])
        print('\nSEARCH', params, c, j.get('page'), 'bonus in page:', sum(1 for p in pr if p.get('bonusMechanism')))
        for p in pr[:6]: print('   ', p['webshopId'], p['title'][:50], p.get('bonusMechanism'), p.get('currentPrice'), p.get('priceBeforeBonus'))
    except Exception: print('\nSEARCH', params, c, t[:200])
for path in ['/mobile-services/bonuspage/v2/metadata', '/mobile-services/bonuspage/v3/metadata', '/mobile-services/bonus/v1/metadata', '/mobile-services/v1/bonus-promotions']:
    c, t = get(path); print('\n', path, c, t[:300])
print('\nnum categories', len(cats), [x.get('name') for x in cats][:30])
