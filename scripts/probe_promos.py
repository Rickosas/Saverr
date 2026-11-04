# Tijdelijke test, ronde 3: Jumbo aanbiedingen uitlezen
import re, requests, html
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl'}
t = requests.get('https://www.jumbo.com/aanbiedingen/nu', headers=UA, timeout=30).text
tags = [m.start() for m in re.finditer(r'data-testid="jum-tag"', t)]
print('tags', len(tags))
for i in tags[:6]:
    seg = t[i:i+3000]
    txt = re.sub(r'<[^>]+>', ' ', seg); txt = re.sub(r'\s+', ' ', html.unescape(txt))
    links = re.findall(r'href="(/[^"]+)"', seg)[:3]
    print('---', txt[:300], links)
# hoeveel unieke promotie-links
links = sorted(set(re.findall(r'href="(/aanbiedingen/[^"#?]+)"', t)))
print('promo-links', len(links), links[:15])
plinks = sorted(set(re.findall(r'href="(/producten/[^"#?]+)"', t)))
print('product-links', len(plinks), plinks[:10])
# Nuxt payload?
i = t.find('__NUXT_DATA__'); print('NUXT_DATA', i, t[i:i+300] if i>=0 else '')
# één promotiepagina openen
if links:
    u = 'https://www.jumbo.com' + links[3]
    t2 = requests.get(u, headers=UA, timeout=30).text
    print('\n== promo page', u, len(t2))
    pl = sorted(set(re.findall(r'href="(/producten/[^"#?]+)"', t2)))
    print('producten op promopagina', len(pl), pl[:8])
    j = t2.find('jum-tag'); print(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',t2[j:j+1500]))[:400])
    for k in ['price', 'prijs']:
        m = t2.find('data-testid="jum-product-price'); print(k, re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',t2[m:m+600]))[:200] if m>=0 else -1)
