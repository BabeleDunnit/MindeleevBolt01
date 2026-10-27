# Mindeleev — Sessione 13: dalle forme alle proprietà
## Primo laboratorio matematico-visivo del fenotipo polytronico

**Data:** 27 ottobre 2026  
**Branch:** \`experiments/sprint13-phenotype-geometry-lab\`, derivato da \`research/session12-formal-energy-algebra\`, mantenendo tutte le precedenti ricerche e il gameplay dello Sprint 09.  
**Scopo:** studiare *ciò che è vero o misurabile sul poliedro risultante*, prima di attribuire funzioni ludiche alle lettere Conway o assegnare ENERGY.  
**Output:** React/Three.js sperimentale, modulo TypeScript puro di metriche, test eseguibili CI, esportazione CSV; nessuna nuova economia, nessun game design, nessuna modifica del motore spring-mass.  
**Ingresso web previsto:** \`https://babeledunnit.github.io/MindeleevBolt01/?experiment=phenotype\` una volta riuscito il deploy Pages.

# 1. Rovesciamento metodologico: fenotipo prima del genotipo

La domanda non è più "quanto vale il poliedro \`ak05D\` sulla base di un punteggio assegnato a \`a\`, \`k\`, \`D\` e \`05\`?", bensì:

1. Ricostruisci il poliedro esplicito \`P=\{V,F\}\` dal DNA mediante polyhedronisme.
2. Misura invarianti **combinatori** del solido, invarianti **metrici** della sua realizzazione numerica e proprietà **direzionali** (relative a una posa/orientazione).
3. Chiediti quali misure sono leggibili nel rendering e quali potrebbero causare, tramite una legge fisico-ludica semplice, effetti di scattering, trasporto o immagazzinamento.
4. Solo successivamente si torna ai nomi degli operatori per verificare se la legge risultante rispetta equivalenze di Conway o può essere espressa come loro rappresentazione.

Il DNA può continuare a dire **come costruire** la geometria; il fenotipo dice **che cosa può fare**. È la tua analogia con l'occhio del gatto, con un'importante cautela: non ogni caratteristica estetica è un potere funzionale, e una misura matematica non è già una legge di natura.

# 2. Audit delle funzioni preesistenti

## MindeleevSpatial, develop — PolyhedronRecipeUtils.cs

La vecchia funzione \`ComputeComplexity(PolyhedronRecipe recipe)\` somma fattori:
- operatori: d=1, a=1.1, k=1.2, t=1.5, n=1.7, l=2;
- semi: T=1, C=1.1, O=1.2, D=1.3, I=1.4;
- palette: contributo per indice 01→2.0, 10→1.0;
- lunghezza catena: \`0.2 * (#token)^2\`;
- grandezza dei parametri: ulteriori coefficienti;
- complessità "visuale": \`0.03 V + 0.05 F + 0.01 #classi-di-colore\`.

Questa è una **funzione di scoring di progetto**, non un potenziale energetico definito fisicamente e neppure una misura intrinseca della geometria:
- due ricette che generano la stessa geometria potrebbero avere punteggi differenti;
- il numero di operatori può crescere senza aumentare in pari misura la diversità strutturale;
- l'indice di palette cambia il punteggio anche quando la mesh rimane identica;
- un cubo più grande e uno più piccolo possono avere lo stesso V/E/F ma aree e volumi differenti;
- V e F premiati monotonamente fanno apparire ogni aumento del numero di facce come aumento di complessità, senza dimostrare una maggiore utilità.

Questa critica non invalida gli esperimenti precedenti: ci dice **esattamente cosa il nuovo laboratorio deve evitare**.

## Polytron, PolytronName, MindeleevTable
Le vecchie identità permanenti (72 individui) e le emanazioni sono compatibili col nuovo approccio: un individuo resta la stessa persona geometrica quando il suo fenotipo cambia; ma questa ricerca analizza inizialmente **forme**, non identità personali.

## Polyhedronisme e codice attuale Bolt
\`src/polyhedronisme/polyhedronisme.ts\` fornisce effettivamente \`vertices: Vec3[]\`, \`faces: number[][]\`, \`faceClasses\`, \`edgesOf(poly)\`, e una normalizzazione geometrica. \`src/polytron/polytron.ts\` usa \`dnaToPoly\` per generare la forma ed elimina la porzione di palette prima di chiamare il generatore.

**Importante:** il motore attuale può scegliere realizzazioni approssimate/numericamente non canoniche per alcune ricette; le proprietà metriche dipendono da **quella** realizzazione, oltre che dalla topologia. La normalizzazione del raggio non rende confrontabili come "energia reale" i volumi di oggetti differenti.

# 3. Nuovo modulo di analisi: proprietà ben distinte

Sorgente: \`src/experiments/phenotypeMetrics.ts\`.

## 3.1 Topologia e struttura combinatoria
Dalla lista di vertici e facce, **senza esaminare le lettere del DNA**, calcoliamo:
- numero di vertici V;
- spigoli E identificati come coppie non ordinate di vertici adiacenti su una faccia;
- facce F;
- caratteristica di Eulero \(\chi=V-E+F\);
- incidenza faccia–spigolo: per una mesh poliedrica chiusa ogni spigolo ha due facce incidenti;
- distribuzione di poligoni con n lati;
- valenza dei vertici (numero di archi incidenti);
- firma euristica dei due istogrammi insieme a V/E/F.

**ATTENZIONE:** stessa firma non implica isomorfismo di grafi; grafi poliedrici diversi possono condividere V/E/F, distribuzioni di facce, valenze e talvolta spettro.

## 3.2 Misure metriche
- coordinate e normali orientate di ogni faccia, mediante somma di prodotti vettoriali;
- area della faccia da vettore areale;
- area totale, volume orientato stimato;
- lunghezza media degli spigoli e coefficiente di variazione (CV);
- coefficiente di variazione delle aree delle facce;
- autovalori della matrice dei secondi momenti **della nube dei vertici**, non del corpo solido continuo.

CV area = 0 indica facce equi-areali, non bellezza: ad esempio nessun risultato matematico dice che un solido con CV più basso sia visivamente più desiderabile. Un'area grandissima dipende anche dalla normalizzazione; non è ENERGY.

## 3.3 Spettro del grafo dei vertici
Per mesh con non più di 90 vertici, calcoliamo i primi 12 autovalori del **Laplaciano normalizzato del grafo non pesato**:

\[
L = I - D^{-1/2} A D^{-1/2}
\]

dove \(A\) indica l'adiacenza, \(D\) la diagonale dei gradi. Usiamo una diagonalizzazione numerica simmetrica Jacobi con sweep ciclici.

Questo spettro è invariante sotto **rinumerazione dei vertici**, codifica parte delle proprietà di connessione, e può essere una firma per confronti. Ma **NON è** lo *Shape-DNA* di Reuter/Wolter/Peinecke: quello studia lo spettro Laplace–Beltrami delle superfici e dei solidi, non un Laplaciano di grafi di adiacenza arbitrari.

Riferimento reale: Martin Reuter, Franz-Erich Wolter, Niklas Peinecke, "Laplace–Beltrami spectra as Shape-DNA of surfaces and solids", CAD 38(4), 2006. https://doi.org/10.1016/j.cad.2005.10.011 .

Una futura versione dovrebbe implementare un Laplaciano *cotangente* sulla mesh triangolata o un operatore di Laplace–Beltrami agli elementi finiti, distinguendo correttamente degenerazioni e triangolazioni di facce non planari. Non mescolare oggi i due spettri.

# 4. Prima ipotesi di campo: scattering angolare dalle normali

Vogliamo verificare che un poliedro diverso produca **un pattern energetico diverso** e che l'utente possa intuirlo visivamente senza leggere un codice.

Una sola forma P posta all'origine. Il campo trasporta un fascio di intensità totale 1 e direzione in piano \(\mathbf u=(\cos \theta,\sin\theta)\). Ogni faccia f ha area \(A_f\), normale unitaria 3D \(\mathbf n_f\), una proiezione della normale nel piano XY con intensità \(p_f=\sqrt{n_x^2+n_y^2}\), e normale planare unitaria \(\hat{\mathbf n}_f\).

Per una faccia esposta al fascio:
\[
w_f=A_f\,p_f\max(0,-\mathbf u\cdot \hat{\mathbf n}_f).
\]
La direzione candidata riflessa è:
\[
\mathbf r_f=\mathbf u-2(\mathbf u\cdot\hat{\mathbf n}_f)\hat{\mathbf n}_f.
\]

Distribuiamo \(w_f\) in 72 settori angolari adiacenti (interpolazione lineare) e normalizziamo la somma a **una unità**. La rotazione del solido attorno a Z ruota le normali prima del calcolo. Un diagramma polare mostra la distribuzione \(h_P(\theta)\).

**È una legge inventata e dichiarata, non un modello realistico di ottica elettromagnetica:** non applica la geometria delle intersezioni dei raggi con un corpo opaco, trascura interferenze/fase/polarizzazione, non distingue esternamente la vera illuminazione di facce nascoste, e redistribuisce tutta l'energia senza assorbimento. Le intensità normalizzate sono una *sonda geometrica*, non una misura sperimentale di riflettività.

Vantaggi:
1. Usare soltanto aree e normali effettive: nessun token Conway viene interrogato.
2. Essere sensibile a forma, orientazione e angolo di incidenza.
3. Conservare esattamente nel modello la quantità totale: \(E_\text{out}=E_\text{in}=1\), nessuna ENERGY guadagnata.
4. Produrre un "fiore" polare e confronti sovrapposti, dunque un'evidenza grafica utile anche quando il risultato è deludente.
5. Essere riproducibile e verificabile in test automatici.

Limite metodologico: \(\mathbf r_f\) nasce da una formula di riflessione speculare ma su normali **proiettate** e applicate come *mix di tutte le facce*, non come fisica delle superfici realmente colpite. Se il pattern appare arbitrario o simile per troppi solidi, non si può salvarlo alzando saturazione grafica: bisogna cambiare il modello.

# 5. Interfaccia di ricerca

Pagina Vite: \`?experiment=phenotype\`.
- Selettori forma A e B: semi T/C/O/D/I e trasformazioni \`d,a,aa,ad,da,k,t,g\` in combinazioni moderate.
- Viewer 3D costruito con il vero renderer Polytron/Three.js, non immagini sostitutive.
- Diagramma polare di scattering con confronto A/B; sliders per incidenza e orientamento attorno a Z.
- Bilancio 1 in / 1 out, assorbimento 0 esplicito.
- V/E/F/chi, face histogram, valence histogram, variazione spigoli/facce, area, volume stimato e momenti.
- Spettro del grafo **su richiesta**, con etichetta inequivocabile.
- Atlante multi-forma tabellare e **esportazione CSV** dei descrittori per analisi esterne.
- Tutto questo funziona senza la fase fluida, senza ENERGY, senza missioni, senza nuovi tool di gioco.

### Nota sui colori
Lo stesso solido \`aC\` e \`a05C\` deve mostrare identiche proprietà **geometriche** e identica risposta di dispersione. In questa ricerca il colore non entra nella fisica: potremo aggiungere **in seguito** una legge cromatica distinta, senza falsificare una somiglianza di geometria.

# 6. Test eseguibili

Script \`scripts/check-phenotype.mjs\`; eseguito dalla workflow GitHub Actions:
- Identità Platonic per T/C/O/D/I: conteggi noti \(V,E,F\) e \(\chi=2\).
- Spigoli condivisi da esattamente due facce per i cinque semi.
- Area, lunghezze e volume positivo per i semi, dentro la normalizzazione.
- Primo autovalore vicino a zero nei cinque grafi connessi.
- Chiusa/Euler e facce non degeneri per alcune ricette \`aC, aaC, adC, daC, kC, tC, aT, kD\`.
- Poliedro aC con V=12, E=24, F=14 (cuboctaedro).
- dC e O condividono descrittore combinatorio.
- Conservazione e non negatività angolare per molte incidenze e orientazioni.
- Identità di comportamento fra aC e a05C.
- Periodicità di 360°.

Questi sono **test numerici e strutturali**, non validazione empirica di ottica, simulazione dinamica, isomorfismo canonico o utilità ludica.

# 7. Cinque ulteriori domande matematiche per la Sessione 14

1. **Quali geometrie con stesso \(V,E,F\) hanno effetti diversi?** Ricerca di collisioni nei descrittori e del motivo: distinzione fra complessità combinatoria e metrica.
2. **Quanto distingue lo spettro discreto?** Confrontare distribuzioni di autovalori e classi di equivalenza, includendo casi cospectral e l'effetto della triangolazione.
3. **Quali invarianti possono produrre una "risposta energetica" senza arbitrarietà?** Testare scattering per superficie, per normali, per valenze/porte, per angoli diedri, per coordinazione; gli *stessi* input energetici su diverse forme.
4. **Come studiare le simmetrie?** Riconoscimento numerico di gruppi di simmetria, rotazioni/reflection, signature di forma; fare test di equivarianza tra pattern ruotati. Cautela: simmetrie 3D T/O/I ≠ D6 del reticolo 2D.
5. **Possiamo definire un potenziale geometrico U(P)?** Prima una funzione di stato con test di invarianza a permutazione e collassi del DNA; poi vincoli energetici per trasformazioni cicliche; infine il suo legame con batterie e convertitori.

La progressione sperimentale non deve essere una lista di nuove abilità, ma una successione di **ipotesi falsificabili**.

# 8. Verdetto provvisorio e incertezze esplicite

Il nuovo laboratorio ha finalmente una proprietà fondamentale: **il DNA può essere sostituito da una mesh prodotta in altro modo e tutte le misure continuerebbero ad avere senso**. È la condizione più importante per trattare le forme come oggetti geometrici e non icone con poteri fissi.

Non abbiamo però ancora scoperto una legge di conservazione autentica del mondo dei Polytroni, né una metrica convincente di bellezza e complessità visiva, né uno spettro di superficie, né una legge di scattering fisicamente attendibile. Abbiamo costruito gli strumenti per cominciare a cercarle.

**Priorità prossima:** analisi sistematica di centinaia di forme, classi di equivalenza/collisioni della firma, una misura di simmetria orientazionale e il confronto di **almeno due modelli diversi di scattering** per capire quali differenze derivano davvero dalla geometria e quali dalla legge inventata.

Teniamo Reactor Zero, ENERGY, Architron, la popolazione di 72 individui e Tonnetz nel backlog: la prossima scelta matematica dovrà saperli alimentare, non dipendere da essi.
