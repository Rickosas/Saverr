/* Saverr – weekmenu-planner ("Help mij besparen") en weekoverzicht met deelknop.
   Wordt geladen na app.js en gebruikt de data en helpers daaruit. */
'use strict';

/* Gezonde recepten voor 4 personen. Elk recept: groente + vlees of vis, volkoren waar het kan.
   ing: [product, deel van de verpakking, hoeveelheid, eenheid, omschrijving]
   (olie, zout, peper en gedroogde kruiden heb je meestal al in huis) */
const RECIPES = [
  {id:'kipcurry', name:'Kipcurry met spinazie en zilvervliesrijst', emoji:'🍛', main:'kip', time:35, tags:['🥦 veel groente','💪 eiwitrijk'],
   ing:[['kipfilet',1,500,'g','kipfilet, in blokjes'],['uien',.15,1,'st','ui, gesnipperd'],['knoflook',.1,2,'teen','knoflook, fijngehakt'],['paprika',.67,2,'st','rode paprika, in reepjes'],
        ['tomatenpuree',1,1,'blikje','tomatenpuree'],['kokosmelk',1,400,'ml','kokosmelk'],['spinazie',.75,300,'g','verse spinazie'],['zilvervliesrijst',.3,300,'g','zilvervliesrijst']],
   steps:['Kook de zilvervliesrijst volgens de verpakking (± 25 min).','Bak de ui en knoflook 2 minuten in een beetje olie. Voeg de kip toe en bak rondom bruin.',
          'Roer de tomatenpuree en 2 tl kerriepoeder erdoor en bak 1 minuut mee. Voeg de paprika toe.','Schenk de kokosmelk erbij en laat 10 minuten zachtjes pruttelen.',
          'Schep de spinazie erdoor tot hij geslonken is. Breng op smaak met zout en peper en serveer met de rijst.']},
  {id:'zalmoven', name:'Zalm uit de oven met broccoli en zoete aardappel', emoji:'🐟', main:'vis', time:40, tags:['🐟 omega-3','🥦 veel groente'],
   ing:[['zalm',2,4,'st','zalmfilets'],['zoete-aardappel',.8,800,'g','zoete aardappel, in blokjes'],['broccoli',1,1,'st','broccoli, in roosjes'],['knoflook',.1,2,'teen','knoflook']],
   steps:['Verwarm de oven voor op 200 °C.','Hussel de zoete aardappel met 1 el olie, zout, peper en paprikapoeder en rooster 15 minuten op een bakplaat.',
          'Leg de broccoli en de zalm op de bakplaat. Besprenkel met olie en de fijngehakte knoflook.','Bak alles nog 12–15 minuten tot de zalm gaar is. Lekker met een kneepje citroen.']},
  {id:'kippasta', name:'Volkoren pasta met kip, champignons en spinazie', emoji:'🍝', main:'kip', time:25, tags:['🌾 volkoren','🥦 veel groente'],
   ing:[['volkoren-pasta',.8,400,'g','volkoren penne'],['kipfilet',.8,400,'g','kipfilet, in reepjes'],['champignons',1,250,'g','champignons, in plakjes'],['spinazie',.75,300,'g','verse spinazie'],
        ['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],['griekse',.15,150,'g','Griekse yoghurt'],['kaas-geraspt',.33,50,'g','geraspte kaas']],
   steps:['Kook de pasta beetgaar.','Bak de ui en knoflook in een beetje olie, voeg de kip toe en bak gaar.','Bak de champignons 4 minuten mee en schep dan de spinazie erdoor.',
          'Zet het vuur laag en roer de Griekse yoghurt en een scheutje kookvocht erdoor. Meng met de pasta en bestrooi met de kaas.']},
  {id:'chili', name:'Chili con carne met extra groente', emoji:'🌶️', main:'gehakt', time:40, tags:['🫘 vezelrijk','💪 eiwitrijk'],
   ing:[['gehakt',1,500,'g','rundergehakt (mager)'],['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],['paprika',.67,2,'st','paprika, in blokjes'],['tomatenpuree',1,1,'blikje','tomatenpuree'],
        ['tomatenblokjes',2,2,'blik','tomatenblokjes'],['kidneybonen',1,1,'blik','kidneybonen, uitgelekt'],['mais',1,1,'blik','maïs, uitgelekt'],['zilvervliesrijst',.3,300,'g','zilvervliesrijst']],
   steps:['Kook de rijst volgens de verpakking.','Bak het gehakt rul in een grote pan. Voeg ui, knoflook en paprika toe en bak 3 minuten mee.',
          'Roer de tomatenpuree, 1 tl komijn en 1 tl paprikapoeder erdoor. Voeg de tomatenblokjes toe.','Laat 15 minuten zachtjes pruttelen. Roer de kidneybonen en maïs erdoor en verwarm nog 5 minuten.','Serveer met de rijst.']},
  {id:'wok', name:'Kip-wokschotel met broccoli en paprika', emoji:'🥘', main:'kip', time:25, tags:['🥦 veel groente','⚡ snel'],
   ing:[['kipfilet',1,500,'g','kipfilet, in reepjes'],['broccoli',1,1,'st','broccoli, in kleine roosjes'],['paprika',.67,2,'st','paprika, in reepjes'],['wortelen',.2,200,'g','wortel, in dunne reepjes'],
        ['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],['ketjap',.1,3,'el','ketjap manis'],['zilvervliesrijst',.3,300,'g','zilvervliesrijst']],
   steps:['Kook de rijst.','Verhit een wok met een beetje olie en roerbak de kip 4 minuten. Haal uit de pan.','Roerbak ui, knoflook, wortel en broccoli 4 minuten. Voeg de paprika toe en bak 2 minuten mee.',
          'Doe de kip terug in de wok, schenk de ketjap en een scheutje water erbij en warm alles door. Serveer met de rijst.']},
  {id:'koolvis', name:'Koolvis met prei, wortel en aardappelen', emoji:'🐟', main:'vis', time:35, tags:['🐟 mager','🥦 veel groente'],
   ing:[['witvis',1.25,500,'g','koolvisfilet'],['prei',2,2,'st','prei, in ringen'],['wortelen',.3,300,'g','wortel, in plakjes'],['aardappelen',.33,1000,'g','aardappelen']],
   steps:['Kook de aardappelen in 20 minuten gaar.','Bak de prei en wortel 8 minuten in een beetje olie tot ze zacht zijn. Breng op smaak met peper en nootmuskaat.',
          'Bestrooi de vis met zout en peper en bak hem 3–4 minuten per kant in een koekenpan.','Serveer de vis op de groente met de aardappelen.']},
  {id:'paprikavul', name:"Gevulde paprika's met gehakt en rijst", emoji:'🫑', main:'gehakt', time:45, tags:['🥦 veel groente','💪 eiwitrijk'],
   ing:[['paprika',1.33,4,'st','grote paprika’s'],['gehakt',.8,400,'g','rundergehakt (mager)'],['zilvervliesrijst',.15,150,'g','zilvervliesrijst'],['courgette',1,1,'st','courgette, in blokjes'],
        ['uien',.15,1,'st','ui'],['tomatenblokjes',1,1,'blik','tomatenblokjes'],['kaas-geraspt',.33,50,'g','geraspte kaas']],
   steps:['Kook de rijst en verwarm de oven voor op 200 °C.','Bak het gehakt rul met de ui. Voeg courgette en de helft van de tomatenblokjes toe en bak 5 minuten.',
          'Meng de rijst erdoor. Snijd de kapjes van de paprika’s, haal de zaadlijsten eruit en vul ze met het mengsel.',
          'Zet ze in een ovenschaal op de rest van de tomatenblokjes, bestrooi met kaas en bak 25 minuten.']},
  {id:'bloemkoolschotel', name:'Bloemkool-gehaktschotel met krieltjes', emoji:'🥦', main:'gehakt', time:40, tags:['🥦 veel groente'],
   ing:[['bloemkool',1,1,'st','bloemkool, in roosjes'],['gehakt',1,500,'g','rundergehakt (mager)'],['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],
        ['tomatenblokjes',1,1,'blik','tomatenblokjes'],['tomatenpuree',1,1,'blikje','tomatenpuree'],['krieltjes',.8,800,'g','krieltjes']],
   steps:['Verwarm de oven voor op 200 °C. Kook de bloemkool 5 minuten en laat uitlekken.','Bak het gehakt rul met ui en knoflook. Roer de tomatenpuree en tomatenblokjes erdoor en laat 5 minuten pruttelen.',
          'Doe het gehakt in een ovenschaal en leg de bloemkool erop. Bak 20 minuten in de oven.','Bak ondertussen de krieltjes in een beetje olie in 20 minuten goudbruin.']},
  {id:'kipsperzie', name:'Kipfilet met sperziebonen en krieltjes', emoji:'🫛', main:'kip', time:30, tags:['🥦 veel groente','💪 eiwitrijk'],
   ing:[['kipfilet',1,500,'g','kipfilet'],['sperziebonen',1,500,'g','sperziebonen'],['krieltjes',.8,800,'g','krieltjes'],['knoflook',.1,2,'teen','knoflook']],
   steps:['Bak de krieltjes in een beetje olie in ± 20 minuten gaar en goudbruin.','Kook de sperziebonen 8 minuten. Schep ze om met de fijngehakte knoflook en een beetje olie.',
          'Bestrooi de kipfilets met zout, peper en paprikapoeder en bak ze 5–6 minuten per kant tot ze gaar zijn.','Serveer alles samen.']},
  {id:'couscouskip', name:'Couscous met kip, courgette en paprika', emoji:'🥣', main:'kip', time:25, tags:['🥦 veel groente','⚡ snel'],
   ing:[['couscous',.7,300,'g','couscous'],['kipfilet',.8,400,'g','kipfilet, in blokjes'],['courgette',1,1,'st','courgette, in blokjes'],['paprika',.67,2,'st','paprika, in blokjes'],
        ['uien',.15,1,'st','rode ui'],['tomaten',.5,250,'g','tomaten, in partjes'],['knoflook',.1,1,'teen','knoflook']],
   steps:['Giet kokend water (met een bouillonblokje) over de couscous, dek af en laat 5 minuten wellen.','Bak de kip met ui en knoflook in een beetje olie gaar.',
          'Bak courgette en paprika 5 minuten mee. Breng op smaak met komijn, zout en peper.','Meng de couscous los met een vork, schep de kip en groente erdoor en verdeel de tomaat erover.']},
  {id:'bolognesegroente', name:'Volkoren bolognese met verstopte groente', emoji:'🍝', main:'gehakt', time:35, tags:['🌾 volkoren','🥦 veel groente'],
   ing:[['volkoren-pasta',.8,400,'g','volkoren penne'],['gehakt',.8,400,'g','rundergehakt (mager)'],['wortelen',.2,200,'g','wortel, geraspt'],['courgette',1,1,'st','courgette, in kleine blokjes'],
        ['champignons',1,250,'g','champignons, fijngehakt'],['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],['tomatenblokjes',2,2,'blik','tomatenblokjes'],['tomatenpuree',1,1,'blikje','tomatenpuree']],
   steps:['Bak het gehakt rul. Voeg ui, knoflook, wortel, courgette en champignons toe en bak 5 minuten mee.','Roer de tomatenpuree erdoor, voeg de tomatenblokjes en 1 tl Italiaanse kruiden toe.',
          'Laat de saus minstens 15 minuten zachtjes pruttelen.','Kook ondertussen de pasta en serveer met de saus.']},
  {id:'nasigroente', name:'Nasi met kip en veel groente', emoji:'🍛', main:'kip', time:30, tags:['🥦 veel groente'],
   ing:[['zilvervliesrijst',.3,300,'g','zilvervliesrijst (liefst van gisteren)'],['kipfilet',.8,400,'g','kipfilet, in blokjes'],['nasigroente',1,450,'g','nasi-/bamigroente'],
        ['eieren',.4,4,'st','eieren'],['ketjap',.1,3,'el','ketjap manis']],
   steps:['Kook de rijst en laat hem afkoelen (rijst van een dag eerder werkt het best).','Bak de kip in een wok met een beetje olie en 1 tl nasikruiden.',
          'Voeg de nasigroente toe en roerbak 5 minuten. Schep de rijst erdoor en bak mee tot alles warm is. Maak op smaak met ketjap.','Bak de eieren tot omelet, snijd in reepjes en leg ze op de nasi.']},
  {id:'zalmspinazie', name:'Volkoren pasta met zalm en spinazie', emoji:'🐟', main:'vis', time:25, tags:['🐟 omega-3','🌾 volkoren'],
   ing:[['volkoren-pasta',.8,400,'g','volkoren penne'],['zalm',2,4,'st','zalmfilets, in blokjes'],['spinazie',1,400,'g','verse spinazie'],['tomaten',.5,250,'g','tomaten, in blokjes'],
        ['knoflook',.1,2,'teen','knoflook'],['griekse',.15,150,'g','Griekse yoghurt']],
   steps:['Kook de pasta beetgaar.','Bak de knoflook kort in een beetje olie en bak de zalm 4 minuten mee.','Voeg de spinazie en tomaat toe en laat de spinazie slinken.',
          'Zet het vuur laag, roer de Griekse yoghurt erdoor en meng met de pasta. Breng op smaak met peper en citroen.']},
  {id:'wrapskip', name:'Volle wraps met kip, bonen en groente', emoji:'🌯', main:'kip', time:25, tags:['🥦 veel groente','🫘 vezelrijk'],
   ing:[['wraps',1,8,'st','tortillawraps'],['kipfilet',1,500,'g','kipfilet, in reepjes'],['paprika',.67,2,'st','paprika, in reepjes'],['uien',.15,1,'st','ui'],['mais',1,1,'blik','maïs'],
        ['kidneybonen',1,1,'blik','kidneybonen'],['ijsbergsla',.5,.5,'st','ijsbergsla'],['tomaten',.5,250,'g','tomaten'],['griekse',.15,150,'g','Griekse yoghurt']],
   steps:['Bak de kip met ui en paprika in een beetje olie. Breng op smaak met 1 tl paprikapoeder en 1 tl komijn.','Voeg de uitgelekte bonen en maïs toe en warm 3 minuten mee.',
          'Snijd de sla en tomaat. Verwarm de wraps kort in een droge pan.','Vul de wraps met de kip, groente en een lepel Griekse yoghurt.']},
  {id:'hutspotbal', name:'Hutspot met magere gehaktballetjes', emoji:'🥕', main:'gehakt', time:40, tags:['🥦 veel groente','🇳🇱 Hollands'],
   ing:[['aardappelen',.33,1000,'g','aardappelen'],['wortelen',.6,600,'g','winterpeen'],['uien',.45,3,'st','uien'],['gehakt',.8,400,'g','rundergehakt (mager)']],
   steps:['Schil de aardappelen en snijd ze met de wortel en uien in stukken. Kook alles samen in 20 minuten gaar.',
          'Kruid het gehakt met zout, peper en nootmuskaat, draai er kleine balletjes van en bak ze in ± 10 minuten gaar.','Giet de groente af en stamp met een scheutje melk tot hutspot. Serveer met de balletjes.']},
  {id:'zoeteovenschotel', name:'Ovenschotel met zoete aardappel, kip en spinazie', emoji:'🍠', main:'kip', time:45, tags:['🥦 veel groente','💪 eiwitrijk'],
   ing:[['zoete-aardappel',.8,800,'g','zoete aardappel, in plakjes'],['kipfilet',1,500,'g','kipfilet, in blokjes'],['spinazie',.75,300,'g','verse spinazie'],['uien',.15,1,'st','ui'],
        ['knoflook',.1,2,'teen','knoflook'],['tomatenblokjes',1,1,'blik','tomatenblokjes'],['kaas-geraspt',.33,50,'g','geraspte kaas']],
   steps:['Verwarm de oven voor op 200 °C. Kook de plakjes zoete aardappel 5 minuten voor.','Bak de kip met ui en knoflook gaar. Voeg de tomatenblokjes en spinazie toe en laat 3 minuten pruttelen.',
          'Doe het kipmengsel in een ovenschaal, leg de zoete aardappel er dakpansgewijs op en bestrooi met kaas.','Bak 25 minuten in de oven tot de bovenkant goudbruin is.']},

  /* ---- cheatday 🍔 (alleen als je die optie aanzet) ---- */
  {id:'cheat-pizza', cheat:true, name:'Pizza-avond', emoji:'🍕', main:'cheat', time:15, tags:['🍔 cheatday','😋 geniet ervan'],
   ing:[['pizza-m',3,3,'st','diepvriespizza’s margherita'],['ijsbergsla',.5,.5,'st','ijsbergsla (voor het geweten 😉)']],
   steps:['Verwarm de oven volgens de verpakking.','Bak de pizza’s goudbruin.','Snijd wat sla als bijgerecht (of sla die stap gerust over, het is cheatday).']},
  {id:'cheat-pannenkoek', cheat:true, name:'Pannenkoeken met stroop', emoji:'🥞', main:'cheat', time:30, tags:['🍔 cheatday','🇳🇱 Hollands'],
   ing:[['pannenkoekenmix',1,400,'g','pannenkoekenmix'],['melk',1,750,'ml','melk'],['eieren',.2,2,'st','eieren'],['stroop',.25,6,'el','schenkstroop']],
   steps:['Klop de mix met de melk en eieren tot een glad beslag (zie verpakking).','Bak dunne pannenkoeken in een hete pan met een klontje boter.','Serveer met stroop. Poedersuiker mag ook vandaag!']},
  {id:'cheat-friet', cheat:true, name:'Friet met gehaktballen', emoji:'🍟', main:'cheat', time:30, tags:['🍔 cheatday','😋 comfortfood'],
   ing:[['friet',1,1000,'g','diepvriesfriet'],['gehakt',1,500,'g','rundergehakt'],['uien',.1,1,'st','ui, fijngesnipperd']],
   steps:['Bak de friet in de oven of airfryer volgens de verpakking.','Kneed het gehakt met de ui, zout en peper en draai er balletjes van.','Bak de balletjes in 10–12 minuten rondom bruin en gaar. Mayo erbij? Het is cheatday!']},
  {id:'cheat-burger', cheat:true, name:'Smashburgers met cheddar en friet', emoji:'🍔', main:'cheat', time:30, tags:['🍔 cheatday','🔥 crispy'],
   ing:[['gehakt',1,500,'g','rundergehakt'],['hamburgerbroodjes',1,4,'st','hamburgerbroodjes'],['cheddar',.5,4,'plak','cheddar'],['uien',.15,1,'st','ui, in ringen'],
        ['ijsbergsla',.25,.25,'st','ijsbergsla'],['tomaten',.4,2,'st','tomaten, in plakken'],['friet',1,1000,'g','diepvriesfriet']],
   steps:['Bak de friet in de oven of airfryer volgens de verpakking.','Draai 8 balletjes van het gehakt (± 60 g) en bestrooi met zout en peper.',
          'Leg ze in een gloeiend hete pan en druk ze met een spatel plat (smash!). Bak 2 minuten tot er een knapperig korstje is, draai om en leg er cheddar op.',
          'Rooster de broodjes kort. Stapel 2 burgers per broodje met sla, tomaat en ui. Saus naar keuze, het is cheatday!']},
  {id:'cheat-kapsalon', cheat:true, name:'Kapsalon', emoji:'🥙', main:'cheat', time:25, tags:['🍔 cheatday','🇳🇱 Rotterdams'],
   ing:[['friet',.75,750,'g','diepvriesfriet'],['kipshoarma',1.25,500,'g','kipshoarma'],['kaas-geraspt',1,150,'g','geraspte kaas'],['ijsbergsla',.5,.5,'st','ijsbergsla'],
        ['tomaten',.5,250,'g','tomaten'],['komkommer',.5,.5,'st','komkommer'],['knoflooksaus',1,150,'g','knoflooksaus']],
   steps:['Bak de friet goudbruin. Verwarm de grill van de oven voor.','Bak de shoarma 6–8 minuten in een hete pan.',
          'Verdeel de friet over een ovenschaal (of 4 bakjes), leg de shoarma erop en strooi de kaas erover. Gratineer 3–4 minuten onder de grill.',
          'Maak af met sla, tomaat en komkommer en een flinke scheut knoflooksaus.']},
  {id:'cheat-nachos', cheat:true, name:"Loaded nacho's uit de oven", emoji:'🧀', main:'cheat', time:25, tags:['🍔 cheatday','🎉 om te delen'],
   ing:[['tortillachips',2,400,'g','tortillachips naturel'],['gehakt',.8,400,'g','rundergehakt'],['kidneybonen',1,1,'blik','kidneybonen'],['mais',1,1,'blik','maïs'],
        ['kaas-geraspt',1,150,'g','geraspte kaas'],['tomaten',.5,250,'g','tomaten, in blokjes'],['paprika',.33,1,'st','paprika'],['griekse',.15,150,'g','Griekse yoghurt (als zure room)']],
   steps:['Verwarm de oven voor op 200 °C.','Bak het gehakt rul met 1 tl paprikapoeder en 1 tl komijn. Roer de bonen en maïs erdoor.',
          'Leg de chips op een bakplaat, schep het gehaktmengsel erover en strooi de kaas erop. Bak 8 minuten tot de kaas gesmolten is.',
          'Top met tomaat, paprika en een lepel yoghurt. Direct uit de pan eten!']},
  {id:'cheat-macncheese', cheat:true, name:'Mac & cheese met spekjes', emoji:'🧀', main:'cheat', time:30, tags:['🍔 cheatday','😋 comfortfood'],
   ing:[['macaroni',1,500,'g','macaroni'],['spekjes',1,175,'g','spekblokjes'],['melk',.5,500,'ml','melk'],['kaas-geraspt',2,300,'g','geraspte kaas'],['paneermeel',.33,50,'g','paneermeel']],
   steps:['Kook de macaroni beetgaar en verwarm de oven voor op 200 °C.','Bak de spekjes uit in een droge pan.',
          'Smelt 30 g boter, roer er 2 el bloem door en voeg al roerend de melk toe tot een gladde saus. Roer er 2/3 van de kaas door.',
          'Meng saus, macaroni en spekjes in een ovenschaal, strooi de rest van de kaas en het paneermeel erover en bak 15 minuten tot goudbruin.']},
  {id:'cheat-lasagne', cheat:true, name:'Huisgemaakte lasagne', emoji:'🍝', main:'cheat', time:60, tags:['🍔 cheatday','🇮🇹 Italiaans'],
   ing:[['lasagnebladen',1,250,'g','lasagnebladen'],['gehakt',1,500,'g','rundergehakt'],['uien',.15,1,'st','ui'],['knoflook',.1,2,'teen','knoflook'],
        ['tomatenblokjes',2,2,'blik','tomatenblokjes'],['melk',.5,500,'ml','melk'],['kaas-geraspt',1,150,'g','geraspte kaas']],
   steps:['Bak het gehakt rul met ui en knoflook, voeg de tomatenblokjes en Italiaanse kruiden toe en laat 15 minuten pruttelen.',
          'Maak een witte saus: smelt 40 g boter, roer er 3 el bloem door en voeg al roerend de melk toe.',
          'Verwarm de oven voor op 190 °C. Maak laagjes in een ovenschaal: gehaktsaus, lasagnebladen, witte saus. Herhaal en eindig met witte saus.',
          'Strooi de kaas erover en bak 35 minuten. Laat 5 minuten rusten voor het aansnijden.']},
  {id:'cheat-nuggets', cheat:true, name:'Krokante kipnuggets met friet', emoji:'🍗', main:'cheat', time:35, tags:['🍔 cheatday','👨‍👩‍👧 kids-favoriet'],
   ing:[['kipfilet',1,500,'g','kipfilet'],['paneermeel',1,150,'g','paneermeel'],['eieren',.2,2,'st','eieren'],['friet',1,1000,'g','diepvriesfriet']],
   steps:['Snijd de kip in stukjes van een paar centimeter en bestrooi met zout, peper en paprikapoeder.','Haal de stukjes eerst door het losgeklopte ei en dan door het paneermeel.',
          'Bak de nuggets in een laagje olie 3–4 minuten per kant goudbruin (of 12 minuten in de airfryer op 200 °C).','Bak ondertussen de friet. Dippen in je favoriete saus!']},
  {id:'cheat-shoarma', cheat:true, name:'Shoarma-wraps met knoflooksaus', emoji:'🌯', main:'cheat', time:20, tags:['🍔 cheatday','⚡ snel'],
   ing:[['wraps',1,8,'st','tortillawraps'],['kipshoarma',1.25,500,'g','kipshoarma'],['ijsbergsla',.5,.5,'st','ijsbergsla'],['tomaten',.5,250,'g','tomaten'],
        ['uien',.1,1,'st','rode ui'],['knoflooksaus',1,150,'g','knoflooksaus']],
   steps:['Bak de shoarma 6–8 minuten in een hete pan.','Snijd sla, tomaat en ui.','Verwarm de wraps kort in een droge pan.',
          'Beleg de wraps met sla, shoarma, tomaat en ui, schep er knoflooksaus over en rol ze op.']},

];
const HEALTHY = () => RECIPES.filter(r=>!r.cheat && recipeOK(r));
const CHEATS = () => RECIPES.filter(r=>r.cheat && recipeOK(r));
/* foto's: Wikimedia Commons (vrije licenties), verkleind in /recipes */
const RECIPE_PHOTOS = {"kipcurry": {"a": "pelican from Tokyo, Japan", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Chicken_spinach_curry_(424955518).jpg"}, "kippasta": {"a": "HaJunkiyada", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Ravioli_with_mushrooms_and_spinach_in_cream_sauce.jpg"}, "chili": {"a": "Carstor", "l": "CC BY-SA 2.5", "u": "https://commons.wikimedia.org/wiki/File:Bowl_of_chili.jpg"}, "wok": {"a": "Ginny", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Ginger_chicken_(3168342551).jpg"}, "paprikavul": {"a": "Mark Bonica", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Quinoa_stuffed_peppers.jpg"}, "kipsperzie": {"a": "Daderot", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Potatoes,_chicken_breast,_and_green_beans,_peas,_and_asparagus_-_Boston,_MA.jpg"}, "couscouskip": {"a": "HaJunkiyada", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Algerian_couscous_with_vegetable_soup_and_chicken.jpg"}, "zalmoven": {"a": "Famartin", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:2022-01-29_20_53_20_Blackened_Cajun_Salmon_(6_oz._blackened_and_grilled_salmon_fillet_with_garlic_mashed_potatoes_and_steamed_broccoli)_at_the_Applebee%27s_in_Fair_Lakes,_Fairfax_County,_Virginia.jpg"}, "koolvis": {"a": "Nonepse", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Lohikeitto_dish.jpg"}, "bolognesegroente": {"a": "Matěj Baťha", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Penne_Bolognese_(Tesco).jpg"}, "nasigroente": {"a": "Supardisahabu", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Nasi_Goreng_Kampung.jpg"}, "zalmspinazie": {"a": "PattayaPatrol", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:DSCF0412_Seared_salmon_fillet_topped_with_saut%C3%A9ed_shrimp_served_with_creamed_spinach_and_a_side_salad.jpg"}, "wrapskip": {"a": "Luca Nebuloni from Milan, Italy", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Chicken_roll_with_vegetables_%26_goat_cheese_(5742199145).jpg"}, "hutspotbal": {"a": "Takeaway", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:2015_0330_Hutspot_karbonade.jpg"}, "zoeteovenschotel": {"a": "Alikiiaa", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Sweet_Potato_Sauteed_With_Honey.jpg"}, "cheat-pizza": {"a": "Mario56", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Margherita_Originale.JPG"}, "cheat-pannenkoek": {"a": "Takeaway", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:2015_01_Spekpannenkoek.jpg"}, "cheat-friet": {"a": "Neil Conway from Oakland, USA", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Sunday_morning_meatballs_and_shopping._(7481070476).jpg"}, "cheat-burger": {"a": "Kyethepie21", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Burger_Chips_and_a_Coke.jpg"}, "cheat-kapsalon": {"a": "MartinD", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Kapsalon_Amstelveen.jpg"}, "cheat-nachos": {"a": "Missvain", "l": "CC BY 4.0", "u": "https://commons.wikimedia.org/wiki/File:Nachos_at_Maya_Restaurant_-_2021-10-03_-_Sarah_Stierch.jpg"}, "cheat-macncheese": {"a": "Michael Rivera", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Dave_%26_Buster%27s_Marietta_mac_and_cheese.JPG"}, "cheat-lasagne": {"a": "Wheeler Cowperthwaite", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Eggplant_Lasagna_(Vegitarian)_(2_of_6).jpg"}, "cheat-nuggets": {"a": "Horacio Cambeiro", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Papas_fritas_caseras_y_nuggets_de_pollo_en_platos_con_papel_madera.jpg"}, "cheat-shoarma": {"a": "Andy Li", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Handmade_Chicken_Shawarma_Wrap_-_Lavash.jpg"}};
const recipePhoto = id => RECIPE_PHOTOS[id] ? `recipes/${id}.jpg` : '';

/* normale prijs van een product = mediaan van de normale prijzen (zonder prijsdalingen) over alle winkels */
const normalOf = p => { const v=Object.keys(p.st).map(sid=>regOf(p,sid)).sort((a,b)=>a-b); return v[Math.floor((v.length-1)/2)]; };
const recipeOK = r => r.ing.every(([id])=>P(id));
const unitPrice = (p,sid) => has(p,sid) ? unitEff(p,sid) : median(p);

/* boodschappen voor een set recepten bij één winkel */
function planCost(recipeIds, sid, persons){
  const k=persons/4, need={};
  recipeIds.forEach(rid=>RECIPES.find(r=>r.id===rid).ing.forEach(([id,q])=>{ need[id]=(need[id]||0)+q*k; }));
  let total=0, normal=0, regular=0, missing=0, drops=0; const items=[];
  Object.entries(need).forEach(([id,q])=>{
    const p=P(id), ok=has(p,sid), pr=ok&&promo(p,sid);
    let n=Math.max(1,Math.ceil(q-0.05)); if(pr && n<pr[1] && costAt(p,sid,pr[1])<=costAt(p,sid,n)+0.001) n=pr[1];   // gratis extra pakken meenemen
    const cost=ok?costAt(p,sid,n):n*median(p), np=normalOf(p);
    if(!ok) missing++; if(ok&&(was(p,sid)||pr)) drops++;
    total+=cost; normal+=n*np; regular+=ok?n*regOf(p,sid):n*median(p); items.push({id,p,n,cost,np,ok,promo:pr,drop:ok&&(was(p,sid)>0||!!pr)});
  });
  const meals = recipeIds.map(rid=>{ const r=RECIPES.find(x=>x.id===rid); return {r, cost:r.ing.reduce((t,[id,q])=>t+q*k*unitPrice(P(id),sid),0)}; });
  return {sid,total,normal,regular,missing,drops,items:items.sort((a,b)=>b.cost-a.cost),meals};
}
/* menu bij één winkel + vergelijking met de duurste van je winkels zonder aanbiedingen */
function evalPlan(ids, sid, persons, storeIds){
  const c=planCost(ids,sid,persons);
  let ref=c.regular, refSid=sid;
  storeIds.forEach(x=>{ if(x===sid) return; const o=planCost(ids,x,persons); if(o.missing<=c.missing && o.regular>ref){ ref=o.regular; refSid=x; } });
  c.ref=ref; c.refSid=refSid; c.saved=Math.max(0,ref-c.total); c.dealSaved=Math.max(0,c.regular-c.total); c.storeSaved=Math.max(0,ref-c.regular);
  return c;
}
const planStores = f => { const mine=CMP_STORES.filter(s=>st.myStores.includes(s.id)); return (f.allStores||!mine.length?CMP_STORES:mine).map(s=>s.id); };

function makePlan({persons,budget,days,allStores}, fixed=null){
  const pool=HEALTHY(), cheats=CHEATS(), stores=planStores({allStores}), cheat=arguments[0].cheat && cheats.length;
  // cheatday: één keer willekeurig kiezen (niet op prijs), zodat je elke keer verrast wordt
  const cheatId = cheat ? cheats[Math.floor(Math.random()*cheats.length)].id : null;
  let best=null; const cands=[];
  const score = c => {
    const over=Math.max(0,c.total-budget);
    const mains=new Set(c.meals.filter(m=>!m.r.cheat).map(m=>m.r.main)).size;
    return -over*10 + c.saved*1.5 + (budget-c.total) + mains - c.missing*4 + Math.random()*2;
  };
  for(let i=0;i<500;i++){
    let ids;
    if(fixed){ ids=[...fixed.ids]; const isCheat=RECIPES.find(r=>r.id===ids[fixed.swap]).cheat;
      const choices=(isCheat?cheats:pool).filter(r=>!ids.includes(r.id)); if(!choices.length) break; ids[fixed.swap]=choices[Math.floor(Math.random()*choices.length)].id; }
    else { const sh=[...pool].sort(()=>Math.random()-.5); ids=sh.slice(0,days).map(r=>r.id); if(cheatId) ids.push(cheatId); }
    // max 2 keer dezelfde hoofdingrediënt
    const cnt={}; if(ids.some(id=>{ const m=RECIPES.find(r=>r.id===id).main; cnt[m]=(cnt[m]||0)+1; return m!=='cheat' && cnt[m]>2; })) continue;
    for(const sid of (fixed?[fixed.sid]:stores)){
      const c=evalPlan(ids,sid,persons,stores); c.score=score(c); c.ids=ids; cands.push(c);
      if(!best||c.score>best.score) best=c;
    }
  }
  // kies willekeurig uit de bijna-beste menu's, zodat je elke keer iets anders krijgt
  const key=c=>[...c.ids].sort().join()+c.sid, seen=new Set();
  const top=cands.filter(c=>c.score>=best.score-3 && !seen.has(key(c)) && seen.add(key(c)));
  return top[Math.floor(Math.random()*top.length)] || best;
}

let planForm = null;
function viewPlanner(){
  const f = planForm || (planForm = Object.assign({persons:4,budget:60,days:5,allStores:false}, st.planPrefs||{}));
  if(st.plan && !(st.plan.ids||[]).every(id=>RECIPES.some(r=>r.id===id && recipeOK(r)))) { st.plan=null; save(); }   // oud menu met verdwenen recepten
  const plan = st.plan && st.plan.ids ? evalPlan(st.plan.ids, st.plan.sid, st.plan.persons, planStores(st.plan)) : null;
  const start = new Date(st.plan?.created||Date.now());
  const step = (k,min,max,stepv,fmt) => `<div class="row"><div class="st">${{persons:'Aantal personen',budget:'Budget',days:'Aantal avonden'}[k]}</div>
    <button class="btn sm ghost" data-pstep="${k}|${-stepv}|${min}|${max}">−</button><b style="min-width:56px;text-align:center;font-family:'Bricolage Grotesque';font-size:17px">${fmt(f[k])}</b><button class="btn sm ghost" data-pstep="${k}|${stepv}|${min}|${max}">+</button></div>`;
  return `<button class="back" data-act="back">‹ Terug</button>
    <h2>🤖 Help mij besparen</h2>
    <p class="hint">Saverr maakt een <b>gezond weekmenu</b> (groente met vlees of vis, volkoren waar het kan) binnen je budget, met de prijzen en aanbiedingen van vandaag. Tik op een gerecht voor het recept.</p>
    ${step('persons',1,8,1,v=>v)}
    ${step('budget',15,250,5,v=>'€'+v)}
    ${step('days',2,7,1,v=>v)}
    <div class="row"><div class="st">🍔 Cheatday-maaltijd<em>Eén extra avond zonder schuldgevoel</em></div>
      <button class="switch ${f.cheat?'on':''}" data-act="cheat" aria-label="Cheatday"></button></div>
    <div class="chips" style="margin-top:6px"><button class="chip ${!f.allStores?'on':''}" data-pall="0">📍 Mijn winkels</button><button class="chip ${f.allStores?'on':''}" data-pall="1">Alle supermarkten</button></div>
    <button class="btn green" data-act="mkplan">${plan?'🔄 Maak een nieuw weekmenu':'✨ Maak mijn weekmenu'}</button>
    ${plan?planHTML(plan,start):''}`;
}
const dayLabel = d => { const t=new Date(); t.setHours(0,0,0,0); const x=new Date(d); x.setHours(0,0,0,0); const diff=Math.round((x-t)/864e5);
  const name = diff===0?'Vandaag':diff===1?'Morgen':DAYS[d.getDay()].replace(/^./,c=>c.toUpperCase());
  return `${name} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`; };
const past = d => { const t=new Date(); t.setHours(0,0,0,0); const x=new Date(d); x.setHours(0,0,0,0); return x<t; };
function planHTML(c,start){
  const p=st.plan, over=c.total>p.budget+0.005;
  return `<h2>🍝 Jouw weekmenu</h2>
    <p class="hint">${p.persons} personen · ${p.ids.length} avonden${p.cheat?' (incl. 🍔 cheatday)':''} · alles bij <b>${S(c.sid).name}</b>${c.missing?` · ${c.missing} product(en) daar niet gevonden (geschat)`:''}</p>
    <div class="list">${c.meals.map((m,i)=>{const d=new Date(start); d.setDate(d.getDate()+i); return `<div class="item static">
      <div data-recipe="${m.r.id}" style="cursor:pointer">${pic(recipePhoto(m.r.id),m.r.emoji)}</div><div class="info" data-recipe="${m.r.id}" style="cursor:pointer"><div class="meta" style="font-weight:600;color:${past(d)?'var(--muted)':m.r.cheat?'var(--deal)':'var(--green)'}">${dayLabel(d)}${past(d)?' · geweest':''}${m.r.cheat?' · 🍔 Cheatday!':''}</div><div class="name" style="white-space:normal">${m.r.name}</div><div class="meta">⏱ ${m.r.time} min · ${macros(m.r).kcal} kcal · ${macros(m.r).eiwit} g eiwit · <span style="color:var(--green);font-weight:600">recept ›</span></div></div>
      <div class="price"><b>${euro(m.cost)}</b></div><button class="fav sm" data-swap="${i}" title="Ander gerecht" aria-label="Ander gerecht" style="color:var(--green)">🔄</button></div>`}).join('')}</div>
    <div class="savebig" style="margin-top:12px">
      <div class="brk" style="margin-top:0"><div><span>Zonder slim kiezen<br><small style="opacity:.8">${S(c.refSid).name}, zonder aanbiedingen</small></span><b><s style="opacity:.7">${euro(c.ref)}</s></b></div>
        <div><span>Bij ${S(c.sid).name}, mét ${c.drops} aanbieding${c.drops===1?'':'en'}</span><b>${euro(c.total)}</b></div></div>
      <div style="font-size:13px;opacity:.85;margin-top:10px">💰 Bespaard</div><div class="amt">${euro(c.saved)}</div>
      ${c.saved>=0.01?`<div style="font-size:12.5px;opacity:.9;margin-bottom:4px">🏷️ ${euro(c.dealSaved)} door aanbiedingen${c.storeSaved>=0.01?` · 🏪 ${euro(c.storeSaved)} door de winkelkeuze`:''}</div>`:`<div style="font-size:12.5px;opacity:.9;margin-bottom:4px">Deze week geen extra voordeel bij je winkels. Tip: zet bij <i>Mijn winkels</i> meer supermarkten aan, of kies "Alle supermarkten".</div>`}
      <div style="font-size:12.5px;opacity:.85">${over?`⚠️ ${euro(c.total-p.budget)} boven je budget van ${euro(p.budget)}. Probeer minder avonden of een hoger budget.`:`✓ Binnen je budget van ${euro(p.budget)} (${euro(p.budget-c.total)} over)`}</div></div>
    <button class="btn green" data-act="plan2list">🛒 Zet op mijn boodschappenlijst</button>
    <h2>Boodschappen (${c.items.length})</h2>
    <div class="list">${c.items.map(it=>`<div class="item" data-open="${it.id}">${it.ok?picStore(storeImg(it.p,c.sid),it.p.emoji,c.sid):pic("",it.p.emoji)}
      <div class="info"><div class="name">${it.n>1?it.n+'× ':''}${esc(it.p.name)}</div><div class="meta">${it.ok?esc(it.p.st[c.sid][1]):'Niet bij '+S(c.sid).name+' (geschat)'}</div>${it.promo?`<span class="deal-tag">🏷️ ${esc(it.promo[0])}</span>`:it.drop?`<span class="deal-tag">🔥 Prijsdaling</span>`:''}</div>
      <div class="price"><b>${euro(it.cost)}</b>${it.ok&&it.n*regOf(it.p,c.sid)>it.cost+0.005?`<s>${euro(it.n*regOf(it.p,c.sid))}</s>`:''}</div></div>`).join('')}</div>
    <p class="demo">Het totaal is voor hele verpakkingen; wat over blijft (zoals uien of ketjap) kun je later gebruiken. Zout, olie en kruiden heb je meestal al in huis. "Zonder slim kiezen" = hetzelfde menu bij de duurste van je gekozen winkels, zonder aanbiedingen. Aanbiedingen zoals 1+1 gratis zijn al meegerekend.</p>`;
}
function doPlan(swapIndex=null){
  const f=planForm; st.planPrefs={...f};
  const c = swapIndex==null ? makePlan(f) : makePlan({...f,persons:st.plan.persons,budget:st.plan.budget,days:st.plan.ids.length,allStores:st.plan.allStores}, {ids:st.plan.ids, swap:swapIndex, sid:st.plan.sid});
  if(!c) return push('Er kon geen weekmenu gemaakt worden.');
  st.plan={ids:c.ids,sid:c.sid,persons:swapIndex==null?f.persons:st.plan.persons,budget:swapIndex==null?f.budget:st.plan.budget,allStores:swapIndex==null?f.allStores:st.plan.allStores,cheat:swapIndex==null?f.cheat:st.plan.cheat,created:swapIndex==null?Date.now():st.plan.created};
  if(swapIndex==null && st.planPts!==WEEK){ st.planPts=WEEK; addPoints(20,'Weekmenu gemaakt'); push(`✨ Weekmenu klaar: ${euro(c.saved)} bespaard! +20 punten.`); }
  save(); render();
}

/* ---------- macro's per portie (schatting, gemiddelde voedingswaarden per 100 g, rauw/droog) ---------- */
// id: [kcal, eiwit, koolhydraten, vet, gram per eenheid {st, teen, blik, blikje, el, plak}]
const NUTRI = {
  kipfilet:[110,24,0,1.5], uien:[37,1.2,7,.2,{st:100}], knoflook:[140,6,28,.5,{teen:4}], paprika:[30,1,5,.3,{st:160}],
  tomatenpuree:[90,4.5,15,.5,{blikje:70}], kokosmelk:[190,1.8,3,19], spinazie:[23,2.9,1,.4], zilvervliesrijst:[355,8,74,2.5],
  zalm:[200,20,0,13,{st:125}], 'zoete-aardappel':[86,1.6,20,.1], broccoli:[34,3,4,.4,{st:350}], 'volkoren-pasta':[350,13,64,2.5],
  champignons:[22,3,.5,.3], griekse:[120,4,4,10], 'kaas-geraspt':[380,25,0,31], gehakt:[210,19,0,15],
  tomatenblokjes:[22,1.2,3.5,.2,{blik:400}], kidneybonen:[105,7,14,.5,{blik:250}], mais:[85,2.8,15,1.3,{blik:285}],
  wortelen:[38,.8,7,.2], ketjap:[280,1.5,68,0,{el:15}], witvis:[85,19,0,1], prei:[30,1.6,5,.3,{st:150}],
  aardappelen:[80,2,17,.1], courgette:[18,1.5,2.5,.3,{st:300}], bloemkool:[25,2,3,.3,{st:600}], krieltjes:[80,2,17,.1],
  sperziebonen:[30,2,4,.2], couscous:[360,12,72,1.5], tomaten:[20,.9,3,.2,{st:100}], nasigroente:[30,1.5,5,.3],
  eieren:[140,12.5,.5,10,{st:55}], wraps:[300,8,50,7,{st:45}], ijsbergsla:[14,1,2,.1,{st:500}], 'pizza-m':[240,10,30,9,{st:320}],
  pannenkoekenmix:[350,10,72,2], melk:[46,3.5,4.7,1.5], stroop:[300,.5,75,0,{el:20}], friet:[170,2.5,25,6],
  hamburgerbroodjes:[270,9,48,4.5,{st:60}], cheddar:[400,25,0,33,{plak:20}], kipshoarma:[160,20,2,8], komkommer:[12,.7,2,.1,{st:400}],
  knoflooksaus:[400,1,8,40], tortillachips:[490,7,60,24], macaroni:[355,12,71,1.5], spekjes:[300,15,0,27],
  paneermeel:[370,12,72,3], lasagnebladen:[355,12,71,1.5]
};
function macros(r){
  const t=[0,0,0,0]; let ok=true;
  for(const [id,,amt,unit] of r.ing){
    const n=NUTRI[id]; if(!n){ ok=false; continue; }
    const g = (unit==='g'||unit==='ml') ? amt : amt*((n[4]||{})[unit]||0);
    if(!g){ ok=false; continue; }
    for(let i=0;i<4;i++) t[i]+=n[i]*g/100;
  }
  const [kcal,eiwit,kh,vet]=t.map(v=>v/4);   // recepten zijn voor 4 porties
  return {kcal:Math.round(kcal/10)*10, eiwit:Math.round(eiwit), kh:Math.round(kh), vet:Math.round(vet), ok};
}
function macroHTML(r){
  const m=macros(r);
  return `<div class="macros"><div><b>${m.kcal}</b><span>kcal</span></div><div><b>${m.eiwit} g</b><span>eiwit</span></div><div><b>${m.kh} g</b><span>koolhydraten</span></div><div><b>${m.vet} g</b><span>vet</span></div></div>
    <p class="demo" style="text-align:left;margin-top:4px">Per portie, een schatting op basis van gemiddelde voedingswaarden${m.ok?'':' (niet alle ingrediënten meegeteld)'}. Olie en sauzes die je zelf toevoegt zijn niet meegeteld.</p>`;
}

/* ---------- receptkaart ---------- */
function fmtQty(amount, unit, k){
  let v = amount*k;
  if(unit==='g'||unit==='ml') v = v>=100 ? Math.round(v/25)*25 : Math.round(v/5)*5;
  else if(unit==='el'||unit==='plak') v = Math.max(1, Math.round(v));
  else v = Math.max(0.5, Math.round(v*2)/2);
  if(unit==='g' && v>=1000){ return (Math.round(v/100)/10).toString().replace('.',',')+' kg'; }
  const n = String(v).replace('.5','½').replace(/^0½$/,'½');
  const u = {st:'', teen: v>1?'tenen':'teen', blik: v>1?'blikken':'blik', blikje: v>1?'blikjes':'blikje', plak: v>1?'plakken':'plak', el:'el', g:'g', ml:'ml'}[unit] ?? unit;
  return `${n}${u?' '+u:''}`.replace('½ ',' ½ ').trim();
}
function openRecipe(rid){
  const r=RECIPES.find(x=>x.id===rid); if(!r) return;
  const persons = (st.plan&&st.plan.persons)||4, k=persons/4, sid=st.plan&&st.plan.sid;
  const ph=RECIPE_PHOTOS[rid];
  sheet(`${ph?`<div class="recipe-hero"><img src="${recipePhoto(rid)}" alt="${esc(r.name)}"><a class="credit" href="${esc(ph.u)}" target="_blank" rel="noopener">Foto: ${esc(ph.a)} · ${esc(ph.l)} · Wikimedia Commons</a></div>`:''}
    <div class="sheet-head"><div class="emoji">${r.emoji}</div><div><h3>${esc(r.name)}</h3><div class="meta">⏱ ${r.time} min · ${persons} personen${r.cheat?' · 🍔 cheatday':''}</div></div></div>
    <div class="tagrow">${r.tags.map(t=>`<span>${t}</span>`).join('')}</div>
    <h2 style="font-size:16px">Voedingswaarde per portie</h2>
    ${macroHTML(r)}
    <h2 style="font-size:16px">Ingrediënten</h2>
    <div class="list">${r.ing.map(([id,,amt,unit,label])=>{const p=P(id);return `<div class="item static" style="padding:8px 12px"${p?` data-open="${id}"`:''}>
      <div class="info"><div class="name" style="white-space:normal;font-weight:500"><b>${fmtQty(amt,unit,k)}</b> ${esc(label)}</div></div>
      ${p&&sid&&has(p,sid)?`<div class="price" style="font-size:12px;color:var(--muted)">${S(sid).name}</div>`:''}</div>`}).join('')}</div>
    <p class="demo" style="text-align:left">Verder nodig: olie, zout, peper en kruiden.</p>
    <h2 style="font-size:16px">Bereiding</h2>
    <ol class="steps">${r.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
    ${ph?'<p class="demo">Sfeerfoto; jouw gerecht kan er anders uitzien.</p>':''}`);
}

/* ---------- weekoverzicht ---------- */
function weekStats(w=WEEK){
  const b=buysWeek(w), saved=sumSaved(b);
  const [y,wn]=w.split('-W').map(Number);
  const pts=st.pointLog.filter(l=>l.d && isoWeek(new Date(l.d+'T12:00'))===w).reduce((t,l)=>t+l.n,0);
  const prevW=(()=>{ const d=new Date(); d.setDate(d.getDate()-7); return isoWeek(d); })();
  const prev=sumSaved(buysWeek(prevW));
  const goal=Math.max(10, Math.ceil((Math.max(saved,prev)*1.15+0.01)/5)*5);
  const best=[...b].sort((a,c)=>c.saved-a.saved)[0];
  return {w:wn,y,saved,deals:b.length,pts,streak:streak(),prev,goal,best};
}
function viewWeek(){
  const s=weekStats(), d=new Date(), mon=new Date(d); mon.setDate(d.getDate()-((d.getDay()+6)%7)); const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  return `<button class="back" data-act="back">‹ Terug</button>
    <h2>📊 Jouw week ${s.w}</h2><p class="hint">${mon.getDate()} ${MONTHS[mon.getMonth()]} t/m ${sun.getDate()} ${MONTHS[sun.getMonth()]}</p>
    <div class="hero"><div class="lbl">💰 Deze week</div><div class="amt">${euro(s.saved)}</div><span class="trend">bespaard${s.prev?` · vorige week ${euro(s.prev)}`:''}</span></div>
    <div class="stats">
      <div class="stat"><span class="ico">🛒</span><b>${s.deals}</b><span>aanbiedingen gebruikt</span></div>
      <div class="stat"><span class="ico">⭐</span><b>+${s.pts}</b><span>punten verdiend</span></div>
      <div class="stat"><span class="ico">🔥</span><b>${s.streak}</b><span>${s.streak===1?'week':'weken'} streak</span></div>
      <div class="stat"><span class="ico">🏆</span><b>${s.best?euro(s.best.saved):'–'}</b><span>${s.best?'beste deal: '+esc(s.best.name):'nog geen deal'}</span></div>
    </div>
    <div class="verdict">🎯 Volgende week ga jij voor <b>${euro(s.goal)}</b>!</div>
    <button class="btn green" data-act="share">📤 Deel op WhatsApp</button>
    <p class="demo">Daag je vrienden uit: deel je weekscore in de groepsapp. Een echte ranglijst met vrienden komt in een volgende versie.</p>`;
}
function weekImage(){
  const s=weekStats(), c=document.createElement('canvas'), W=1080, H=1350; c.width=W; c.height=H; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,W,H); grd.addColorStop(0,'#0f7b4f'); grd.addColorStop(1,'#0a4f33'); g.fillStyle=grd; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.06)'; g.font='800 900px "Bricolage Grotesque", Inter, sans-serif'; g.fillText('€',560,1280);
  const T=(t,x,y,size,w='700',col='#fff',al='left')=>{ g.font=`${w} ${size}px "Bricolage Grotesque", Inter, system-ui, sans-serif`; g.fillStyle=col; g.textAlign=al; g.fillText(t,x,y); };
  T('Save',80,140,72,'800'); g.font='800 72px "Bricolage Grotesque", Inter, sans-serif'; const sw=g.measureText('Save').width; T('rr',80+sw,140,72,'800','#9ff0c4');
  T(`Week ${s.w}`,W-80,140,44,'600','rgba(255,255,255,.8)','right');
  T('💰 Deze week bespaard',80,330,46,'600','rgba(255,255,255,.85)');
  T(euro(s.saved),80,500,190,'800');
  const rows=[['🛒',`${s.deals} aanbiedingen gebruikt`],['⭐',`+${s.pts} punten`],['🔥',`${s.streak} ${s.streak===1?'week':'weken'} streak`]];
  rows.forEach((r,i)=>{ g.fillStyle='rgba(255,255,255,.12)'; roundRect(g,80,600+i*130,W-160,104,28); g.fill(); T(r[0],120,670+i*130,50,'400'); T(r[1],200,670+i*130,48,'700'); });
  g.fillStyle='#9ff0c4'; roundRect(g,80,1010,W-160,130,32); g.fill();
  T(`Volgende week ga ik voor ${euro(s.goal)}! 🎯`,W/2,1092,48,'800','#0a4f33','center');
  T('Bespaar mee met Saverr · rickosas.github.io/Saverr',W/2,1250,34,'500','rgba(255,255,255,.75)','center');
  return c;
}
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
async function shareWeek(){
  const s=weekStats(), url='https://rickosas.github.io/Saverr/';
  const text=`💰 Deze week heb ik ${euro(s.saved)} bespaard op mijn boodschappen met Saverr! 🛒 ${s.deals} aanbiedingen · 🔥 ${s.streak} weken streak. Volgende week ga ik voor ${euro(s.goal)}. Kun jij dat verslaan? ${url}`;
  try{
    await document.fonts.ready;
    const blob=await new Promise(r=>weekImage().toBlob(r,'image/png'));
    const file=new File([blob],`saverr-week-${s.w}.png`,{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file],text}); return; }
    if(navigator.share){ await navigator.share({text,url}); return; }
  }catch(e){ if(e && e.name==='AbortError') return; }
  location.href='https://wa.me/?text='+encodeURIComponent(text);
}
