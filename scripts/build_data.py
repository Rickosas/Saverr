#!/usr/bin/env python3
"""
Saverr data-build
-----------------
Leest de open prijsdata van Checkjebon.nl (MIT-licentie) en maakt daar de
bestanden van die de app gebruikt:

  data/meta.json         datum van de prijzen, aantallen
  data/products.json     ~40 veelgekochte producten, per supermarkt gekoppeld
  data/drops.json        de grootste echte prijsdalingen van dit moment
  data/catalog.json.gz   het hele assortiment (±107.000 producten), gecomprimeerd

Een "prijsdaling" = de prijs van nu ligt minstens 10% (en €0,15) onder de
hoogste prijs van hetzelfde product in de afgelopen 4 weken. Die geschiedenis
halen we uit de git-historie van de Checkjebon-repository.

Gebruik:  python3 scripts/build_data.py <pad-naar-checkjebon-clone>
"""
import datetime, gzip, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(__file__))
from specs import SPECS  # noqa: E402

REPO = sys.argv[1] if len(sys.argv) > 1 else 'checkjebon'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data')
STORES = ['ah', 'jumbo', 'lidl', 'plus', 'dirk', 'hoogvliet', 'dekamarkt', 'spar', 'poiesz', 'vomar']
DROP_PCT, DROP_EUR, HISTORY_DAYS = 0.10, 0.15, 28

# ---------------------------------------------------------------- data laden
def git(*a):
    return subprocess.run(['git', '-C', REPO, *a], capture_output=True, check=True).stdout

def load_at(commit):
    return json.loads(git('show', f'{commit}:data/supermarkets.json'))

log = [l.split() for l in git('log', '--format=%H %cd', '--date=short', '--', 'data/supermarkets.json').decode().split('\n') if l]
by_date = {}
for h, d in log:
    by_date.setdefault(d, h)          # nieuwste commit per dag
dates = sorted(by_date)
latest_date = dates[-1]
current = {s['n']: s for s in load_at(by_date[latest_date]) if s['d']}

# hoogste prijs per product in de afgelopen 4 weken (elke ~3 dagen een momentopname)
cutoff = (datetime.date.fromisoformat(latest_date) - datetime.timedelta(days=HISTORY_DAYS)).isoformat()
hist_dates = [d for d in dates if cutoff <= d < latest_date][::3]
max_price = {}
for d in hist_dates:
    try:
        snap = load_at(by_date[d])
    except Exception as e:  # kapotte momentopname overslaan
        print('skip', d, e); continue
    for s in snap:
        for it in s['d']:
            if it.get('p'):
                k = s['n'] + '|' + it['l']
                if it['p'] > max_price.get(k, 0):
                    max_price[k] = it['p']
print(f'prijzen van {latest_date}, geschiedenis: {len(hist_dates)} momentopnames vanaf {cutoff}')

def was_price(store, item):
    """Oude (hogere) prijs als er sprake is van een prijsdaling, anders 0."""
    m = max_price.get(store + '|' + item['l'], 0)
    p = item['p']
    # >70% daling is bijna altijd een datafout bij de bron; die negeren we
    return round(m, 2) if (m and m * 0.3 <= p <= m * (1 - DROP_PCT) and m - p >= DROP_EUR) else 0

# ---------------------------------------------------------------- aanbiedingen (AH bonus, Jumbo)
PROMOS, ALDI_OFFERS = {}, []
_pf = os.path.join(OUT, 'promos.json')
if os.path.exists(_pf):
    _p = json.load(open(_pf, encoding='utf-8'))
    if _p.get('updated', '') >= (datetime.date.today() - datetime.timedelta(days=8)).isoformat():
        PROMOS, ALDI_OFFERS = _p['items'], _p.get('aldi', [])
TODAY = datetime.date.today().isoformat()

def lidl_norm(s):
    s = re.sub(r'^[-\s]+', '', (s or '').lower())
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9%+ ]', ' ', s)).strip()

