import requests
U={'user-agent':'Mozilla/5.0 (iPhone)'}
tests = ['https://web-fileserver.dekamarkt.nl/artikelen/268840_2026-11-04_02-31-01-779_f181ffe0-5b16-40d0-8a79-168cb453a855.png?width=200', 'https://web-fileserver.dekamarkt.nl/artikelen/268840_2026-11-04_02-31-01-779_f181ffe0-5b16-40d0-8a79-168cb453a855.png', 'https://web-fileserver.dirk.nl/artikelen/199724_1_467263_638614812972936179.png',
 'https://web-fileserver.dirk.nl/artikelen/199724_1_467263_638614812972936179.png?width=200',
 'https://web-fileserver.dirk.nl/artikelen/199724_1_467263_638614812972936179.png?width=200&height=200&mode=pad&format=webp',
 'https://web-fileserver.dirk.nl/artikelen/199724_1_467263_638614812972936179.png?width=200&converttowebp=1',
 'https://web-fileserver.dekamarkt.nl/artikelen/453136_2026-10-07_16-44-54-225_87f80539-ee57-4a7e-878b-ee487eb91000.png?width=200&converttowebp=1',
 'https://images.poiesz-supermarkten.nl/artikelen/589247.png?width=200&converttowebp=1',
 'https://images.poiesz-supermarkten.nl/artikelen/589247.png?width=200&mode=fill&converttowebp=1',
 'https://www.jumbo.com/dam-images/fit-in/180x180/Products/10102025_1760061700961_1760061708204_571377_BKR_04025.png',
 'https://www.lidl.nl/assets/gcpc18b1deabbcc4052992b1107cbe5d4eb.png?w=200',
 'https://static.ah.nl/dam/product/AHI_4354523130313834383537?revLabel=1&rendition=200x200_WEBP&fileType=binary']
for u in tests:
    try:
        x = requests.get(u, timeout=20, headers=U); print(x.status_code, x.headers.get('content-type'), len(x.content), u[:120])
    except Exception as e: print('fout', e, u[:80])
