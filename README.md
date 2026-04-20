📊 Projectplan — AutoDash
 
🚗 Projectomschrijving:
 
AutoDash is een moderne webapplicatie gebouwd met React, gericht op motorsport- en autoliefhebbers. De applicatie combineert Formule 1-data, live weersinformatie, voertuigspecificaties en een persoonlijke karttracker in één overzichtelijk dashboard.
 
Het doel is om gebruikers één centrale plek te bieden voor alle relevante informatie rondom racing en voertuigen.
 
 
 
🎯 Doelgroep
 
Motorsportfans (vooral Formule 1) 
Kartliefhebbers 
Autoliefhebbers 
Gebruikers die een overzichtelijke dashboardervaring willen 
 
 
⚙️ Functionaliteiten (Feature List)
 
Feature 1: Navigatie & Layout
 
Beschrijving:
De basisstructuur van de applicatie met navigatie tussen alle pagina’s.
 
Acceptatiecriteria:
Header bevat logo en navigatielinks 
Alle pagina’s zijn bereikbaar via navigatie 
Sidebar menu met logo er boven en in klapbaar
Footer bevat projectnaam en GitHub link 
  
 
Feature 2: Home Dashboard
 
Beschrijving:
Een overzichtspagina met visuele en snelle informatie voor de gebruiker.
 
Acceptatiecriteria:
Welkomstbanner toont motorsport afbeelding via Unsplash API 
Dashboard bevat statistieken kaarten 
Data wordt correct geladen en weergegeven 
 
 
Feature 3: F1 Racekalender
 
Beschrijving:
Toont alle races van het huidige Formule 1 seizoen.
 
Acceptatiecriteria:
Lijst met races wordt opgehaald via OpenF1 API 
Elke race toont naam, datum, circuit en land 
Landenvlag wordt correct weergegeven via REST Countries API 
 
 
Feature 4: Coureurs Standen
 
Beschrijving:
Toont de top 10 coureurs in het kampioenschap.
 
Acceptatiecriteria:
Top 10 lijst wordt geladen via OpenF1 API 
Nationaliteitsvlag wordt per coureur getoond 
 
 
Feature 5: Circuit Weer
 
Beschrijving:
Geeft weersinformatie voor geselecteerde circuits.
 
Acceptatiecriteria:
Dropdown bevat lijst met circuits 
Weerdata wordt opgehaald via Open-Meteo API 
7-daagse forecast wordt weergegeven 
Temperatuur, neerslag en wind zijn zichtbaar 
 
 
Feature 6: Voertuig Zoeker
 
Beschrijving:
Zoekfunctie voor voertuigspecificaties.
 
Acceptatiecriteria:
Gebruiker kan zoeken op merk en model 
Resultaten worden weergegeven in tabel 
Data komt van NHTSA API 
(Bonus) VIN-decoder werkt correct 
 
 
Feature 7: Mijn Karttijden Tracker
 
Beschrijving:
Gebruikers kunnen hun karttijden invoeren en analyseren.
 
Acceptatiecriteria:
Formulier accepteert track naam, datum, ronde tijd en kart type 
Data wordt opgeslagen in localStorage 
Tijden blijven bewaard na refresh 
Tabel toont alle tijden gesorteerd op beste tijd 
Statistieken tonen beste tijd en gemiddelde 
Verbetering wordt berekend en weergegeven 
 
 
Feature 8: Error & Loading States
 
Beschrijving:
Zorgt voor feedback tijdens data ophalen en fouten.

Acceptatiecriteria:
Loading indicator zichtbaar tijdens API calls 
Foutmelding verschijnt bij mislukte API request 
App crasht niet bij fouten 
 
 
🛠️ Gebruikte technologieën

React 
Tailwind CSS 
Cursor IDE 
APIs: 
OpenF1 API 
Open-Meteo API 
NHTSA API 
REST Countries API 
Unsplash API 
Git/GitHub 
ClickUp 
 
⚠️ Risico’s
 
API’s werken niet of zijn traag → fallback of andere API 
Tijdgebrek → focus op core features 
Complexe features → eerst simpele versie bouwen 
Bugs → testen en debuggen 
 
 
✅ Definition of Done

Alle features werken volgens acceptatiecriteria 
Geen kritieke bugs 
UI is responsive en netjes 
API’s werken correct 
Code is overzichtelijk 
Project is gedeeld via GitHub of live demo