def promo_key(store, item):
    link = item['l']
    if store == 'ah': return 'ah|' + link.split('/')[0]
    if store == 'jumbo': return 'jumbo|' + link.rstrip('/').rsplit('-', 1)[-1]
    if store in ('dirk', 'dekamarkt', 'poiesz'):
        k = store + '|' + link.rstrip('/').rsplit('/', 1)[-1]
        if k in PROMOS: return k
        k = store + 'name|' + lidl_norm(item['n'])          # anders op exacte productnaam
        return k if k in PROMOS else None
    if store == 'lidl':
        k = 'lidlname|' + lidl_norm(item['n'])   # alleen een exact gelijke productnaam
        return k if k in PROMOS else None
    return None
PROMO_STORES = ('ah', 'jumbo', 'dirk', 'dekamarkt', 'poiesz', 'lidl')

def _num(x): return float(x.replace(',', '.'))
def promo_model(label, reg, now=None):
    """Zet '1+1 gratis', '2 voor 3,49', '25% korting' ... om in (min. aantal, prijs per stuk)."""
    l = label.lower().replace('€', ' ').replace('  ', ' ')
    m = re.search(r'(\d+)\s*\+\s*(\d+)\s*gratis', l)
    if m: a, b = int(m.group(1)), int(m.group(2)); return a + b, reg * a / (a + b)
    if '2e halve prijs' in l or '50% korting op de 2e' in l: return 2, reg * 0.75
    if '2e gratis' in l: return 2, reg / 2
    m = re.search(r'(\d+)\s*voor\s*(\d+(?:[.,]\d{1,2})?)\b', l)
    if m: n = int(m.group(1)); return n, _num(m.group(2)) / n
    m = re.search(r'(\d+)\s*%\s*korting', l)
    if m: return 1, round(now, 2) if now else reg * (1 - int(m.group(1)) / 100)
    m = re.search(r'(\d+(?:[.,]\d{1,2})?)\s*(?:euro\s*)?korting', l)
    if m: return 1, reg - _num(m.group(1))
    m = re.search(r'^(?:nu\s*)?voor\s*(\d+(?:[.,]\d{1,2})?)\b', l)
    if m: return 1, _num(m.group(1))
    if now and now < reg: return 1, now
    return None

def promo_for(store, item):
    k = promo_key(store, item)
    pr = PROMOS.get(k) if k else None
    if not pr or (pr.get('t') and pr['t'] < TODAY): return 0
    reg = item['p']
    # controle: de normale prijs bij de bron moet ongeveer kloppen met onze prijs (anders is het een ander product/formaat)
    if pr.get('reg') and abs(reg - pr['reg']) > 0.2 * pr['reg']: return 0
    mod = (1, pr['unit']) if pr.get('unit') else promo_model(pr['l'], reg, pr.get('now'))
    if not mod: return 0
    mn, unit = mod
    if not (0.2 * reg <= unit <= reg * 0.98): return 0
    return [pr['l'], mn, round(unit, 2), pr.get('t') or '']

# ---------------------------------------------------------------- matching
U = {'g': 1, 'gr': 1, 'gram': 1, 'kg': 1000, 'kilo': 1000, 'ml': 1, 'milliliter': 1, 'cl': 10, 'l': 1000, 'liter': 1000, 'lt': 1000,
     'st': 1, 'stuks': 1, 'stuk': 1, 'rol': 1, 'rollen': 1, 'wasbeurten': 1, 'stk': 1}
KIND = {'g': 'g', 'gr': 'g', 'gram': 'g', 'kg': 'g', 'kilo': 'g', 'ml': 'ml', 'milliliter': 'ml', 'cl': 'ml', 'l': 'ml', 'liter': 'ml', 'lt': 'ml',
        'st': 'st', 'stuks': 'st', 'stuk': 'st', 'stk': 'st', 'rol': 'st', 'rollen': 'st', 'wasbeurten': 'st'}
SIZE_RX = re.compile(r'(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|kilo|gram|gr|g|milliliter|ml|cl|liter|lt|l|stuks|stuk|stk|st|rollen|rol|wasbeurten)\b', re.I)
GLOBAL_EXC = ['bonb', 'olvarit', 'maanden', 'mnd', 'biomenu', 'lidlmini', 'bio ', 'bio+', 'biologisch', 'biologische', 'snijder',
              'hond', 'kat ', 'kitten', 'puppy', '4m', '6m', '8m', '12m']
