# Sessione 15 — Phenotype Atlas: specie, ricette e individui
## Design Team a sei ruoli, inclusa la nuova competenza Ludologica

**Data:** 27 ottobre 2026
**Sorgente:** branch experiments/sprint15-phenotype-atlas-synthesis derivato dallo Sprint 14.
**Natura:** prototipo matematico-visivo, selezione di specie e ricerca astratta di vie di sintesi. Non un gioco completo. **Il Design Team sono sei prospettive critiche simulate da ChatGPT, non agenti esterni indipendenti.**
**Protocollo permanente:** [DESIGN_TEAM_PROTOCOLLO.md](DESIGN_TEAM_PROTOCOLLO.md) — l'assistente fa da **portavoce/coordinatore**, e il sesto ruolo Ludologo confronta precedenti concreti.

## 1. La decisione concettuale: tre entità non confondibili

**Specie:** categoria fenotipica, con firma di superficie Shape-DNA, proprietà e uno o più percorsi che producono la stessa struttura. La definizione della *stessa* specie deve essere matematica, non un threshold arbitrario di distanza spettrale. Attualmente la coincidenza geometrica è **provvisoria**, basata su firma canonica della mappa combinatoria orientata e multinsieme normalizzato di distanze fra vertici vicino sotto tolleranza: non è una prova rigorosa di congruenza. Specie diverse possono essere vicine nello spettro.

**Ricetta:** una parola di operatori Conway seguita da seme e palette, che produce un poliedro, eventualmente uguale a quello di altre ricette. Le ricette alternative sono conservate, non cancellate; possono avere costi/possibilità di sintesi diversi. È opportuno distinguere la **classe di ricette geometricamente equivalenti** dall'uguaglianza testuale e dall'equivalenza della funzione di scattering.

