# Sessione 12 — L'algebra energetica di Mindeleev
## Una strada formale, oltre il tentativo e l'errore ludico

**Data:** 27 ottobre 2026  
**Stato:** ricerca matematica e banco di prova **non visivo**; nessuna nuova meccanica inserita nello Sprint 09.  
**Base:** Sessione 11 Symmetry Reactor, MindeleevSpatial e operatori Conway originali.  
**Domanda:** «Esiste una rappresentazione energetica semplice e non banale dell'algebra di Conway, capace di produrre trasformazioni visibili, conservare correttamente l'energia e generare comportamenti ludici interessanti?»

## Executive summary
**Sì, per un sottosistema significativo possiamo già costruire una rappresentazione esatta e non banale** con matrici non negative e conservazione dell'energia. Non è stata dimostrata una rappresentazione completa e fedele di *tutti* gli operatori Conway, né che questa rappresentazione produca un buon gioco. La vera novità del metodo è separare le questioni:
- *Esistenza/coerenza:* deduzione e ricerca matematica + unit test.
- *Funzione geometrica:* ricavare risposte ai fasci dalle strutture e orientazioni reali dei poliedri.
- *Produzione di ENERGY:* bilancio di sistemi chiusi/aperti, prova dei cicli.
- *Gameplay e stupore:* prototipi confrontabili, ma solo **dopo** aver escluso le contraddizioni matematiche.

I due modelli desiderati dall'autore — **Polytrone-accumulatore** e **Polytrone-convertitore** — possono coesistere come sottosistemi distinti dello stesso ledger energetico. Il progetto li prova separatamente e insieme in uno script Node.

---

# 1. Che cos'è la vera algebra geometrica?

Gli operatori Conway agiscono su poliedri (più precisamente su strutture di incidenza o mappe su superficie) e la loro composizione è associativa e in generale non commutativa. L'operatore identità esiste, ma molte trasformazioni non sono invertibili; certe operazioni hanno restrizioni di dominio. La struttura generale è vicina a un **monoide di trasformazioni parziali / presentazione con generatori e relazioni**, non un singolo gruppo che racchiude ogni effetto.