BRANDS = set("""ah jumbo plus g woon gwoon 1 de beste zuivelmeester melkan dekavers deka hoogvliet spar budget neutraal huismerk poiesz vomar
dirk lidl pcd excellent basic euroshopper markant altijd goed handig van der hollandse holland verse vers los per stuk stuks st kg g gram
liter l ml cl tros 100% fairtrade nederlandse heel zaanse hoeve extra voordeel voordeelverpakking pak kilo verpakt maat m xl s ca 5 4 3 2
6 10 bakkershart bakker wit bruin grand italia primoro smaakt vleeschmeesters boerentrots vis marine dole chiquita schoof gilse fruity
juice uniekaas melkunie calve calv natives farchioni naturel original taste regular sugar tradizionali trad durum tarwe gelderse asc msc
fyffes red bull coca cola heineken lotus page edet zewa prodent zendium colgate elmex douwe egberts perla lavazza segafredo intermezzo
pringles lays lay croky smiths duyvis tilda verkade dr oetker aviko mccain becel lipton spa haribo unox""".split())
DROP = {'roomboter', 'brood', 'croissants', 'stroopwafels', 'pizza', 'boter', 'chocolade', 'wasmiddel', 'shampoo'}
EXTRA = {
    'melk': dict(ban=['yoghurt', 'vanille']),
    'bananen': dict(ban=['haribo', 'chips', 'fyffes', 'brood', 'soes', 'cake', 'vla', 'smaak', 'bak', 'plant']),
    'appels': dict(ban=['elstar appel |'], skip=['spar']), 'tomaten': dict(skip=['spar']),
    'avocado': dict(ban=['stukjes']), 'broccoli': dict(ban=['fish', 'iglo']),
    'kipfilet': dict(ban=['americanos']), 'redbull': dict(ban=['7+1']),
    'chips': dict(ban=['nacho', 'lay', 'banan']),
    'kaas-geraspt': dict(ban=['kokos']),
    'wraps': dict(skip=['lidl'], ban=['wecare', 'mini', 'volkoren', 'chips', 'salsa', 'kit', 'saus', 'taco', 'kruiden', 'spinazie', 'tomaat', 'meergranen', 'glutenvrij', 'kip', 'vega', 'groente'], kind=None),
    'mais': dict(ban=['snack', 'ham']),
    'boerenkool': dict(ban=['stamppot', 'rookworst', 'worst']),
    'spekjes': dict(ban=['plant', 'vivera', 'vega']),
    'stroop': dict(ban=['wafel', 'koek', 'stift', 'bungel']),
    'nasigroente': dict(ban=['schijven', 'speciaal', 'padifood', 'ah nasi |']),
    'sperziebonen': dict(ban=['gebroken', 'hak ', 'pot', 'glas']),
}
NAMES = {'aardappelen': 'Aardappelen 3 kg', 'kipfilet': 'Kipfilet ±500g', 'spa': 'Bruisend mineraalwater 1,5L', 'zalm': 'Zalmfilet ±250g',
         'paprika': 'Paprika mix 3 st', 'hagelslag': 'Hagelslag puur', 'griekse': 'Yoghurt Griekse stijl 1kg', 'kaas': 'Jong belegen kaasplakken',
         'eieren': 'Scharreleieren 10 st', 'olijfolie': 'Olijfolie 500ml'}

def size(it):
    for t in (it.get('s'), it['n']):
        m = SIZE_RX.search(t or '')
        if m:
            return float(m.group(2).replace(',', '.')) * U[m.group(3).lower()] * int(m.group(1) or 1), KIND[m.group(3).lower()]
    if re.search(r'per stuk|per 1 st|1 stuks', (it.get('s') or '').lower()):
        return 1, 'st'
    return None, None

def norm(s): return re.sub(r'[^a-z0-9%+ ]', ' ', s.lower())
def tokens(s): return [t for t in re.split(r'[^a-z0-9]+', s.lower()) if t]