**Individuo:** uno dei potenzialmente **72** Polytroni nominati, con un'identità che può sopravvivere a mutazioni e cambi di specie. Il laboratorio non crea individui. Futuro schema dati:
\`Individual {permanentId, name, recipe, phenotypeId, ancestry, storedPotential, currentState}\`.
Non derivare l'ID dalla specie o da indice di catalogo: quando cambia la forma, il nome deve rimanere.

**Principio formulato dall'autore e condiviso dal team:** "Non collezioniamo DNA: scopriamo forme. Il DNA è il linguaggio per sintetizzarle". La collezione delle specie e la storia individuale sono archivi distinti.

## 2. Il confronto del Design Team

### PA — Architetto del Puzzle
**Favorevole** al rapporto fra due geometrie: distanza nello spazio Shape-DNA e distanza nel grafo delle trasformazioni geneticamente ammissibili. Una forma può essere spettralmente vicina e geneticamente difficile; una ricetta molto diversa può raggiungere lo stesso prodotto. Questo produce scelte di sintesi più interessanti di "crea il DNA X".
**Obiezione:** fusione/fissione dello Sprint 09 richiedono adiacenza e budget ENERGY, mentre la ricerca di vie nel catalogo non conosce ancora le posizioni sulla scacchiera. Una "via trovata" oggi è solo **raggiungibilità genetica astratta**. Non presentarla come soluzione realmente eseguibile.

### SE — Sistemi Emergenti
**Favorevole** a selezione per diversità che eviti grandi quantità di forme banali. Però il puro algoritmo farthest-first rischia di scartare famiglie di forme prossime che permettono transizioni continue/belle e variazioni locali nella dinamica.
**Proposta:** atlante stratificato, conserva 5 semi, poi campiona lo spazio spettrale; considerare "famiglie" e corridoi di trasformazione, non soltanto punti estremi.

### GC — Genetista
**Molto favorevole** alla separazione specie/ricetta/individuo. Il genotipo può avere alias geometrici; sono preziosi perché sintetizzabili con mezzi differenti e perché consentono genealogie distinte.
**Obiezione:** la fusione corrente elimina l'individuo B e la fissione crea un nuovo ID anonimo; non preserva ancora realmente il sistema identitario dei 72 Polytroni di MindeleevSpatial. **Non chiamare il prototipo attuale una genetica completa**. L'atlante lascia la questione sospesa.

### PG — Psicologo del Giocatore
**Favorevole** alla scoperta di forme tramite capacità e alle vie di sintesi come oggetto di competenza acquisita.
**Obiezione:** un atlante matematicamente perfetto può diventare un'enorme checklist senza tensione ludica. Prima di introdurre "specie rare", rendere una specie utile *per qualcosa* (interazione, simmetria, capacità energetica) e non solo più distante dallo spettro medio.
**Conseguenza:** nessuna missione "colleziona N", nessun farm infinite ENERGY.

### FE — Fisico / Matematico
**Favorevole con riserve metodologiche:** il laboratorio attuale calcola autovalori approssimati tramite elemento finito a pesi cotangenti e massa concentrata, triangolazione a ventaglio e vertici ≤80. L'atlas iniziale usa **tre autovalori positivi** normalizzati con l'area perché il tetraedro ha soltanto tre modi non banali. Per distanze più fedeli occorre usare remeshing coerente, sufficienti modi, analisi di convergenza e un metodo per confrontare forme di complessità diversa.
**Obiezione:** distanza euclidea dei primi tre autovalori non è una distanza di energia, di reattività, né definisce specie identiche. Anche la firma canonical + multinsieme distanze è una euristica prudente.

### LU — Ludologo / Comparative Mechanics (NUOVO)
**Favorevole al rapporto "forma desiderata ↔ via di sintesi":** è vicino alla fantasia dei giochi di puzzle alchemico/ingegneristico; nei puzzle aperti tipo **Opus Magnum** contano non solo il prodotto ma le diverse macchine e i differenti costi/efficienze della produzione.
**Analogie documentate:**
- **Opus Magnum** — alchimia, componenti programmabili, puzzle aperti, confronto della compattezza/velocità dei processi. Adattamento: più vie genetiche verso una specie, scelta ragionata in base alle risorse iniziali. Rischio: scripting di macchine che schiaccia l'estetica. https://www.zachtronics.com/opus-magnum/
- **SpaceChem** — reattori e trasformazioni dei materiali, programmazione e vincoli; trasposizione: percorsi alternativi e leggi di reazione. Rischio: progettazione troppo complessa. https://www.zachtronics.com/spacechem/
- **shapez** — fabbrica di forme attraverso cutting, rotation, merging e painting. Trasposizione: catalogo di fenotipi come prodotti di trasformazioni. **Non** adottare rotazione manuale in-place, produzione illimitata o impianto lineare. https://github.com/tobspr-games/shapez.io
- **Rubik state graph** — analogia di grafo di mosse; trasposizione: visione a due distanze, fenotipica e genetica. https://nathanielc.com/sketches/rubiks-state-graph/
**Critica più dura del Ludologo:** "L'atlante risolve una difficoltà **di produzione del contenuto** per l'autore, non la domanda **perché giocare**. Un generatore di 100.000 forme non produce automaticamente un singolo minuto di divertimento. L'atlante deve aprire la strada a problemi emergenti, non diventare un'altra questione metrica."

**Dissenso reale simulato LU/FE:** FE ritiene prioritario validare spettri e equivalenze prima di ogni decisione; LU vorrebbe un micro-problema ludico di confronto di due vie di sintesi al più presto. Il compromesso è inserire nel prototipo un **esploratore limitato delle vie di fusione/fissione**, rigorosamente segnalato come astratto, senza dedurne che il gioco sia già funzionante.

## 3. Il prototipo concreto

**Generatore riproducibile:** \`scripts/build-phenotype-atlas.mjs\`.
- Genera forme da 5 semi, operatori selezionati a profondità 0–2 e un piccolo set di ricette diagnostiche a profondità 3. Non è un'esplorazione esaustiva degli oltre 8 milioni di codici.
- Mantiene solo mesh chiuse con \(\chi=2\), < 65 vertici, spettro calcolabile.
- Canonicalizza combinatoriamente tramite traversing rooted darts per confronti vicini, e confronta multinsiemi normalizzati delle distanze quadrate (tolleranza RMS < .002). **Congruenza geometrica provvisoria**, non deduzione esatta; alias conservati.
- Shape-DNA di superficie approssimato: **3 autovalori positivi area-normalizzati**. Distanza euclidea di tre componenti, senza rapporti logaritmici.
- Selezione greedy max-min con 5 semi come ancore e leggerissima penalizzazione complessità; **questo è un campionamento esplorativo, non una definizione definitiva di interessante**.
- Output: \`public/phenotype-atlas.json\` e \`public/phenotype-atlas.csv\`, costruiti automaticamente in CI e pubblicati su GitHub Pages, non conservati in git nel branch.

**UI:** \`src/experiments/PhenotypeAtlasLab.tsx\` accessibile via \`?experiment=atlas\`. Paesaggio spettrale 2D (proiezione degli autovalori 1 e 2 di uno spazio a 3), vista 3D dei Polytroni con orientazione fissa, lista delle specie, alias, vicini spettrali, esportazione dei dati, e una preview delle vie genetiche.

**Ricerca genetica:** \`src/experiments/synthesisPlanner.ts\`. BFS delimitata di ricette per fusione concatenativa e fissione al taglio, con semi/palette uguali e lunghezza operatori ≤4, max 3 mosse/1100 stati nell'interfaccia. Confronta il **fenotipo geometrico** a prescindere dalla palette. **Limitazioni importanti:** non modelliamo ancora adiacenze, movimenti, budget ENERGY, né mutazione seed, né individui/nome. "No path" significa soltanto "non trovato nell'orizzonte impostato".

**Non implementati:** mercato, missioni, effetti energetici del fenotipo, mutazioni probabilistiche, 72 individui persistenti, percorso di sintesi completo del gioco. Non fare affermazioni contrarie.

## 4. Gates e passaggi seguenti
1. Verificare che il catalogo precomputato sia non vuoto, includa tutti i 5 semi, contenga alias e firme finite; raccolta di statistiche dei rifiuti.
2. Valutare quanto i gruppi geometrici siano sensibili alla tolleranza, e introdurre una canonicalizzazione geometrica più rigorosa.
3. Calcolare precisione spettrale su remesh e molte più forme senza privilegiare l'ordine basso.
4. Aggiungere una vista del **grafo delle ricette raggiungibili** per una singola specie, non soltanto una sequenza di mosse.
5. Reintrodurre una prima **funzione energetica misurabile del fenotipo** come test, non come premio inventato; solo allora valutare se la collezione produce desiderio di sintetizzare.
6. Design Team: il **Ludologo** deve partecipare a ogni revisione futura delle meccaniche, con confronti concreti e dissensi documentati. La ricerca scientifica resta una fonte di coerenza, non un surrogato del game design.
