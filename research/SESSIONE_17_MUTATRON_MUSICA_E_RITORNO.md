# MINDELEEV — Sessione 17: Architron, Polytroni viaggiatori e reattore musicale
## Nuovo confronto del Design Team: audio strutturale, ritorno al centro, percorsi trasformativi e Black Box/Lemmings

**Data:** 27 ottobre 2026 — discussione, nessun nuovo motore di gioco implementato.  
**Branch:** \`research/session17-musical-carriers-and-return\`, derivato dalla Sessione 16.  
**Metodologia:** sette prospettive **simulate** da ChatGPT; non professionisti esterni, non sette agenti autonomi. ChatGPT fa da portavoce e riporta dissensi.  
**Novità:** introduce la competenza **MS, Compositore di Sistemi Musicali** come settimo ruolo, insieme a PA (Puzzle), SE (Emergenza), GC (Genetista), PG (Psicologia), FE (Fisico), LU (Ludologo).

## 0. Input dell'autore e vincoli da non perdere

L'autore è **musicista**, affascinato da strumenti e modelli di generazione musicale: **sequencer euclidei**, **NodeBeat**, **Reactable** usato dal vivo con Björk, **Rytmos**. La musica in Mindeleev **deve essere gameplay e composizione generativa, non colonna sonora**.

Due nuove ipotesi:
1. **Architron come emettitore e collettore**. All'avvio di un ciclo il centro investe una quota massima e finita di ENERGY. Un flusso deve attraversare il Mutatron e **ritornare all'Architron**, non perdersi oltre i bordi. Giri lunghi e trasformazioni possono diventare profittevoli, ma solo se intercettano riserve finite.
2. **Polytroni viaggiatori (“Lemmings genetici”)**. Dal centro partono entità semplici che camminano sul reticolo; gli individui stabili (massimo 72 nominati) sono disposti sul board. I viaggiatori hanno DNA compatibile con Conway, possono ricombinarsi e provocare mutazioni nei fissi, modificando le loro future risposte; il cammino può biforcarsi, cambiare, tornare al centro o uscire dal campo.

Rispetto alle Sessioni 11–16: corpi fissi non ruotabili in-place, fasci opzionali in piano continuo; sintesi per fusione/fissione; Species (fenotipo) vs Recipe (DNA) vs Individual (72 identità); Shape-DNA e geometria esplicita come fonte di proprietà; una sola valuta wallet ENERGY; fluidità realtime senza riflessi, preferenza per simmetrie e caleidoscopio come comportamento causale.

## 1. Bibliografia meccanica del Ludologo e musicale del nuovo MS

### Reactable — la fonte del riferimento a Björk
- Nome verificato: **Reactable** (spesso scritto reacTable).
- Sviluppato all'Università Pompeu Fabra; impiegato con Björk nei tour Volta e Biophilia. Lo strumento usa oggetti tangibili sul tavolo, collegamenti audiovisivi e sintesi modulare. Nel Reactable originale si possono *anche ruotare* gli oggetti: questa componente NON va importata, perché l'autore non vuole ruotare Polytroni in-place.
- Da riutilizzare: **posizione relativa e prossimità sono sintassi sonora**, gli stessi collegamenti sono ascoltabili e visibili.
- Fonti: https://reactable.com/about-us/ ; https://reactable.com/experience/ ; https://www.upf.edu/web/mtg/news/-/asset_publisher/WM181VyAQipW/content/icelandic-singer-bjork-incorporates-the-reactable-as-a-key-instrument-of-her-volta-world-to-1/maximized

### NodeBeat — moto e distanza come partitura
- Generatori e note sono due tipi di nodi; i generatori pulsano e attivano le note vicine, ordinate anche in base alla loro distanza. Le note possono muoversi liberamente o restare fisse.
- Adattamento: **infrastruttura musicale del doppio stato** — i fissi determinano una relazione, i viaggiatori generano e spostano eventi in essa. Lo stato fluido può modificare anche la partitura, indipendentemente dal risultato energetico.
- Fonte primaria: https://www.nodebeat.com/?lang=en

### Ritmi euclidei — distribuzione e controllo del tempo logico
- E(k,n): k impulsi disposti quanto più uniformemente possibile fra n passi. Può scandire un numero finito di emissioni da Architron su un ciclo logico, **non** imporre al giocatore di premere a tempo e NON autorizzare energia extra quando il pattern è più “bello”.
- Matematica di Godfried Toussaint (2005): https://www.archive.bridgesmathart.org/2005/bridges2005-47.html
- Sequenze Bjorklund, uno stimolo da ricordare: per esempio E(3,8), **non** un prerequisito musicale per chi gioca.

### Rytmos — il giocatore compone risolvendo
- Puzzle di percorsi che, risolti in modi differenti, producono sequenze musicali e stratificano composizioni; gli sviluppatori dichiarano esplicitamente di voler fare *creare* musica invece che limitarsi a reagire alla musica.
- Fonti: https://floppy.club/Rytmos e https://developer.apple.com/news/?id=34m9vbvv
- Adattamento: forma del cammino, eventi di transito e ritorno producono un loop realmente distinto; ascolto come feedback e risultato artistico.

### Lemmings — intervenire sulle condizioni del cammino
- Lemmings percorrono il mondo autonomamente; blocker e altri comandi mutano le possibilità di movimento. L'adattamento NON richiede di assegnare abilità a unità in corsa e non deve essere un gioco di riflessi.
- Fonte (implementazione corrente): https://exient.helpshift.com/hc/en/3-lemmings/faq/12-what-are-instructions/
- Adattamento: il giocatore prepara il campo e osserva il sistema rispondere, poi corregge la configurazione fra i cicli.

### Loop Hero — precedente nuovo, particolarmente pertinente
- Il protagonista percorre autonomamente una rotta; il giocatore piazza tessere ambientali che determinano ciò che viene incontrato. Il giocatore non pilota ogni passo del personaggio.
- Fonti: https://store.steampowered.com/app/1282730/Official?l=english ; https://www.gamespot.com/reviews/loop-hero-review/1900-6417656/
- Trasposizione: nel Mutatron il **viaggiatore** percorre un cammino autonomo; il giocatore manipola le condizioni dei suoi incontri. Differenza sostanziale: **il viaggiatore può trasformare i Polytroni fissi**, che a loro volta mutano il percorso dei successivi. Non copiare combattimento, carte e timer.

### The Last Clockwinder — clockwork cooperativo
- Loop di automatismi con cloni registrati, disposti come una coreografia. Serve per capire il piacere di vedere una *configurazione vivente* funzionare.
- Fonte: https://cyan.com/docs/what-is-the-last-clockwinder/
- NON trasformare i 72 individui in robot programmati separatamente.

### Tonnetz
- P/L/R sono trasformazioni di accordi nella teoria neo-riemanniana; mappa geometrica fra triadi, non isomorfismo dimostrato con gli operatori Conway.
- Fonte: https://pressbooks.nebraska.edu/openmusictheory/chapter/neo-riemannian-triadic-progressions/
- Ricerca futura: trasformazioni del viaggiatore come trasformazioni *musicali controllate*, non mapping automatico “a = nota A”.

---

## 2. Round 1 — Responsabilità musicale: audio ornamentale o gioco udibile?

**MS:** «La simulazione dovrebbe produrre una lista ordinata e riproducibile di eventi. Da lì discendono visual, audio e metriche di energia. Se cambiare una ricetta modifica il campo ma NON cambia ciò che sento, abbiamo aggiunto solo un tappeto sonoro».  
**LU:** «Rytmos prova che si può creare musica risolvendo. NodeBeat dimostra che relazioni spaziali e movimento possono già funzionare come composizione».  
**PA:** «Mai associare l'esito al riflesso su un beat. Pianifico, innesco, ascolto, eventualmente metto in pausa, rallento o rieseguo».  
**FE:** «Tempo musicale e tempo logico della simulazione non sono la stessa cosa; l'audio deve poter essere ricostruito dallo stato senza dipendere da frame rate, latenze audio o velocità del dispositivo».  
**SE:** «La fluidità non deve solo muovere un suono nello stereo; potrebbe deformare la topologia musicale delle interazioni, come in NodeBeat».  
**GC:** «Una specie può avere identità timbrica fenomenica coerente con la forma, ma non trasformare il DNA in una tavola fissa di note».  
**PG:** «Anche una configurazione poco produttiva potrebbe risultare musicalmente bella. Conserviamo il piacere di ascoltare il proprio errore e migliorarlo».

**Verdetto:** musica **first-class da subito** con *event ledger* comune. Aggiunta di MS come settimo ruolo. Non serve implementare ora tonnetz armonico completo o sequencer da DAW.

### Architettura proposta per il suono (non implementata)
\`SimulationEvent = {step, kind, individualId?, carrierId?, cell?, incomingDNA?, outgoingDNA?, energyBefore, energyAfter, mode?}\`
Tipi evento: \`emit\`, \`step\`, \`encounter\`, \`mutate\`, \`split\`, \`absorb\`, \`return\`, \`escape\`.
- **Sequencing:** dalla data logica \`step\` a un on-set musicale con quantizzazione controllata, **senza influenzare** la fisica.
- **Timbro:** derivato da descriptor fenotipici o poche proprietà geometriche quantizzate (ipotesi).
- **Altezza/harmonia:** nel secondo test, da mappa formalizzata; opzioni Tonnetz o intervalli strutturali; non arbitraria codifica di lettere.
- **Ritmo:** percorsi, frequenza incontri, eventuale emissione E(k,n) a budget finito.
- **Arrangiamento:** più viaggiatori che ritornano con periodi differenti generano poliritmia; emergenza di cicli e allineamenti.
- **Diagnosi sonora:** ritorno, fuga e dispersione riconoscibili senza guardare; musica non deve però sostituire lettura visiva/accessibilità.
- **Export:** in futuro sequenze MIDI/eventi, traccia audio e replay visivo; non serve nel micro-test.

**Domanda di verifica MS:** lo stesso percorso produce uno stesso fraseggio su diversi computer e a diverse velocità di playback? Un ascoltatore riconosce un ritorno/uscita senza guardare?

---

## 3. Round 2 — Tre architetture concorrenti

### A — Raggi energetici (Sessione 16)
Architron emette fasci continui, deviazioni/rifrazioni/interferenze derivate da geometrie 3D; grande compatibilità con piano 2D continuo e caleidoscopio, Black Box. **Difetto:** DNA dei viaggiatori e fusione/fissione rischiano di essere accessori.

### B — Polytroni viaggiatori (preferenza LU/GC/MS)
Architron emette **portatori temporanei dotati di DNA Conway**; il campo di individui permanenti riscrive il DNA, il cammino, l'energia e talvolta la ricetta degli individui fissi. Posizioni fisse sul reticolo hex, spostamenti autonomi di portatori lungo esagoni/su grafo di celle. Condizioni locali **deterministiche e osservabili**. Compito: farli **tornare all'Architron** per ricondurre ENERGY spendibile. Ogni incontro genera un evento musicale.
- Pregi: genotipo, fenotipo, geometria, movimentazione, sequenza musicale e puzzle convergono.
- Rischi: trasformazioni in cascata incomprensibili, board con 19 celle troppo stretto, riduzione della fluidità a mera pausa/preview.

### C — Ibrido portatori + campi/raggi
Ogni viaggiatore è DNA e materia informativa, e può emettere un fascio continuo che risponde ai campi geometrici. **Entusiasmante ma rischiosissimo** come MVP: due leggi di propagazione, due sistemi di collisione, energia, DNA, loop musicali. Il Team lo parcheggia finché non sappiamo se B è leggibile.

**Dissensi:** FE non è persuaso dal “DNA trasmesso” e vuole distinguere carrier come particella fisica vs dato genetico astratto. SE è contrario ad abbandonare la dinamica continua per cammino a passi esagonali; potrebbe quindi preferire A o C. LU insiste che B ha un obiettivo immediato simile a Lemmings ma più versatile geneticamente. MS preferisce B perché il viaggio è una partitura temporalmente riproducibile senza dover introdurre subito interferenza/fase.

**Conclusione testabile:** prototipare B come *una sonda differenziale* rispetto ad A, non come svolta definitiva. I raggi continui restano nel background matematico e potranno integrarsi dopo.

---

## 4. Round 3 — Gli individui e le particelle non sono la stessa cosa

**Individui fissi (max 72 globali):** \`Individual{id,name,dna,speciesId,position,storedPotential}\`. Persistono, cambiano genotipo e fenotipo, portano storia. Nessun individuo nuovo viene creato banalmente dalla collisione.
**Portatori viaggiatori (illimitati fra episodi, LIMITATI PER SCARICA):** \`Carrier{ephemeralId,dna,position,heading,energy,hopsLeft,history}\`. Hanno DNA compatibile con la grammatica, ma NON un sigillo dei 72, nome personale o capacità implicita di essere clonati all'infinito.

Il numero **cumulativo** di particelle nel corso della storia può essere arbitrariamente grande, ma ogni ciclo inietta una quantità **finita** di energia, quindi:
- massimo numero di emissioni/carrier per scarica,
- massimo numero di split/clone per trasformazione,
- somma delle energie dei figli non superiore a quella del genitore + contributi registrati da una fonte,
- durata massima o condizione di assorbimento per evitare loop computazionali illimitati,
- nessun claim “crea materia gratis”. Le particelle si possono interpretare come *pacchetti di campo con stato genetico* anziché Polytroni-individuo completi.

### La collisione bidirezionale proposta
\[
\Phi(\underbrace{P_i,\ U_i}_{\mathrm{fisso}},\underbrace{c_j,\varepsilon_j,d_j}_{\mathrm{viaggiatore}},R)
\longrightarrow
(P'_i,U'_i,c'_j,\varepsilon'_j,d'_j,\mathrm{rami},R',Q').
\]
- DNA prima/dopo e geometria P_i/P_i' sono legati tramite la funzione costruttiva Conway reale; niente “k ha il potere di riflettere” senza connessione al fenotipo.
- **Una sola classe di reazione iniziale**, con risultato comprensibile; mutazione permanente del fisso solo dopo validazione. Niente fusione/fissione stocastica nella prima prova.
- Il cambio di P_i in corsa può ridisegnare il campo e trasformare il percorso dei successivi: questa è l'ipotesi fondamentale di **macchina che evolve durante l'esecuzione**.

**Obiezione GC:** un esperimento che modifica in modo permanente un individuo può rovinare il roster di 72. In modalità simulazione i cambi sono **provvisori** e si possono azzerare; nessun “commit biologico” involontario prima di definire il costo e il recupero.

---

## 5. Round 4 — Il falso paradosso del percorso lungo

Proposta dell'autore: più cammino e trasformazioni prima del ritorno possono generare più ENERGY.

**FE:** «No, non come formula diretta E_out = E_in × distanza. Questo permette di pedalare gratis e creare denaro con un percorso infinito». Un limite massimo di ENERGY per singolo turno **non** impedisce di ripetere un ciclo con guadagno se tutto torna allo stato iniziale.

**LU:** «Il percorso lungo deve essere una decisione con rischio/beneficio: più incontri con *riserve* o *fonti*, ma anche dissipazioni e la probabilità strutturale di perdere il ritorno». 
**PA:** «Chiude il percorso e ottieni un utile? Fai in modo che la domanda sia *quali incontri valgono la perdita energetica*; non *come faccio fare cento passi al carrier*». 
**GC:** «Anche la scarica di una batteria polytronica può offrire energia, ma cambia la forma e ne riduce il potenziale».
**MS:** «Un giro più lungo produce una frase musicale più ricca o un contrappunto, anche se energeticamente non ottimale. NON convertire direttamente note/bellezza in ENERGY». 
**PG:** «Il giocatore può perseguire anche un obiettivo estetico autonomo, non necessariamente il massimo rendimento».
**SE:** «I cicli lunghi possono essere spettacolarmente belli; non scoraggiare ogni complessità con dissipazioni punitive enormi, ma conserva la legge del bilancio».

### Ledger invarianti per scarica
\[
E_{\mathrm{in}}+\Delta R+\Delta U =
E_{\mathrm{ritorno}}+E_{\mathrm{uscita}}+E_{\mathrm{dissipato}}+\Delta E_{\mathrm{immagazzinata\ in\ volo}}.
\]
Il wallet ENERGY paga l'iniezione e riacquista \`E_ritorno\`, le altre riserve sono variabili fisiche non spendibili direttamente. Ogni rilevazione/raccolta \(\Delta R\) sottrae una fonte ambientale **finita**; ogni scarica \(\Delta U\) diminuisce il potenziale interno. Non ricompensare ogni nuovo passaggio sullo **stesso generatore scarico**. In prova di test, ripetendo l'identico cammino dopo esaurimento fonti, il risultato netto non può essere positivo.

**Esempio illustrativo:** wallet paga 3; nel cammino recupera fino a 5 da un campo esterno, 2 da un Polytrone-batteria; dissipa/perde 3; Architron riceve 7: netto wallet +4, ma l'ambiente e la batteria hanno perso 7 ENERGY. Non è energia creata. Le unità in volo non sono una seconda valuta.

**Termine narrativo possibile:** *circuito chiuso*, *resonance run*, *metamorph circuit*; non scegliere ora un nome per le particelle.

---

## 6. Round 5 — Il rapporto con il caleidoscopio

**SE:** «Un loop di Lemmings graficamente esagonali può diventare un maze, non un caleidoscopio. Vogliamo evoluzione di scie, simmetrie, sfasamenti, biforcazioni e rientri».  
**LU:** «La dimensione estetica può venire dalla *stessa coreografia* che è una soluzione — Opus Magnum — purché non si piazzino torrette con orientamento regolabile».  
**MS:** «Più carrier con cammini differenziati possono creare **poliritmie**: simmetrie spaziali non implicano automaticamente identici tempi; il disegno e la musica possono crescere insieme».  
**FE:** «La propagazione su grafo hex ha D6 e non riproduce tutte le simmetrie 3D dei cinque semi; i cammini delle particelle possono essere discreti mentre un futuro campo/corona aurea è continuo, derivato dagli stessi incontri».  
**PG:** «Il giocatore deve poter collegare ciò che vede e sente ai gesti compiuti prima. Una sorpresa completamente non spiegabile è solo rumore».  
**GC:** «La metamorfosi di un individuo fisso deve comparire come riorganizzazione reale della mesh 3D, non solo cambio di sprite, e alterare gli incontri successivi».

**Criterio di successo:** due disposizioni differenti devono generare due **tracce riconoscibilmente differenti** (grafica+sonora), oltre a diversi bilanci energetici. La stessa disposizione e lo stesso RNG seed/logical timing generano un replay identico. Nessun bonus per C6: la simmetria è una proprietà dei risultati, non una legge che crea ENERGY.

---

## 7. Round 6 — Il tempo musicale e il tempo del gioco

L'autore non vuole riflessi e apprezza il realtime fluido. MS/PA/FE propongono di separare:
- **tempo logico**: passi discreti del simulatore, totalmente riproducibili; movimento, incontri, DNA, dissipazione;
- **tempo visivo**: interpolazione fluida fra passi, velocità configurabile, possibilità di pausa/replay e viste 2D/3D;
- **tempo musicale**: eventi quantizzati o legati a BPM stabili; l'utente può cambiare playback senza alterare chi raccoglie ENERGY.

E(3,8) può significare *tre emissioni autorizzate fra otto intervalli logici*: le emissioni usano ciascuna un input budget definito, non generano denaro gratis. I ritorni possono creare cadenzamenti e «risoluzioni» musicali; le fughe possono lasciare frasi in sospeso, ma evitare obbligo che “musica consonante=buona economia”.

**Test AUDIO OFF/ON:** ascoltando solo il log trasformato in musica, qualcuno sa capire se un circuito è completo o perde molti carrier? Non pretendere che ogni melodia debba essere gradevole in senso tonale: diversi estetiche possibili. Testare due configurazioni con stesse risorse e resa ma frasi diverse.

---

## 8. Tre micro-esperimenti (non tre giochi completi)

### M0 — Ritorna al centro
Board 19 celle, Architron al centro, 3 Polytroni fissi con pose canoniche, uno/due viaggiatori iniziali (DNA semplicissimo), nessuna mutazione dei fissi.
- Emit 2 o 3 carriers, autonomia discreta lungo celle hex, interazioni leggibili in preview, collisioni deterministiche, durata max ~15 passi.
- Obiettivo **naturale**: recuperare energia all'Architron invece di perdere il portatore sul bordo.
- Un carrier fa una strada breve che torna; un'altra configurazione fa un giro più ricco ma rischia di uscire.
- Due visualizzazioni: traiettoria + event timeline con piccoli tick sonori (non imporre un linguaggio armonico completo).
- **Gate:** il giocatore comprende perché il carrier cambia rotta dopo un incontro senza guardare una matrice di numeri.

### M1 — Ricombina e muta
Stesso campo, permetti a un solo Polytrone fisso di modificarsi in seguito a un incontro con un viaggiatore, mediante una legge di ricombinazione chiara, invariante DNA→mesh.
- Un primo carrier cambia il fisso; un secondo carrier, passando più tardi, prende **un percorso diverso**.
- Può nascere un circuito che ritorna al centro solo in presenza della mutazione intermedia.
- Preview prima e dopo; roster permanente non viene toccato finché non è dichiaratamente eseguito il commit.
- **Gate:** una mutazione reale è **necessaria** per un risultato che non si ottiene col solo spostamento delle torri.

### M2 — Musical Return
Stesso caso M1; gli eventi producono suono: 2–3 timbri, struttura ritmica dai tick/incontri e ritorni, nessuna tonalità prescritta, eventualmente un solo generator E(k,n).
- Stesso replay = stessa partitura;
- due configurazioni diverse = differenza sonora intelligibile;
- tracce grafiche e musicale causate dagli stessi eventi;
- l'esito energetico e la bellezza musicale sono metriche distinte.

**Controllo A — Photon Return:** stessi Polytroni fissi, ma al posto dei viaggiatori DNA si emettono raggi energetici senza ricombinazione genetica. Confronto di leggibilità, soddisfazione, meraviglia e necessità di fusione/fissione. Se A è superiore su quasi tutto, mantenere DNA mobile come comportamento secondario e non reinventare Lemmings.

**Vietato nella prima prova:** 72 torri simultaneamente, particelle “infinite” per singola scarica, collisioni probabilistiche, cambi automatici di tutte le torri a ogni tick, emissione arbitraria di raggi secondari e umori casuali dei portatori; no pressione sul frame in cui catturare.

---

## 9. Decisione del Design Team

| Questione | Stato | Dissenso / test |
|---|---|---|
| Audio come sistema portante | **VINCOLO ACCOLTO** | Mappatura timbrica/tonale ancora sperimentale |
| Settima competenza MS | **AGGIUNTA AL PROTOCOLLO** | Simulata, non agente esterno |
| Reactable, NodeBeat, Euclidean, Rytmos | **RIFERIMENTI VERIFICATI** | Importare relazioni spaziali e loop, non rotazioni manuali |
| Architron emettitore+collettore | **CANDIDATO PRINCIPALE** | Test di ritorno naturale senza obiettivo arbitrario |
| Energia cresce soltanto con percorrenza | **RESPINTO** | Cercare fonti consumabili lungo le rotte |
| Portatori temporanei con DNA Conway | **FORTEMENTE PROMETTENTE** | FE chiede semantica energetica/genetica |
| 72 individui permanenti vs portatori senza nome | **PRINCIPIO** | Limiti per ciclo e genealogia da formalizzare |
| Collisioni bidirezionali e torri mutate | **IPOTESI FONDANTE** | Evitare caos e rottura identità senza undo |
| Scattering continuo + cammino esagonale | **STRATEGIA IBRIDA FUTURA** | SE teme perdita della fluidità |
| Simmetria/meraviglia come risultato causale | **VINCOLO** | Nessun punteggio automatico per bellezza |
| Tempo di simulazione != BPM e frame rate | **VINCOLO ARCHITETTURALE** | Replay deterministico e quantizzazione sonora |
| M0 → M1 → M2 (+ controllo raggi) | **PROSSIMO ESPERIMENTO RACCOMANDATO** | Un gate per volta, non nuovo Reactor Zero mastodontico |

## 10. Meta-scopo e i dubbi ancora aperti
La metafora non è più soltanto «costruisco un reattore che genera ENERGY», ma anche «compongo **un circuito che trasforma e fa ritornare ciò che ho emesso**». Il giocatore può perseguire efficienza, trasformazioni genetiche, costruzione di famiglie funzionali, robustezza, varietà dei fenomeni e qualità musicale; nessun sistema separato di quest per 8 esemplari.

**Dissenso profondo LU/PG:** un circuito che rende un profitto stabile potrebbe diventare una soluzione definitivamente ottima e togliere motivazione a continuare. Per ottenere desiderio di esperimento servono nuove proprietà ambientali e nuove specie con *utilità differente*, non 1000 cicli farmabili e non obiettivi artificiali. Non dichiarare questo problema risolto.

**FE:** le due ipotesi più dure da risolvere sono (a) una legge locale di mutazione che conservi quantità / mantenga l'identità (b) un percorso con feedback dinamico che sia predicibile ma sorprendente. Metterle al centro dello sviluppo futuro.

**MS:** non chiamare “sonorizzazione” ciò che dovrebbe essere **composizione algoritmica intrinseca**. Innescare un ciclo vuol dire lanciare contemporaneamente una simulazione fisica e un sequencer costruito con la stessa legge. Il gioco deve funzionare anche muto, ma una parte della sua identità espressiva è musicale.

**Verdetto provvisorio:** fra raggi e Polytroni viaggiatori, il Design Team dà priorità di studio ai viaggiatori come proposta più capace di unificare le idee senza aggiungere un sistema di poteri arbitrarî. I raggi continui non vengono scartati: restano alternativa di controllo e possibile sottosistema visivo-fisico. La seconda priorità è **un event-log musicale comune alla simulazione** fin dal primo microtest. Nessun gameplay implementato in questa sessione.