def best_match(spec, store):
    qt = {t for alt in spec['inc'] for w in alt.split('|') for t in tokens(w)}
    cands = []
    for it in current[store]['d']:
        n = ' ' + norm(it['n']) + ' '
        if not all(any(w in n for w in alt.split('|')) for alt in spec['inc']): continue
        if any((' ' + w) in n for w in spec['exc'] + GLOBAL_EXC): continue
        if not it.get('p') or it['p'] < 0.2: continue
        if any(b in (it['n'] + ' |').lower() for b in spec['ban']): continue
        if spec['kind']:
            q, k = size(it)
            if k != spec['kind'] or not (spec['lo'] <= q <= spec['hi']): continue
        extra = [t for t in tokens(it['n']) if t not in qt and t not in BRANDS
                 and not any(t.startswith(x) or x.startswith(t) for x in qt)
                 and not re.fullmatch(r'\d+([,.]\d+)?|\d+(g|kg|ml|l|st)', t)]
        pr = promo_for(store, it) if store in PROMO_STORES else 0
        cands.append((len(extra), pr[2] if pr else it['p'], it, pr))
    if not cands: return None
    m = min(c[0] for c in cands)
    if m > 2: return None
    # kies de goedkoopste, mét aanbiedingen; een product in de aanbieding mag één extra woord in de naam hebben (ander merk/variant)
    pool = [c for c in cands if c[0] == m or (c[3] and c[0] <= min(m + 1, 2))]
    return min(pool, key=lambda c: c[1])[2]

products = []
for sp in SPECS:
    pid = sp[0]
    if pid in DROP: continue
    e = EXTRA.get(pid, {})
    spec = dict(inc=sp[4], exc=sp[5], kind=e.get('kind', sp[6]), lo=sp[7], hi=sp[8], ban=e.get('ban', []))
    st = {}
    for s in STORES:
        if s not in current or s in e.get('skip', []): continue
        b = best_match(spec, s)
        if b:
            st[s] = [round(b['p'], 2), b['n'], b.get('s') or '', current[s]['u'] + b['l'], was_price(s, b), promo_for(s, b)]
    if len(st) >= 3:
        products.append(dict(id=pid, name=NAMES.get(pid, sp[1]), emoji=sp[2], cat=sp[3], st=st))

# ---------------------------------------------------------------- catalogus + dalingen
stores_present = [s for s in STORES if s in current]
rows, drops = [], []
for i, s in enumerate(stores_present):
    for it in current[s]['d']:
        if not it.get('p') or it['p'] < 0.2 or 'lidlmini' in it['n'].lower(): continue
        w = was_price(s, it)
        pr = promo_for(s, it) if s in PROMO_STORES else 0
        row = [i, it['n'], round(it['p'], 2), it.get('s') or '', it['l'], w, pr]
        rows.append(row)
        if w or pr: drops.append(row)
# Aldi zit niet in de Checkjebon-data: de aanbiedingen voegen we als losse producten toe
TODAY_ = datetime.date.today().isoformat()
aldi_offers = [a for a in ALDI_OFFERS if not a[6] or a[6] >= TODAY_]
if aldi_offers:
    ai = len(stores_present)
    stores_present.append('aldi')
    current['aldi'] = {'u': 'https://www.aldi.nl/product/', 'd': []}
    for name, price, strike, unit, slug, lab, until in aldi_offers:
        row = [ai, name, strike, unit, slug, 0, [lab, 1, price, until or '']]
        rows.append(row); drops.append(row)
def deal_ratio(r):  # lager = betere deal
    return min(r[6][2] / r[2] if r[6] else 1, r[2] / r[5] if r[5] else 1)
drops.sort(key=deal_ratio)

os.makedirs(OUT, exist_ok=True)
meta = dict(promos=sum(1 for r in rows if r[6]), promos_updated=(json.load(open(_pf)).get('updated') if os.path.exists(_pf) else None), updated=latest_date, built=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'), stores=stores_present,
            urls=[current[s]['u'] for s in stores_present], products=len(products), catalog=len(rows), drops=len(drops),
            source='Checkjebon.nl open data (MIT)')
def dump(name, obj):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
dump('meta.json', meta)
dump('products.json', dict(updated=latest_date, products=products))
dump('drops.json', dict(updated=latest_date, stores=stores_present, urls=meta['urls'], rows=drops[:600]))
with gzip.open(os.path.join(OUT, 'catalog.json.gz'), 'wt', encoding='utf-8', compresslevel=9) as f:
    json.dump(dict(stores=stores_present, urls=meta['urls'], rows=rows), f, ensure_ascii=False, separators=(',', ':'))
print(f"{len(products)} producten gekoppeld, {len(rows)} in catalogus, {len(drops)} deals ({meta['promos']} actuele aanbiedingen)")
