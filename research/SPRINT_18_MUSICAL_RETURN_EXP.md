# Sprint 18 — Musical Return Reactor
## Quattro esperimenti comparativi del Design Team: M0, M1, M2 e Photon Return

**Data:** 28 ottobre 2026  
**Branch:** experiments/sprint18-musical-return-reactor, derivato da research/session17-musical-carriers-and-return.  
**Percorso:** \`?experiment=musical-return\` (pubblicato solo dopo CI e Pages riusciti).  
**Natura:** esperimento meccanico-visivo-sonoro isolato; non è ancora il gioco definitivo, né ottica fisica, né prova con utenti esterni.

## Mandato e sette prospettive simulate
**Architetto del Puzzle:** rendere causalmente leggibili le deviazioni; ogni previsione verificabile.  
**Progettista di Sistemi Emergenti:** ottenere percorsi, biforcazioni future e mutazioni che cambiano la macchina durante il funzionamento; mantenere separate eventuali dinamiche fluide.  
**Genetista:** distinzione fra individui fissi con ID permanenti e viaggiatori effimeri, DNA mutabile; preservare 72 identità potenziali.  
**Psicologo del Giocatore:** nessun input a tempo; controlli replay/passo, competenza e sorpresa; interesse di una macchina auto-costruita.  
**Fisico-Matematico:** fonte finita, dissipazione, ledger chiuso, stesso stato iniziale -> stesso esito; non spacciare geometria proxy per riflessione.  
**Ludologo:** confronto con Lemmings, Loop Hero, Opus Magnum, Rytmos e Reactable; isolare il valore dell'attore mobile rispetto al raggio.  
**Compositore di Sistemi Musicali:** audio come funzione dei medesimi eventi di simulazione, riproducibile, musicalmente significativo, senza obbligo di suonare a tempo.

Questi sette ruoli sono **prospettive critiche simulate dall'assistente**; non sette agenti/professionisti indipendenti. Nelle risposte all'autore, usare sempre i titoli dei ruoli per esteso.

## Impianto implementato
Tre individui stabili con ID P01–P03 e nomi generati mediante il metodo di fusione sillabica recuperato da MindeleevSpatial/PolytronName.cs (prime tre coppie originali). Ogni individuo ha un DNA Conway e occupa una cella delle 19, centro Architron escluso. L'utente seleziona la stazione, la ricolloca senza orientarla in-place e cambia il fenotipo iniziale. Il motore calcola realmente la mesh tramite \`measurePoly\` (Polyhedronisme).

L'Architron emette due o tre portatori a partire da un unico budget iniziale di 12 ENERGY nella **simulazione di prova**: massimo 3 ENERGY per portatore. E(2,8) oppure E(3,8) determina il calendario discreto di emissione, non il profitto. Il motore genera un log ordinato di eventi \`emit/travel/encounter/mutate/return/escape\` e fotogrammi ricostruibili.

Gli individui fissi sono persistenti *durante il run*, ma i cambiamenti dovuti alle collisioni NON committano al roster del gioco: premendo replay si riparte dai medesimi genotipi. I portatori sono soltanto entità effimere e non consumano slot dai 72 individui.

**Regola di orientamento:** nessun Polytrone può essere ruotato manualmente. Lo stato visuale è in orientamento canonico. Gli eventi dei raggi Photon si propagano con direzione continua in XY; i portatori M0/M1/M2 muovono secondo le sei direzioni discrete della griglia.

**Regola fisico-ludica del routing, esplicitamente provvisoria:** analizzare la mesh di ciascuna stazione; determinare il numero di lati più frequente tra le facce; associare tale numero a una svolta discreta di 60°, 120° o 180° con \`clamp(modoLati−2,1,3)\`. È geometria → comportamento, NON token di Conway → superpotere, ma è una mappatura **inventata**, non derivata da legge ottica o dallo Shape-DNA. Due forme che hanno la stessa faccia dominante possono risultare ancora funzionalmente equivalenti: il prototipo deve evidenziare anche questo limite.

**Bilancio di un turno:**
- Portatore riceve \`injection\` dal wallet simulato; ogni passo costa al massimo 0.16.
- Una stazione può trasferire al massimo 1.05 per passaggio da una **riserva iniziale di 2.10**, che diminuisce. Un portatore può tornare o uscire dal bordo, con l'energia residua.
- \`input + energiaPrelevata = ritorno + uscita + dissipazione + volo\`. Il controllo dell'identità viene eseguito **a ogni frame** con errore numerico < 1e−6.
- Il wallet simulato sarebbe \`12 − input + ritorno\`. Le riserve vengono resettate a ogni replay: non è un sistema economico persistente, quindi **non si può farmare ENERGY** continuando a cliccare replay.
- La lunghezza del percorso da sola **consuma** energia. Un viaggio più lungo può ripagarsi soltanto intercettando sorgenti finite.

## M0 — Ritorna al centro
Nessun DNA muta. Un viaggiatore temporaneo percorre esagoni a partire dal centro e può essere guidato dalle stazioni verso l'Architron o perduto sul bordo. La configurazione preset due cubi forma una semplice rotta triangolare che torna al centro. Controllo: disponendo male una delle stazioni, il percorso esce.

**Gate da osservare manualmente:** il giocatore capisce *perché* il viaggiatore ha svolto senza aprire un manuale? Quanta previsione serve? Il meccanismo delle "facce prevalenti" è abbastanza leggibile?

## M1 — Ricombina e muta
Al primo incontro con una stazione non ancora mutata, il viaggiatore riceve un operatore \`a\` in testa al proprio DNA, e la stazione subisce \`a\` (es. C → aC). La **svolta del primo evento** usa la forma pre-mutazione; il secondo viaggiatore può incontrare la forma modificata e prendere una direzione diversa. Reazione deterministica e limitata a una volta per stazione per scarica: **non** una legge di fusione/fissione biologica definitiva; lo studio delle mutazioni locali resta aperto.

**Gate:** la prima particella cambia la storia del campo in modo che la seconda abbia davvero un percorso diverso? Il feedback mostra chiaramente il DNA prima/dopo?

## M2 — Musical Return
Motore logico **identico** a M1; la traccia di eventi genera toni originali WebAudio. Non esistono file audio di musica non concessa o loop precomposti. Emissione: impulso grave; incontro: altezza ricavata da descrittori geometrici; metamorfosi: piccola struttura accordale; ritorno: risoluzione con tre intervalli; fuga: registro grave. Il sistema è un **segnaposto musicale deterministico**: non è ancora Tonnetz, e non si deve giudicare come prodotto sonoro definitivo.

**Tempo tripartito:** logica discreta indipendente dal frame rate, replay visivo/passo configurabile, presentazione audio sincronizzata agli eventi (non obbligo di riflessi). L'utente può disattivare e attivare l'audio per comparare.

**Gate:** un ascoltatore riconosce la differenza fra due configurazioni senza vedere il loro tracciato? Il "ritorno" è percepibile come risoluzione, non un effetto di vittoria appiccicato?

## Photon Return — controllo alternativo
Stessa configurazione e stesso ledger ma fasci continui anziché viaggiatori di esagoni; ogni raggio incontra dischi d'influenza centrati nei Polytroni e viene deviato secondo la *stessa funzione geometrica proxy*, con propagazione di segmenti nel piano XY e decadimento proporzionale alla lunghezza. Nessun DNA mobile né mutazione. I dischi NON sono l'intersezione fisica con le facce tridimensionali e la legge non rappresenta la reale ottica: è un controllo per isolare il valore del viaggio geneticamente trasformativo.

**Gate:** quale motore genera percorsi più ricchi, comprensibili e sorprendenti rispetto alle decisioni disponibili? Non dichiarare un vincitore sulla sola efficienza del preset.

## Test automatici
\`scripts/check-musical-return.mjs\` esegue:
- stati iniziali stabili per i tre individui; reset non altera sorgente;
- pattern euclidei E(2,8), E(3,8);
- svolte C, T e aC realmente derivate da geometria;
- M0 ritorno al centro senza mutare;
- M1 mutazioni e successivo incontro con una stazione già mutata;
- M1 e M2 **identici** in tutti gli eventi e frame;
- Photon senza DNA mutato, traiettorie continue;
- conservazione energetica per 4 modalità × 2 sequenze di emissione; fonte disponibile/portafoglio limitati;
- input illegale (troppe ENERGY e due stazioni sulla stessa cella) rifiutato.
Ulteriori regressioni dello Sprint 09, Shape-DNA, Fenotipo e Phenotype Atlas sono parte della CI.

## Limiti deliberati e prossime decisioni del Design Team
1. Routing da "numero prevalente di lati" è un'ipotesi illustrativa: non misura Shape-DNA, angoli diedri reali o il kernel di scattering avanzato richiesto dalla Sessione 14.
2. Le reazioni \`a\` sono imposte per il test differenziale e **non** sono ancora le regole definitive di fusione/fissione del gioco.
3. Le tre stazioni hanno riserve finite sempre identiche, non ancora derivate da funzioni intrinseche di potenziale U(P). La coesistenza **batteria+convertitore** resta un vincolo da testare con un ledger più ricco.
4. L'audio è generativo ma elementare, non ancora un sistema Tonnetz, NodeBeat o sequencer euclideo compositivamente approfondito. E(k,n) per ora scandisce **emissioni**.
5. La griglia di 19 celle può essere troppo piccola per percorsi interessanti; prima misurare la densità di ritorni e ramificazioni nei preset.
6. Nessuna pressione in tempo reale: il modello è deterministico e il giocatore può esaminare tutti i passi.
7. I test CI verificano logica, matematica, typecheck e build/deploy; **non** costituiscono playtest visivi umani o audio ascoltato dal browser.
8. Prossima sessione: giudizio del **Ludologo**, **Compositore di Sistemi Musicali** e **Progettista di Sistemi Emergenti** basato sul confronto reale M0/M1/M2/Photon; annotare casi in cui mutazione e note rendono il puzzle illeggibile. Chiudere il loop con una vera interazione geometrica derivata da Shape-DNA o da un campo direzionale e testare conversione/batteria.

## Esecuzione
\`https://babeledunnit.github.io/MindeleevBolt01/?experiment=musical-return\`

Per le relazioni tra giochi e musica, vedere \`research/SESSIONE_17_MUTATRON_MUSICA_E_RITORNO.md\`. Il protocollo vincola la citazione dei sette esperti **per esteso**.