La scrittura di un DNA come \`taC\` significa \`t(a(C))\`: opera da destra a sinistra. Prima di mappare i geni sull'energia occorre distinguere:
1. equivalenza di **ricetta testuale**;
2. equivalenza del **grafo poliedrico** (topologia/combinatoria);
3. equivalenza di **mesh geometrica in R³** (lunghezze, angoli, proiezioni);
4. equivalenza del **comportamento energetico**.

In generale (2) non implica (3) senza una convenzione di realizzazione, e (2) non implica automaticamente (4) a meno di imporlo nella nostra progettazione.

Relazioni verificate in fonte George Hart:
- \`ddX = X\` (dual² = identità).
- \`a(dX) = a(X)\` (ambo non distingue due solidi duali).
- \`aaX = eX\` (expand equivale a due ambo).
- \`kX = d t d X\` (kis e truncate duali coniugati).
- \`jX = d a X\` (join è duale di ambo).

Fonti: https://georgehart.com/conway/notation.html ; https://antitile.readthedocs.io/en/latest/conway.html
Rimando importante: \`PolyhedronRecipeAlgebra.cs\` e \`PolyhedronRecipeKabbalah.cs\` di MindeleevSpatial implementano **algebre ludiche simboliche ulteriori**, non dimostrazioni della composizione geometrica Conway.

## Strada matematica formale
A. Fare un inventario di **generatori e relazioni** per il sottoinsieme \`d,a\`; aggiungere \`k,t,j,e\` solo dopo.
B. Definire un insieme di stati energetici \(\mathcal E\).
C. Cercare una mappa \(\rho\) che porti ogni operatore in una trasformazione energetica rispettando \(\rho(xy)=\rho(x)\rho(y)\) per le convenzioni compositive, e tutte le relazioni dichiarate.
D. Cercare una **rappresentazione non banale**: almeno due parole danno azioni diverse sullo stesso fascio, tutte le identità richieste restano vere, e qualche osservabile funzionale cambia.
E. Validare le relazioni simbolicamente (razionali esatti, algebra computazionale, eventualmente SMT) e con proprietà testabili su generatori di poliedri.
F. Solo successivamente verificare ricchezza dei pattern su campo 2D continuo.

---

# 2. Un risultato costruttivo: matrici energetiche non commutative

Scegliamo **tre canali di intensità** \(q=(q_1,q_2,q_3)^\top\ge0\), con energia totale \(E(q)=q_1+q_2+q_3\). Si tratta di canali ludici astratti, NON del numero di fotoni di tre frequenze reali.

Definiamo due matrici razionali:

\[
D = \begin{pmatrix}0&1&0\\1&0&0\\0&0&1\end{pmatrix},
\qquad
A = \begin{pmatrix}1/2&1/2&0\\1/4&1/4&1\\1/4&1/4&0\end{pmatrix}.
\]

Le colonne sono **stocastiche** (somma 1) e non negative. Quindi \(E(Tq)=E(q)\) per tutte le combinazioni di \(D,A\), e nessuna intensità diventa negativa.

Identità controllate:
\[
D^2=I,\quad AD=A,\quad A^2=E_\mathrm{expand},\quad DA\ne AD,\quad A^2\ne A.
\]

Il terzo enunciato definisce per ora \(\rho(e)=A^2\); NON dimostra automaticamente che tutte le altre relazioni dell'operatore geometrico \`e\` siano soddisfatte. Rispettiamo alcune **relazioni significative** dell'algebra, non ancora tutte quelle della presentazione completa.

Per l'ingresso \(q=(1,0,0)\):
- prima \`a\`, poi \`d\`: \(DAq=(1/4,1/2,1/4)\).
- prima \`d\`, poi \`a\`: \(ADq=(1/2,1/4,1/4)\).
- \`aa\`: \(A^2q=(3/8,7/16,3/16)\).

Tutte sommano a 1: **composizione non commutativa e conservativa**. È un *certificato di esistenza per il sottosistema di relazioni testato*, non una teoria fisica del cubo.

La futura app può visualizzare il fascio come proporzioni luminose colorate; la tinta e l'ordine delle trasformazioni alterano il pattern osservabile, senza aumentare il totale.

## Risultato negativo interessante: perché due soli canali sono spesso troppo pochi

Supponiamo uno stato di **due intensità non negative**, \((r,b)\), e
\(D=\begin{pmatrix}0&1\\1&0\end{pmatrix}\), che scambia i canali.
Imponiamo l'identità di Conway \(\rho(ad)=\rho(a)\), quindi \(AD=A\).

Poiché \(D\) scambia le colonne, \(AD=A\) impone che le **due colonne di A coincidano**. Essendo A stocastica a colonne, tali colonne sono un unico vettore di somma 1; ne segue \(\boxed{A^2=A}\).

Dunque in questo specifico modello a due componenti *ambo* ed *expand=ambo²* sarebbero indistinguibili. Questo non prova che tutti i modelli a due colori siano impossibili; basta aggiungere, ad esempio, direzione/fase/memoria interna per evitare l'ipotesi. Ma è un **no-go rigoroso** per due *soli* canali di intensità e quella scelta di D.

**Conseguenza progettuale:** tre canali possono essere un minimo sensato per il sottosistema \(d,a\) se vogliamo distinguere \`a\` da \`aa\`. In un MVP grafico potremmo mostrare solo due colori dominanti, purché lo stato conservi una terza modalità interna; NON obblighiamo tre genotipi cromatici.

---

# 3. Fisica geometrica: un'alternativa alle “abilità di ogni lettera”

**Strada indipendente e importante:** derivare la risposta energetica dalla geometria effettiva del poliedro invece che assegnare manualmente \(T_d,T_a,\ldots\).

Per ogni mesh finale in R³:
1. estrarre normali orientate alle facce, aree, vicinati, valenze, simmetrie e eventuale orientamento individuale;
2. interpretare i dati come **porte di scattering** o campo di influenza;
3. proiettarli in un piano 2D continuo con una convenzione esplicita di orientazione;
4. calcolare come un fascio di direzione \(\theta\) viene deviato, diviso, filtrato e attenuato;
5. garantire con una normalizzazione locale che la somma delle intensità dei rami resti entro quella disponibile + sorgenti esplicitamente contabilizzate.

Vantaggio: forma visiva e funzione energetica sono causalmente collegate. Due sequenze diverse che producono la stessa geometria canonica avranno lo stesso scattering (salvo genetica cromatica e rotazione). È un approccio elegante per Mindeleev, ma **non equivale automaticamente** a trovare una matrice \(T_o\) indipendente dal poliedro per ogni operatore.

Le due strade possono convergere: usare la ricerca algebrica per proporre una legge semplice, poi costringerla a rispettare la geometria finale tramite test di corrispondenza. Una completa rappresentazione fedele su 3 canali è improbabile senza un gran numero di modi/spazi; l'esistenza generale non è dimostrata qui.

## Tecnologia matematica disponibile
- Matrici razionali non negative e algebra di semigruppi per *intensità*.
- Matrici di scattering/passive operator e norma contrattiva per *ampiezze complesse* (fase/interferenza), rimandate a dopo.
- Grafo di incidenza/half-edge/flag e canonicalizzazione per verificare equivalenze di poliedri.
- Teoria delle rappresentazioni di gruppi delle simmetrie T/O/I e di rotazioni D6 del reticolo, con **equivarianza** \(F(Rx)=RF(x)\).
- SMT/linear constraints: trovare matrici con coefficienti razionali piccoli che soddisfino identità, non negatività, conservazione e una metrica minima di non commutatività.

**Attenzione:** non usare solo i conteggi (V,E,F) come firma: poliedri non isomorfi possono condividerli. Lo studio dei flag graphs e delle mappe orientate offre un apparato più completo: https://www.mdpi.com/2073-8994/9/11/274 ; https://github.com/elfnor/conway_polyhedron_operators/blob/master/code_notes.md

---

# 4. Accumulatori e convertitori possono convivere: un solo ledger

Definire:
- \(W\) = ENERGY **spendibile dal giocatore** (unica valuta).
- \(R\) = energia di una sorgente **ambientale fisica finita**, non spendibile direttamente.
- \(U_i\) = potenziale energetico **immagazzinato nel Polytrone i**, legato alle sue trasformazioni; non è wallet.
- \(B\) = energia in volo nei fasci.
- \(Q\) = energia già dissipata / uscita, tracciata nel bilancio ma non recuperabile nell'esperimento.

In un esperimento chiuso, \(W+R+\sum_i U_i+B+Q\) deve restare costante (salvo importazioni/esportazioni contabilizzate). Un turno può convertire quantità tra questi conti.

**A — Accumulatore**: investo \(I\) dal wallet, un individuo perde \(\Delta U>0\) semplificando il DNA, raccolgo \(C\) all'Architron, dissipazione \(L\).
\[
I+\Delta U=C+L.
\]
Esempio: I=3, ΔU=4, C=6, L=1; wallet parte da 10 e finisce 13, individuo passa da U=4 a U=0.

**B — Convertitore**: stessa iniezione \(I=3\), campo fornisce \(\Delta R=6\), nessuna diminuzione di U; raccolta C=6 e dissipazione L=3. Wallet 10→13, R 6→0. Il Polytrone mantiene la propria forma: è una antenna/convertitore che cattura ciò che era già nel campo.

**C — Ibrido**: I=3, ΔR=6, ΔU=4, raccolta C=10, L=3; wallet 10→17, R 6→0, U 4→0. Il rendimento complessivo è compatibile con la conservazione, senza inventare ENERGY.

**Obiezione fondamentale:** la soglia per turno \(I\le3\) limita soltanto la portata, non impedisce un *ciclo positivo* se il sistema/ambiente tornano identici e la ricompensa wallet cresce. Al secondo turno i serbatoi R/U sono esauriti; con solo I=3 si può recuperare al massimo 3 prima delle perdite.

### La qualità vera della batteria
**Non** scegliere \(U_i\propto\) numero di facce o "bellezza". L'idea estetica che poliedri complessi siano carichi può orientare il gusto, ma la definizione deve essere una **funzione di stato** ben precisa \(U(\mathrm{DNA},\mathrm{configurazione},\mathrm{stato~interno})\).

Se una trasformazione \(P\to P'\) cambia l'energia interna di \(\Delta U=U(P')-U(P)\):
- caricare \(P\to P'\) con \(\Delta U>0\) deve richiedere almeno \(\Delta U\) di lavoro disponibile;
- scaricare \(P'\to P\) con \(\Delta U<0\) non può fornire più di \(-\Delta U\) in un sistema isolato;
- il bilancio include attrito/perdita in entrambe le direzioni.

Questo impedisce l'exploit fusion↔fission. Se la stessa ricetta DNA può avere stati diversi di carica, servono \`storedEnergy\` e \`dna\` **separati**; allora geometria e carica non sono univocamente determinate l'una dall'altra. Il gioco deve scegliere fra:
1. **U intrinseco della forma:** cambiare ricetta è la sola via di carica/scarica;
2. **U della forma + stato carica:** ricaricare può lasciare la geometria invariata (batteria convenzionale). Maggiore flessibilità, ma più variabili.
**Prima prova suggerita:** U intrinseco e modifica visibile della ricetta, per mantenere l'alchimia e il "wow".

### Test formale dei cicli
Rappresentare le azioni possibili come archi in un grafo finito degli stati: \((s\to t,g)\), con \`g\` incremento netto del wallet. In un sistema isolato, se gli stati comprendono **tutte le riserve**, non devono esistere cicli con somma dei guadagni \(>0\). Un potenziale conservativo \(U(s)\) aiuta a imporre vincoli \`g ≤ U(s)−U(t)\` per ogni arco, a meno di risorse esterne esplicitamente contabilizzate. Con sorgenti esterne, esse devono essere coordinate dello stato; un giro che ne consuma non è un vero ciclo.

Matematicamente: sui grafi finiti, l'assenza di cicli a peso positivo è collegata alla fattibilità di un insieme di vincoli di potenziale (differenza). Questo si può verificare con Bellman–Ford su pesi trasformati o solver SMT. È quindi possibile **scartare meccaniche produttrici di energia infinita prima di provare il gioco**.

---

# 5. Cubo di Metatron, poliedri annidati, piano continuo

L'immagine del Cubo di Metatron è interessante come **proiezione/incidenza di figure nello stesso piano**, con una struttura di simmetrie radiali; i cinque poliedri sono figure 3D e non richiedono che ogni raggio segua la griglia esagonale.

Distinguere:
- celle esagonali discretizzano i **centri/posizioni** dei Polytroni in fase cristallizzata;
- geometria delle facce e normali vive in **3D**;
- i fasci vivono in un **piano 2D continuo** (angoli arbitrari), eventualmente con un grado di orientazione derivato dalla mesh 3D;
- la fase fluida rimane spostamento libero dei corpi, non quantizzazione forzata di ogni coordinata.

Storicamente i solidi platonici sono legati alla tradizione pitagorica/platonica; la loro *annidazione fra sfere* fu inoltre proposta esplicitamente da Keplero in **Mysterium Cosmographicum** (1596) come modello cosmologico poi abbandonato. Questo è un precedente iconografico preciso, non una dimostrazione alchemica o fisica del reattore.
Fonti: https://plato.stanford.edu/entries/kepler/ ; https://www.aps.org/apsnews/2014/06/keplers-insight-to-mysterium-cosmographicum

**Equivarianza del caleidoscopio:** se una configurazione radiale e una sorgente vengono ruotate insieme di \(\phi\), il risultato geometrico dovrebbe ruotare di \(\phi\) senza cambiare arbitrariamente il bilancio. La simmetria *del risultato* emergerà dalle leggi, non da un moltiplicatore energetico applicato alle figure belle.

---

# 6. Banco di prova eseguibile

File: \`research/conway_energy_model.mjs\` — eseguibile con \`node research/conway_energy_model.mjs\`.

Verifica:
1. \(D^2=I\).
2. \(AD=A\).
3. \(DA\ne AD\) e \(A^2\ne A\).
4. Non negatività, somma delle colonne =1, conservazione dell'energia in ingresso anche per composizioni.
5. Tre esempi con contabilità per batteria, convertitore e ibrido.
6. Seconda scarica dopo aver esaurito le fonti: il wallet non cresce senza risorse esterne.

**NON verifica:** validità rispetto a tutte le operazioni Conway, qualità dell'estetica, generazione di pattern radialmente simmetrici, definizione futura di \(U(\mathrm{DNA})\), caso di più porti geometrici, collisioni o AI del giocatore.

Per prove successive:
- calcolo formale con SymPy sui razionali;
- script che genera tutte le ricette d,a fino a 4 operatori applicate a T,C e confronta equivalenza canonica della mesh con equivalenza delle matrici;
- enumerazione algoritmica di rappresentazioni con tre/quattro canali e coefficienti razionali piccoli tramite solver;
- generazione di **traiettorie continue** con leggi di scattering e verifiche di simmetria;
- test energetici di cicli fusion/fission su un grafo limitato.

---

# 7. Tre esperimenti ludici, tenuti separati e poi insieme

**P0 — Accumulatore**
- Fonte ambientale R=0. Il Polytrone iniziale è carico.
- Rilascio di energia e **cambiamento visibile della geometria**; raccolta centrale all'Architron.
- Il puzzle riguarda *quale individuo scaricare, quando, e quali stati geometrici residui ottenere*. Deve essere possibile ricostruirlo solo a costo ≥ energia recuperata + perdite.

**P1 — Convertitore**
- Nessuna scarica di U. Un numero finito di impulsi attraversa il sistema radiale e interagisce con le geometrie (preferibilmente senza attraversare una fila di pezzi).
- Ogni Polytrone devia/redistribuisce/assorbe in base ai canali e alla forma, non si consuma.
- Vince l'esperimento con più energia raccolta a parità di input/sorgente, non la sintesi di un DNA prescritta.

**P2 — Ibrido**
- Gli stessi individui comprendono almeno un accumulatore e un convertitore.
- La scarica locale altera un fascio che viene a sua volta manipolato da un altro Polytrone; un'esplosione controllata può diventare una figura radiale altamente sorprendente.
- **Test di necessità:** esiste almeno una configurazione che nessuna soluzione con sole batterie o soli convertitori può raggiungere con lo stesso bilancio e limite di individui?
- **Test di economia:** somma ENERGY wallet+reservoir+potenziale+perdite conservata entro epsilon. Nessun ciclo di ricarica gratuito.

**Nessun nuovo prototipo visivo** in questa sessione: prima una rappresentazione coerente, poi benchmark visivi di 2–3 ricette e 3–6 corpi.

---

# 8. Decisioni e stato

| Decisione | Stato |
|---|---|
| Accumulatori e convertitori convivono | **Accolta come direzione** |
| Tre modelli P0/P1/P2 testati separatamente | **Banco di prova di ledger disponibile** |
| Tutte le trasformazioni Conway hanno già una matrice corretta | **NO — non dimostrato** |
| Rappresentazione \(d,a\) su tre canali con proprietà selezionate | **Costruita, test matematico disponibile** |
| Stato solo due canali con D swap e AD=A distingue a ed e | **NO-GO dimostrato sotto le ipotesi** |
| Complessità visiva è direttamente energia potenziale | **NO — servono funzione di stato e bilanci** |
| Metatron / Keplero come precedenti geometrici | **Riferimenti estetici e storici** |
| Fasi cristallo/fluido più fasci su piano continuo | **Compatibili matematicamente** |
| Nessuna proliferazione immediata delle meccaniche nel gioco | **Mantenuta** |

## Raccomandazione
**Non chiediamo al game designer di inventare un'algebra a intuito.** Procediamo con due studi formali paralleli:
- **Rappresentazione minima:** trovare matrici piccole non commutative che preservino identità e conservazione, poi calcolare pattern.
- **Scattering geometricamente derivato:** calcolare la trasformazione di un fascio dalle caratteristiche effettive della mesh con invarianti e simmetrie.

Il core candidato nasce dall'intersezione: **formalmente consistente, leggibile nella geometria, bello da osservare, e capace di decisioni strategiche**. Questo è un criterio molto più stringente di “fa cose spettacolari”.
