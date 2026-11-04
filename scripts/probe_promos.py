import re, requests, json
UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'nl-NL,nl;q=0.9'}
t = requests.get('https://www.aldi.nl/aanbiedingen.html', headers=UA, timeout=30).text
i = t.find('strikePrice'); print(t[i-600:i+600])
