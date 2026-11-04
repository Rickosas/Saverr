# Saverr (beta)

Saverr vergelijkt de prijzen van 10 Nederlandse supermarkten en laat je weten wanneer jouw favoriete producten goedkoper worden.

**Open de app:** https://rickosas.github.io/Saverr/

## Installeren op je telefoon

**iPhone (Safari)**
1. Open de link hierboven in **Safari**.
2. Tik onderin op **Deel** (vierkantje met pijl omhoog).
3. Kies **Zet op beginscherm** → **Voeg toe**.
4. Open Saverr vanaf je beginscherm en zet meldingen aan via *Meer → Instellingen*.

**Android (Chrome)**
1. Open de link in **Chrome**.
2. Tik op **Installeer** in de app, of open het menu (⋮) → **App installeren**.

## Wat zit erin
- Prijsvergelijking van ±40 veelgekochte producten over alle supermarkten
- Zoeken in het hele assortiment (±107.000 producten)
- Echte prijsdalingen: goedkoper dan de hoogste prijs van de afgelopen 4 weken
- Favorieten, prijsalarm en meldingen
- Boodschappenlijstje: bij welke winkel ben je het goedkoopst uit
- 🤖 Help mij besparen: weekmenu binnen je budget, met boodschappenlijst en besparing
- 📊 Weekoverzicht met deelknop voor WhatsApp
- Dashboard met je besparingen, challenges en punten
- Werkt offline; je gegevens blijven op je eigen telefoon

## Hoe de prijzen worden bijgewerkt
Elke ochtend draait een GitHub Action (`.github/workflows/update-prices.yml`). Die haalt de open data van
[Checkjebon.nl](https://www.checkjebon.nl) (MIT-licentie) op en bouwt de bestanden in `data/` opnieuw met
`scripts/build_data.py`. Je kunt de update ook handmatig starten via het tabblad **Actions** → *Prijzen bijwerken* → *Run workflow*.

## Bekende beperkingen van deze beta
- Aldi en Coop zitten niet in de open data.
- Bonus- en folderacties staan niet altijd in de data; Saverr ziet een korting pas als de online prijs daalt.
- Meldingen komen als je de app opent (nog geen achtergrondmeldingen).
- Ranglijst met vrienden, bonnetje scannen en cadeaubonnen komen in een volgende versie.
