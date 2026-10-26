# MINDELEEV — Sessione 07
## Lenia, Particle Lenia, Particle Life e la *cristallizzazione* sul Mutatron

**Data:** 26 ottobre 2026  
**Tipo:** addendum adversarial alla Sessione 06; ricerca documentale e progettazione, NON test empirico del gameplay.  
**Branch:** \`research/sprint07-lenia-crystallization\` (derivato da \`research/sprint06-fusion-fission-co-design\`, senza modificare main o develop).  
**Panel:** cinque prospettive di progettazione **simulate** dall'assistente: Architetto del Puzzle (PA), Sistemi Emergenti (SE), Genetista (GC), Psicologo (PG), Fisico (FE). Non rappresentano professionisti reali che abbiano lavorato autonomamente.  
**Tesi sperimentale:** non considerare la griglia esagonale e la fisica continua come mondi alternativi: valutare una *transizione deliberata* fra stati dinamici liberi e stati discreti catturati nei sink esagonali.

---

# 1. Executive summary

La novità più utile emersa non è una nuova legge complessa, ma la possibile **separazione di tre domini**:
- **Dinamica:** particelle/Polytroni con posizioni e forze continue, oppure campo distribuito.
- **Reazione:** fusione/fissione, mutazione del DNA, compatibilità cromatica e seme; queste sono transizioni di stato **discrete**, anche se attivate per prossimità.
- **Osservazione/registrazione:** una mappa esagonale a sink, su cui configurazioni transitorie si cristallizzano in stati leggibili, riproducibili, risolvibili o collezionabili.

**Ipotesi forte:** il momento in cui un sistema libero viene catturato in una configurazione esagonale può diventare una **scelta strategica del giocatore**, non un trucco grafico. La griglia non deve pretendere di essere l'universo: può essere uno **strumento di misura e fissazione** dell'universo.

**Rischio principale:** se la quantizzazione è mal definita, il giocatore vede una configurazione e ottiene un risultato diverso, senza capirne la ragione. I sink diventano un arbitro arbitrario; la parte continua è allora decorazione rumorosa. Il report definisce condizioni di falsificabilità.

**Priorità non mutata:** un gioco, non soltanto una bella simulazione. Lenia e Particle Life sono magnifici riferimenti per l'emergenza, non evidenza che aggiungere uno swarm renda interessante l'intervento del giocatore.

---

# 2. Riferimenti verificati e differenze che contano

## Lenia (Bert Wang-Chak Chan, 2018/2019)
- Estende Game of Life a uno stato continuo e a una regola di evoluzione liscia: un campo con valori reali e interazioni determinate da kernel spaziali e funzioni di crescita.
- Le sue realizzazioni numeriche continuano a usare matrici/griglie finite. "Continuo" si riferisce a spazio/stato/tempo modellati idealmente nel continuo, non al divieto di rappresentazione discreta.
- Oltre 400 pattern categorizzati come specie/famiglie mostrano ricchezza emergente, ma la ricerca di un pattern interessante può richiedere esplorazione sistematica dello spazio dei parametri.
- NON implica automaticamente conservazione della massa né un'economia ENERGY utilizzabile.

## Particle Lenia (Mordvintsev, Niklasson, Randazzo; Google Research, 2022)
- Riprende l'ispirazione di Lenia con particelle e campi locali; formula il movimento tramite gradienti di una funzione locale che combina crescita e repulsione.
- **Nel modello presentato le particelle non conservano momento inerziale**: sono sovrasmorzate e seguono una velocità determinata dal gradiente. Non equivalgono a un orbitale newtoniano.
- Il numero costante delle particelle fornisce un vincolo naturale di massa/quantità nella rappresentazione. I parametri possono in linea di principio differire fra individui o specie.
- Il testo sottolinea la differenza fra ricerca di ottimo energetico globale e discesa locale: comportamenti inattesi emergono anche se il sistema cerca localmente minimi.
- Rilevanza per Mindeleev: ricca riorganizzazione senza richiedere un sistema di orbite/rigid bodies; possibile riferimento per uno strato di "riassestamento" organico.

## Particle Life (varianti come Najarro)
- Tipi cromatici e **matrice di attrazione/repulsione orientata**: l'influenza di A su B può essere diversa dall'influenza di B su A.
- Da poche famiglie e regole locali emergono aggregati, inseguimenti, flussi e strutture rotanti.
- Il sito https://najarro.science/pl/ espone migliaia di particelle, sei tipi di default, controllo di dt, frizione, gravità, temperatura, matrice d'interazione, modalità 2D/3D, strumenti di selezione/esperimento e utilizza WebGPU/WGSL nel browser. **Sono stati ispezionati i controlli e la descrizione pubblica, non osservati direttamente frame di una sessione realtime con interazione.**
- **Caveat fisico:** una matrice asimmetrica generica non descrive un sistema chiuso di forze reciproche ottenibile da un'unica energia potenziale simmetrica; può costituire un mondo ludico intenzionalmente non conservativo, ma non va presentato come dinamica newtoniana conservativa.
- **Caveat di gameplay:** 16.384 particelle sono perfette per lo spettacolo ma pessime candidate a individui selezionabili come singoli Polytroni con DNA leggibili. Distinguere *micro-particelle visuali* dai *macro-Polytroni collezionabili*.

## Flow-Lenia (Plantec et al., versione pubblicata 2025)
- Estensione conservativa di Lenia orientata a evitare creazione/scomparsa incontrollate di "materia" e a localizzare parametri dinamici, permettendo più famiglie di comportamento nello stesso mondo.
- Rilevanza: prima di adottare un automa con fusione, fissione e natalità, verificare se il sistema deve conservare un costituente, o se nasce dal nulla per convenzione. Flow-Lenia è un precedente concettualmente utile.

### Fonti primarie / ufficiali
- Lenia paper: https://arxiv.org/abs/1812.05433
- Lenia portal: https://chakazul.github.io/lenia.html
- Codice Lenia: https://github.com/Chakazul/Lenia
- Particle Lenia: https://google-research.github.io/self-organising-systems/particle-lenia/
- Particle Life: https://particle-life.com/
- Najarro: https://najarro.science/pl/
- Flow-Lenia (DeepMind): https://deepmind.google/research/publications/106327/
- Precedenti progetti Mindeleev: https://github.com/BabeleDunnit/Mendeleev; https://github.com/BabeleDunnit/MindeleevSpatial; https://github.com/BabeleDunnit/MindeleevBolt01

---

# 3. Tavolo di design: round A — Che cosa impariamo davvero dall'artificial life?

**SE:** "Basta smettere di prescrivere pattern. Lasciamo che poche affinità cromatiche producano strutture da sole. Ci avviciniamo al caleidoscopio desiderato."  
**PA:** "La meraviglia è dimostrata dalle demo, ma non la necessità del giocatore. Che cosa sa prevedere? Come distinguiamo una mossa buona da una cattiva?"  
**GC:** "Una matrice cromatica è molto interessante perché ogni famiglia modifica davvero le forze. Ma se tutti i DNA di una famiglia si comportano identicamente, la geometria Conway resta skin."  
**PG:** "Randomizzare una matrice 6×6 e guardare il risultato può essere ipnotico, ma non insegna necessariamente nulla. Dobbiamo far *acquisire un modello mentale*, non soltanto consumare sorpresa."  
**FE:** "Lenia, Particle Lenia e Particle Life non sono lo stesso sistema; soprattutto, campi continui, particelle sovrasmorzate e particelle con forze asimmetriche richiedono ipotesi e vincoli diversi."

**Esito A, unanime:** usare questi riferimenti come libreria di *principi generativi*, non importarne ciecamente i simulatori. Per il puzzle iniziale bastano 3–6 macro-Polytroni. Le rappresentazioni da migliaia di particelle restano un candidato visivo o una modalità separata.

**Insistenza SE:** non sterilizzare tutte le proprietà emergenti imponendo condizioni di vittoria troppo rigide. **Risposta:** una modalità laboratorio aperto può coesistere con puzzle brevi, ma non deve sostituirli.

---

# 4. Tavolo di design: round B — Movimento continuo + quantizzazione esagonale

## 4.1 La distinzione dimenticata
"Discreto vs continuo" raggruppava tre problemi indipendenti:
1. **Coordinate del movimento:** \`x(t)\` e \`v(t)\` continui.
2. **Cambiamenti di identità:** fusione e fissione sono eventi discreti (\`2→1\`, \`1→2\`); DNA/colore/seme cambiano atomicamente.
3. **Rappresentazione strategica:** le posizioni possono essere proiettate/catturate su 19 sink esagonali alla richiesta del giocatore o dopo un trigger.

Non c'è contraddizione nel simulare il moto continuo e registrare la configurazione in una griglia discreta, purché la funzione di cattura sia ben definita.

## 4.2 Ipotesi "Cristallizzazione"
**Preparazione -> perturbazione -> deriva / riassestamento -> cristallizzazione -> risultato e scoperta**.

- Preparazione: campo libero con few Polytrons; obiettivo conosciuto.
- Perturbazione: impulso/cannone, fusione per prossimità, fissione selettiva, cambio di gene.
- Deriva: forze dipendenti dai caratteri aggiornati ricollocano il gruppo.
- Cristallizzazione: *azione* che cattura posizioni in sink, secondo regole note.
- Risultato: configurazione discreta giudicabile, registrata sulla Tavola, eventualmente oggetto di nuovo intervento.

**La fase non deve terminare automaticamente al primo frame "quasi fermo"**: ciò ridurrebbe agency e creerebbe esiti dipendenti da soglie nascoste. Prima sperimentare l'innesco deliberato; poi confrontarlo con la cattura automatica a condizioni note.

## 4.3 La funzione di quantizzazione Q
Definire una griglia finita \`S={s1...sm}\` di sink e Polytroni continui \`P={p1...pn}\` con \`n <= m\`. La quantizzazione è una assegnazione iniettiva \`Q: P -> S\` che minimizza:
\`cost(Q)= Σ_i w_i ||x_i-s_Q(i)||² + λ Σ_i I[Q(i) != sink_precedente(i)]\`
sotto eventuali limiti di raggio/cella ammissibile. Eventi di fusion/fission modificano n prima della cattura. In alternativa usare nearest-cell con capacità e risolvere collisioni in modo canonico.

**Da testare due algoritmi:**
- **Q-nearest:** assegnazione alla cella più vicina, con risoluzione deterministica dei conflitti. Semplice da spiegare, ma conflitti possono risultare sorprendenti.
- **Q-global:** minimum-cost bipartite assignment (Hungarian/min-cost matching o solver per 19 celle) e tie-breaking deterministico per ID. Riduce il movimento aggregato, ma una particella può finire in un sink non intuitivamente "suo".

**Nuova obiezione PA:** se un giocatore vede la particella accanto al sink A e la vede catturata dal sink B a causa di una riassegnazione globale, il puzzle appare ingiusto.  
**Mitigazione PG:** disegnare in *tempo reale* le linee fantasma che mostrano l'assegnazione prevista; consentire rifiuto e modifica del timing. In alternativa limitare la cattura al raggio del sink e lasciare fuori elementi non catturabili.

## 4.4 Discontinuità e isteresi
Senza isteresi una particella ai confini fra due esagoni può cambiare continuamente sink per oscillazioni microscopiche (*flicker*). Testare:
- assegnazione stabile fino a un vantaggio di distanza superiore a una soglia \`h\`;
- tempo di permanenza minimo in una regione prima della cattura;
- attivazione quantizzazione solo a richiesta, non ogni frame;
- preview continua senza mutare lo stato logico.

Quando l'operazione di cattura avviene, bisogna esplicitare se:
(a) è soltanto un *record* della disposizione e il moto continua, oppure
(b) i Polytroni vengono davvero immobilizzati in sink, creando nuove possibilità di manipolazione discreta.
Per il puzzle testare (b); per il laboratorio, anche (a).

## 4.5 Lattice come *campo potenziale*, non snap
Alternativa FE/SE: ogni sink rappresenta un pozzo di potenziale \`U_lattice(x)\`, che attrae debolmente o fortemente i Polytroni. La cattura non teletrasporta istantaneamente, ma aumenta in modo controllato la profondità dei pozzi; i corpi convergono naturalmente verso i centri dei sink.
- Pro: continuità della fisica e animazione più credibile.
- Contro: gli esiti possono diventare sensibili ai parametri e alle barriere locali; occupazioni doppie o ambigue, tuning aggiuntivo.
La proposta preferita per il *primo test di logica* è Q deterministica con preview, mentre i pozzi possono essere un livello di animazione che implementa la Q scelta.

**Avvertenza tecnica:** la quantizzazione spaziale è uno *snap* o una *cattura discreta*, non "quantizzazione quantistica" della materia. Non usarla come affermazione di meccanica quantistica.

---

# 5. Tavolo di design: round C — Il colore come legge e l'energia come vincolo

## 5.1 Matrice di affinità
Per tre famiglie cromatiche \`A, B, C\`, una piccola matrice \`M_{AB}\` può decidere se due Polytroni tendono ad avvicinarsi, allontanarsi o restare indifferenti. Le famiglie possono essere caratteristiche del genotipo, non necessariamente identiche alla tinta finale.

**Obiezione FE:** se \`M_{AB} != M_{BA}\`, una dinamica del tipo Particle Life può descrivere inseguimento e circolazione attiva, ma non è generalmente un sistema di sole forze conservative a coppie. Evitare di promettere una funzione U globale per ogni combinazione di asimmetria.

**Prima prova A/B:**
- M simmetrica: affinità compatibili con distanze o potenziali reciproci, più facili da spiegare e verificare.
- M asimmetrica: potenzialmente più teatrale e vitale, ma risultati più difficili da interpretare come equilibrio statico. Riservare a un test "active matter", non standard del gioco.

**Obiezione GC:** colore non può cancellare gli operatori e il seme. Inserirli gradualmente nei parametri \`d_ij\` e \`k_ij\` per verificare se cambiano la decisione ottima del giocatore, non solo l'animazione.

## 5.2 Numeric ID vs energia
Il numero politronico del progetto Vite è un **codice della ricetta**, non una riserva di energia. Non sommarlo come joule.  
**ENERGY** rimane l'unico budget consumabile del giocatore. L'energia potenziale delle molle e il termine di repulsione sono **osservabili dinamiche**, non una seconda valuta.  
Un modello che usa una matrice asimmetrica e un campo attivo deve includere una sorgente o semplicemente dichiararsi dinamica fittizia senza invariante energetica globale.

## 5.3 "Massa" e fusione/fissione
Se vogliamo chiamarle trasformazioni materiali, dobbiamo definire cosa conservano. \`2->1\` e \`1->2\` cambiano il numero degli individui; duplicare un seme in due ricette non conserva automaticamente alcun volume materiale.
Tre alternative:
1. **Programmi geometrici** (prima scelta MVP): fusion/fission riscrivono ricette; nessuna pretesa di conservazione volumetrica, soltanto budget ENERGY e regole sintattiche.
2. **Massa interna non spendibile** \`m_i\`: fusione \`m_out=m_a+m_b\`; fissione \`m_1+m_2=m_in\`. Se esiste, influenza inerzia e collisioni.
3. **Costituenti/atomi virtuali**: algebra rigorosa di unità conservate; alta coerenza, ma possibile proliferazione di complessità.

**Decisione test:** 1 in Chemical Surgery; 2 soltanto se la massa cambia realmente le possibilità del puzzle fisico.

---

# 6. Tavolo di design: round D — Qual è la mossa interessante?

### PA: "La domanda non è quanto è spettacolare l'universo, ma *quando* cristallizzo?"
Il puzzle dovrebbe offrire uno stato in cui la cattura anticipata blocca un posizionamento sbagliato; una perturbazione ben scelta porta a un'assegnazione diversa e vincente. Se aspettare fa sempre soltanto migliorare le cose, la cattura è un pulsante di attesa.

### PG: "L'anteprima deve essere affidabile."
Prima di premere Cristallizza, il giocatore vede le celle che verranno occupate e un riepilogo dei legami soddisfatti/violati. Se i sink cambiano continuamente, è un problema del sistema e non un problema risolvibile dal giocatore.

### SE: "Non trasformiamo lo swarm in un lungo corridoio verso il puzzle."
Perdersi nella dinamica e scoprirvi pattern nuovi è uno dei piaceri voluti dall'utente. Prevedere una seconda modalità **libera** senza obiettivo rigido, con possibilità di registrare un pattern e assegnargli un codice/proprietà.

### GC: "La collezione deve registrare la *causa*."
Una nuova forma, un nuovo equilibrio o una famiglia cromatica devono essere attribuiti a un genotipo e a un esperimento ripetibile; non "guadagnati" semplicemente osservando un pattern casuale per ore.

### FE: "La cristallizzazione è una regola fisica addizionale, non un dettaglio render."
Se cambia realmente la dinamica dei Polytroni, è una transizione di fase del sistema ludico e va contabilizzata. Se produce soltanto una vista discreta, non è una meccanica. Scegliere esplicitamente.

**Esito D:** sperimentare una cristallizzazione **deliberata, leggibile e con conseguenze**, anziché cattura automatica su soglia sconosciuta.

---

# 7. Schema di prodotto candidato: due scale, un solo soggetto del gioco

## 7.1 NO all'equivalenza "una particella = un Polytrone"
Le demo A-Life da migliaia di punti funzionano perché molti individui sono anonimi. In Mindeleev un Polytrone possiede DNA, identità, genealogia, palette, seme, costo e storia. Non possiamo selezionare/comprendere 16.384 Polytroni individualmente.

### Opzione A — Macro-Polytroni
3–12 Polytroni visualizzati come veri solidi 3D; forze locali fra i loro centri; occasionali campi di tracce e sotto-particelle **solo visive**. È l'opzione raccomandata per il primo test di puzzle.

### Opzione B — Colonie microscopiche
Ogni Polytrone è un *aggregato* di micro-particelle; la forma emergente dei puntini rappresenta il fenotipo, il DNA definisce le regole locali. Esteticamente potente, ma difficoltà enorme nel mantenere identità, geometria Conway e collisioni. NON partire da qui.

### Opzione C — Macro più campo di "etere"
Macro-Polytroni come oggetti di collezione; un campo/polvere di Particle Lenia reagisce ai loro stati e visualizza l'energia. Rischio che l'etere sia un layer ornamentale costoso. Ammesso in una fase successiva se migliora la leggibilità.

**Preferenza 5/5 per prototipo A**, pur salvaguardando opzione B come laboratorio artistico.

---

# 8. Un prototipo integratore, rigorosamente limitato

## H1 — *Crystallization Reactor* (nomi alternativi: Mutatron Phase Shift, Alchemical Lattice)
**Scene:** sei macro-Polytroni in 2D/3D sulla superficie, 19 sink esagonali nascosti o semitrasparenti, massimo due famiglie cromatiche e solo pochi operatori.
**Azione 1:** fusione mirata fra vicini dopo breve gesto di accostamento; cambia DNA e quindi preferenze dinamiche.  
**Azione 2:** fissione con scelta del taglio; modifica il numero di corpi e il sistema di relazioni.  
**Azione 3:** *Cristallizza!* cattura la configurazione attuale nelle 19 celle secondo Q deterministicamente anticipata.  
**Senza altre azioni nel primo test**: il cannone è una variante d'interfaccia per la fissione/impulso, non aggiungere "upgrade", "mutatron magic" e breeding contemporaneamente.  
**Unica risorsa spendibile:** ENERGY. Costi sperimentali unitari e trasparenti; la cattura può essere gratuita nel tutorial per evitare "non ho più energia per completare" senza decisione interessante.

### Tre livelli sperimentali (schemi, NON puzzle validati)
**H1.1 — Quando catturare?** Quattro Polytroni si attraggono/respingo secondo due affinità; una cristallizzazione immediata non occupa le tre celle richieste, mentre una cattura dopo un'interazione osservabile sì. Serve verificare che il timing sia controllabile e non soltanto attendere il passaggio di un frame fortunato.

**H1.2 — Una fusione cambia tutto.** Due Polytroni compatibili si fondono e il nuovo gene modifica distanze verso gli altri tre. Obiettivo: dopo riassestamento, catturare un pattern contiguo richiesto. Un unico step locale determina più caselle.

**H1.3 — Fissione per ridurre lo stress.** Una ricetta composita stabilizza un assetto sbagliato; un taglio scelto crea due frammenti con affinità distinte, cambiando l'occupazione dei sink. Un secondo taglio alternativo deve avere conseguenze diverse e verificabili.

Per tutti e tre: costruire uno *state explorer* deterministico e verificare che esistano soluzioni ottime/sottottime e fallimenti interpretabili.

## Variante di confronto V0
Stesso stato iniziale e stesso obiettivo, ma:
- **V0:** scelte e reazioni su griglia discreta; spring-mass solo animazione.
- **V1:** dinamica continua dei Polytroni; quantizzazione Q come azione.
Solo se V1 migliora *agency comprensibile* e varietà di soluzioni rispetto a V0 adottare ibrido come core.

---

# 9. Implementation notes, browser-first
- Simulatore: modulo TypeScript puro, deterministic RNG per perturbazioni e tie-break, fixed dt (es. 1/60 simulazione, eventualmente sub-step).
- Stato: \`WorldState{polytrons,positions,velocities,genes,energy,phase,seed,history}\`, azioni serializzate e replay.
- Forze: limitazione delle accelerazioni, collisioni, damping parametrico; verificare riproducibilità entro tolleranza se WebGPU introduce non-determinismo numerico.
- Quantizzazione: funzione pura \`quantize(positions, sinks, previousAssignment)\`, con min-cost matching o greedy deterministico e debug dei conflitti. Calcolare la preview dalla stessa funzione usata nel commit.
- Fisica e griglia: non spostare i dati logici in \`HexWorld.tsx\`; usare \`hexGrid.ts\` per geometria assiale e un adapter per world coordinates.
- Render: Three.js conserva il vero poliedro di Conway; Particle Life "colors" sono famiglie funzionali, non necessariamente le 10 palette numeriche definite nel codec.
- GitHub Pages: route statiche, uso di Vite \`base\` del repository path, nessun Supabase obbligatorio per laboratorio locale. Verificare la schermata nel browser, non soltanto il workflow verde.
- Nessuna nuova dipendenza da Unity, Spatial, Godot o installazione di un world XR.

---

# 10. Falsificabilità: quando bocceremmo la cristallizzazione?

**Bocciatura meccanica immediata** se:
- i giocatori non sanno prevedere quali sink saranno occupati pur avendo tutti gli indizi necessari;
- il risultato dipende da un singolo frame o da arrotondamenti opachi;
- la cattura ottimale coincide sempre con "attendi fino alla quiete, poi premi";
- la stessa disposizione continua catturata in tempi ravvicinati produce risultati arbitrariamente differenti;
- la fisica modifica solo tempi e animazioni ma non le decisioni ottime;
- le differenze di colore e seme non cambiano almeno una mossa preferibile in problemi altrimenti identici;
- si verifica la morte di un Polytrone unico o una perdita ENERGY non spiegata dopo un'azione apparentemente legale;
- il preview mostra un'occupazione diversa dal commit effettivo.

**Misure sperimentali preliminari** (non dati raccolti):
- Accuratezza della previsione Q: dopo il tutorial, 80% delle catture a pochi Polytroni previste correttamente dal giocatore.
- Decisione significativa: almeno due momenti di cristallizzazione possibili producono risultati diversi e, fra loro, uno migliore rispetto all'obiettivo.
- Tempo per comprendere una fusione: il giocatore sa indicare quali relazioni sono cambiate.
- Replay: stessa sequenza di mosse e seme -> stesso risultato entro tolleranza stabilita.
- Minimalismo: nessun livello richiede più di tre meccaniche attive nel tutorial.
- Giudizio qualitativo: confrontare il fascino percepito del visual e la motivazione a riprovare dopo un fallimento, senza confondere i due.

---

# 11. Octalysis: che cosa cambia con Lenia
- **CD3 Empowerment of Creativity + Feedback:** cresce se posso modificare una relazione e vedere conseguenze; diminuisce se la simulazione decide tutto.
- **CD7 Unpredictability/Curiosity:** un mondo di forze produce sorprese, ma deve evolvere verso leggi riconoscibili. Randomizzazione opaca del 6×6 matrix non è apprendimento.
- **CD2 Accomplishment:** cristallizzare la configurazione prevista può essere un obiettivo elegante, misurabile e spiegabile.
- **CD4 Ownership:** catturare una configurazione scoperta in un blueprint con genealogia, non obbligare a coltivare migliaia di unità.
- **CD6 Scarcity / CD8 Loss:** ancora deliberate basse; niente energy refill, timer di attesa, rarezze forzate o perdite irreversibili.
- **CD1 Meaning:** metafora esplorativa della periodicità e delle leggi, non affermazioni arbitrarie di fisica quantistica.

---

# 12. Decisioni della Sessione 07

| ID | Decisione | Consenso | Evidenza richiesta per revisione |
|---|---|---|---|
| S07-D1 | Riformulare "discreto vs continuo" in tre sottoproblemi indipendenti | 5/5 | Nessuna; distinzione concettuale |
| S07-D2 | Promuovere *Cristallizzazione* a candidato giocabile | 4/5; PG prudente | Un livello nel quale il timing cambia la soluzione |
| S07-D3 | Usare preview deterministicamente identica alla funzione Q | 5/5 | Obbligo di UX/fairness |
| S07-D4 | Iniziare con pochi macro-Polytroni, non migliaia di micro-particelle | 5/5 | Se simulazione di colonie dimostra il contrario |
| S07-D5 | Colore come affinità funzionale e seme come struttura reale | 5/5 requisito; legge aperta | Puzzle in cui il gene modifica la strategia |
| S07-D6 | M simmetrica prima, M asimmetrica in esperimento separato | PA/PG/FE favorevoli; SE contrario | Se sistemi attivi sono più prevedibili e interessanti |
| S07-D7 | Non migrare integralmente Lenia / Particle Life nel primo puzzle | 5/5 | Se ricetta minimale fallisce senza pattern emergenti |
| S07-D8 | Prototipi V0 discreto e V1 continuo+Q con obiettivo identico | 5/5 | Risultati di playtest |
| S07-D9 | Mantenere una singola ENERGY spendibile | 5/5 | Necessità dimostrata, non convenienza artificiale |
| S07-D10 | Nessuna modifica ai branch product in questa sessione | Operativo | Implementazione separata futura |

---

# 13. Dissenso finale — «Caleidoscopio o puzzle?»

**SE:** "Se cristallizziamo troppo presto perdiamo la vita; la magia è il moto continuo e la sopravvivenza dei pattern."  
**PA:** "Se non possiamo delimitare stati e scelte, rimaniamo spettatori di un bellissimo acquario."  
**PG:** "La risposta giusta non è metà fisica e metà griglia: è poter passare dall'una all'altra sapendo quale decisione stiamo prendendo."  
**GC:** "La scoperta deve poter essere *ripetuta e nominata*, altrimenti la collezione diventa una galleria di screenshot."  
**FE:** "Non confondiamo una proiezione spaziale con un collasso quantistico, né il riassestamento sovrasmorzato con un universo conservativo."

## Sintesi
Forse il design definitivo non è "un puzzle interrotto da un caleidoscopio", ma **un caleidoscopio che il giocatore può interpretare, perturbare e *catturare* per costruire soluzioni**. L'universo resta libero abbastanza da sorprendere; la griglia è uno strumento che trasforma una configurazione difficile da leggere in una scoperta verificabile.

È una **ipotesi da mettere a rischio**, non un gioco già trovato. Il primo compito non è creare un altro motore spettacolare. È progettare un livello nel quale catturare *adesso* sia significativamente diverso dal catturare *fra poco*, e capire se qualcuno trova la scelta appassionante.

---

# 14. Punti da riportare nella Sessione 06 e successivi lavori
- **Sessione 06:** fusione/fissione, DNA colore/seme, ENERGY unica, due core candidate A/B, Octalysis.
- **Sessione 07:** nuove fonti A-Life, distinzione fra dominio dinamico/reazione/cattura, ipotesi cristallizzazione, algoritmi Q, rischio di asimmetria, test V0/V1.
- **Prossimo artefatto tecnico razionale:** una specifica minimalista di \`quantize\` con test automatici su assegnazioni univoche, tie-break, capacità, isteresi e preview=commit; poi un solo micro-livello fisico con vera scelta di momento di cattura.
- **Non ancora fatto:** implementare o pubblicare il sistema di cristallizzazione, verificare Najarro live nel browser, playtest, validare che un esperimento sia divertente.
