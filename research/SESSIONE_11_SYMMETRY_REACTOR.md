# Mindeleev — Sessione 11: Reactor Zero / Symmetry Reactor
## Algebra energetica, Architron, flussi radiali, identità dei 72 Polytroni, fase fluida e meraviglia

**Data:** 27 ottobre 2026  
**Scopo:** ulteriore round di co-design PRIMA di una nuova implementazione.  
**Base:** Sessione 10 e sorgenti MindeleevSpatial, branch develop.  
**Metodo:** cinque prospettive di esperti **simulate** dall'assistente: PA = Architetto del Puzzle; SE = Progettista di Sistemi Emergenti; GC = Genetista e collezione; PG = Psicologia del giocatore; FE = Fisico e matematico. Sono ruoli critici simulati, non consulenti umani o agenti autonomi realmente convocati. Le decisioni sono ipotesi; nessun playtest di questa proposta è stato eseguito.
**Repository:** BabeleDunnit/MindeleevBolt01; questo è un documento di ricerca, senza modifica del gameplay pubblicato.

---

# 1. Correzione di rotta rispetto alla Sessione 10

La Sessione 10 aveva scelto la generazione/trasformazione di ENERGY come scopo, con Polytroni componenti funzionali, board cristallino e sorgenti finite. Ma il flusso era immaginato soprattutto lungo una catena di conduzione, vicino a Pipe Mania o shapez.io.

L'autore propone una revisione:
- Reattore **radiale, centrale, prevalentemente simmetrico**, con fasci emessi/devìati/scissi/trasformati; metafore Black Box, caleidoscopio, E8 visivo, elementi di tower defense e Lemmings senza pressione di riflessi.
- Architron (esistente in Unity/Spatial) come possibile centro di raccolta.
- Sei/fino a 72 Polytroni come individui persistenti nominati, con DNA trasformabile, non torrette sostituibili all'infinito.
- Cinque semi (T/C/O/D/I), dieci palette attuali, forse combinazioni discrete di due colori con gradiente interpolato, e composizioni non commutative degli operatori di Conway.
- Ogni famiglia di geni deve incidere causalmente sull'energia; le trasformazioni possono agire sui raggi che attraversano o si avvicinano al poliedro; alcuni oggetti possono emettere.
- Energia del giocatore unica valuta; ogni turno consente un investimento finito e massimo. Vuole guadagni possibili, ma evitare produzione illimitata.
- Poliedri complessi possono immagazzinare potenziale rilasciato tornando a forme semplici: ipotesi di dinamica reversibile/conservativa da verificare.
- La fase fluida potrebbe essere **una mossa azionabile quando serve** per rilassare il sistema, anziché metà fissa di un loop di gioco.
- Geometrie e distanze preferite devono potersi riorganizzare in simmetrie più evocative della semplice affinità cromatica/seme, ma questo resta un REMINDER, non la priorità di questa sessione.
- Rubik State Graph di Nathaniel Cherian, Tonnetz e musica sono riferimenti da registrare e rivalutare.

**Nuova tesi di lavoro:** il cristallo è un **campo di scattering e risonanza**, non una rete di tubi o una catena di montaggio; lo stato fluido è una possibile operazione sul campo; l'Architron è il riferimento energetico centrale.

---

# 2. Verifiche sul codice precedente (MindeleevSpatial, develop)

Non sono ricordi interpretati: i sorgenti accessibili attestano:
- MutatronEngine.cs: maxRings = 12, lista dei 72 Polytroni, centro del Mutatron, architronIdx = 70 (indice 0-based, quindi individuo 71 nell'elenco); architron che può seguire l'avatar o tornare al centro.
- PolytronsFactory.cs: ogni Polytrone riceve sealNumber progressivo, errore esplicito per sealNumber >= 72, sealName derivato da PolytronName.GetName(sealNumber+1).
- PolytronName.cs: tabella di 72 coppie Angel/Demon con date; generatore di un nome sintetico unico tramite frammenti dei due nomi, non semplice display di angel/demon.
- Polytron.cs: sealNumber, sealName, isArchitron, boundSink, MindeleevTable per emanations delle ricette già raccolte.
- PolytronState.cs: ruoli Normal/Architron/ArchitronGenetic/GeneticFriend, location MutatronCenter e FollowingAvatar.
- GeneticsManager.cs: presenta logica di parent, amici genetici, preview/trasformazioni dell'Architron e manipolazione temporanea della sua ricetta.
- PolyhedronRecipeAlgebra.cs: algebra ludica *pseudo-algebrica* distinta dagli operatori Conway; dispone di tabelle di fusione per operatori e semi, tabelle di split, compone le ricette per colonne.
- PolyhedronRecipeKabbalah.cs: fusione alternativa via codifica simbolica in base sei e media dei valori del seme (d,a,k,t,n,l).
- MindeleevTable.cs: struttura di collezione di emanazioni, NON semplice array di oggetti anonimi.

**Rischio concettuale:** non chiamare la tabella arbitraria OperatorSumTable o la somma base-sei “algebra degli operatori Conway”. Sono un'invenzione ludica separata. La COMPOSIZIONE di Conway è un'altra operazione e ha precise identità matematiche.

**Risultato progettuale:** conservare (a) il numero finito di identità e (b) i nomi permanenti indipendenti dal DNA; un individuo può cambiare famiglia, palette e ricetta senza perdere la propria biografia. La genealogia di fusione/fissione deve definire in modo coerente se una fusione assorbe temporaneamente un individuo, lo rende dormiente o ne consuma irreversibilmente l'identità. **Per il MVP scegliere fusione con uno dei due individui in stato “dormiente/legato”, recuperabile mediante fissione**, oppure sospendere la biologia identitaria finché il sistema non lo supporta; mai generare senza limite nuove identità in un mondo con massimo 72.

---

# 3. Riferimenti rilevanti e limiti

## Shapez (repo tobspr-games/shapez.io)
Operazioni cutting, rotation, merging, painting sulla forma trasportata; catene producibili. La lezione utile è **una grammatica di trasformazioni semplici che, componendosi, produce complessità**. Non imitare belts e crescita industriale: Mindeleev richiede geometria radiale e individui non anonimi.
Fonte: https://github.com/tobspr-games/shapez.io

## Conway, George Hart
I prefissi denotano composizione di operazioni su poliedri; l'operazione interna avviene prima (taC = t(a(C))), in generale non commutativa. Identità fondamentali: d² = identità topologica, a² = expand e; dC = O; alcune ricette differenti portano alla stessa forma. Una rappresentazione con matrici 3×3 agisce sui conteggi (V,E,F); i prodotti matriciali compongono i cambiamenti, ma la rappresentazione non è fedele (diverse operazioni possono dare gli stessi conteggi).
Fonti: https://georgehart.com/conway/notation.html ; https://en.wikipedia.org/wiki/Conway_polyhedron_notation

## Black Box
Proposta **di gameplay ispirata all'idea di inferenza con raggi**, non al sistema completo di Black Box. Permettere al giocatore di conoscere/ricostruire regole e anticipare pattern radiali; non nascondere tutte le interazioni rendendole casuali.

## E8 e “An Exceptionally Simple Theory of Everything”
Usarlo come **riferimento estetico per proiezioni, simmetrie, traiettorie e reti luminose**, non come garanzia che i nostri Polytroni descrivano davvero le simmetrie delle particelle. Il preprint di Lisi del 2007 è un'ipotesi controversa, non una teoria fisica confermata.
Fonti: https://arxiv.org/abs/0711.0770 ; https://www.scientificamerican.com/article/garrett-lisi-e8-theory/

## Rubik’s Cube State Graph (Nathaniel Cherian)
Tre viste complementari dello stesso stato: cubo 3D, grafo planare con 54 stickers / 9 rings e **grafo degli stati raggiungibili**. Insight: la stessa configurazione può essere descritta come figura, come disposizione di elementi e come *nodo di un grafo di possibili trasformazioni*. Potremmo offrire a Mindeleev una *mappa delle trasformazioni raggiungibili*, non solo una collezione.
Fonte: https://nathanielc.com/sketches/rubiks-state-graph/

## Tonnetz
Reticolo di classi di altezza; triangoli come accordi; trasformazioni neo-riemanniane P/L/R come salti fra triadi adiacenti. La somiglianza con il Mutatron esagonale è interessante, ma **una griglia esagonale non basta a rendere due algebre isomorfe**. Registrare per futuri studi su sonificazione e feedback musicale, non incorporare ancora accordi e scale nel motore.
Fonti: https://en.wikipedia.org/wiki/Tonnetz ; https://pressbooks.nebraska.edu/openmusictheory/chapter/neo-riemannian-triadic-progressions/ ; https://kaleidophonon.com/en/tools/neo-riemannian/

---

# 4. Round A — È davvero possibile un'algebra energetica di Conway?

### PA: “Se ogni operatore ha un potere suo, chi impara il gioco?”
Vuole al massimo due/tre operatori attivi nell'MVP; ogni trasformazione visiva deve essere accompagnata da una preview che mostra direzione, intensità e colore dei raggi previsti. Un DNA più lungo non deve essere sempre migliore.

### GC: “DNA = operatore causale, non nome di un upgrade”
Tre famiglie differenziate: seme impone struttura di scattering (porte/simmetria), cromia impone canale energetico, sequenza Conway impone trasformazioni composte. Preferire regole formali agli effetti ad hoc; recuperare la forte identità dei 72 individui.

### FE: “Stiamo per confondere DUE algebre”
1. L'**algebra geometrica** degli operatori Conway: composizioni (parziali) di endomappe su una classe di poliedri; struttura di monoide di trasformazioni parziali (con cautele su validità e canonicalizzazione), NON gruppo generale, non commutativa.
2. L'**algebra di fusione fra individui**: può essere non associativa, stocastica, a tabelle, dipendere dai genitori. Non deriva automaticamente da Conway.
3. L'**algebra energetica** da inventare: trasformazioni di vettori di intensità per canale, direzione e fase, eventualmente dipendenti da geometria del poliedro e orientamento nello spazio.

La domanda matematica è costruire una rappresentazione \(\rho\) della prima nella terza: se due ricette descrivono la stessa trasformazione geometrica, le loro azioni energetiche dovrebbero rispettarne le identità **se vogliamo che funzione e geometria coincidano**. Altrimenti chiamare il risultato “algebra di DNA” autonoma, e comunicarne la differenza.

### SE: “Un sistema visivo può nascere da matrici semplici”
Mostra come un solo gene di dualità potrebbe scambiare due canali \(T_d\) con \(T_d^2=I\); un altro potrebbe ripartire un fascio in due direzioni (ognuna con metà intensità); la composizione può essere non commutativa e generare effetti sorprendenti. Ma tutta la complessità dovrebbe essere nel prodotto, non in decine di regole eccezionali.

### PG: “Prima imparo a distinguere, poi anticipo, poi invento”
I primi puzzle devono rendere evidente almeno un paio di regole. Nessuna matrice visibile di default: due/tre esiti luminosi, frecce fantasma, feedback immediato.

**Dissenso sostanziale:** FE è favorevole a formalizzare \(\rho\); SE propende per effetti derivati interamente dalla mesh geometrica (normali di faccia/valenze) e non dal token stesso. GC teme che due DNA diversi ma con mesh equivalente possano avere effetti diversi senza alcuna causa visibile.

**Tre architetture possibili:**
- **A1 — Token come skill:** d = cambia colore, a = raddoppia il raggio, k = devia. Molto comprensibile, ma finge una corrispondenza geometrica e rischia violazioni delle identità (dd diverso da identità).
- **A2 — Solo geometria finale:** calcolare scattering/resonance dalla mesh (normali delle facce, distribuzione delle valenze, simmetrie, orientamento). Matematicamente più motivato, ma difficile per il giocatore da anticipare.
- **A3 — Rappresentazione coerente + descrittori mesh (preferita per ricerca):** operazioni energetiche elementari con identità rispettate; pochi parametri determinati dal seme/geometria. Il giocatore vede il comportamento macroscopico attraverso preview.

**Esempio matematico non fisico:** per intensità \(q=(R,G,B)\), \(T_d\) scambia R/G; \(T_a\) divide una quantità in due canali senza aumentarne la somma. Le composizioni \(T_dT_a\) e \(T_aT_d\) possono differire. Se la geometria impone \(d^2=1\), anche \(T_d^2=I\). Se \(aa=e\), occorre \(T_a^2=T_e\) (e può richiedere definire e).
**Test obbligatori:** unit test delle relazioni note; funzioni totali o definite sul corretto dominio; no output energetico maggiore dell'input salvo sorgente interna/ambientale debitamente contabilizzata.

**Verdetto A:** esplorare *composizione non commutativa che produce spettacolo*, ma nessuna assegnazione arbitraria di poteri su tutte le lettere. Primo test con due operatori, due modalità di energia, non più di due semi.

---

# 5. Round B — Quale ruolo hanno i cinque semi e i colori?

### Mappatura provvisoria delle tre famiglie
- **Seme / poliedro T/C/O/D/I:** *come* l'energia interagisce con lo spazio. Per esempio, simmetria e possibili direzioni di emissione o risonanza derivabili dalla struttura (facce, valenze, proprietà geometriche), non livelli di potenza predefiniti.
- **Colore / palette:** *quale canale energetico* la forma risponde o trasferisce. Tenere **palette discrete**. Il gradiente fra due colori è fenotipo visuale interpolato, non un'energia continuamente regolabile in modo arbitrario.
- **Operatori Conway:** *quali trasformazioni si compongono* su uno stato di energia e sulla geometria; ordine importantissimo e leggibile.

**Dieci palette attuali** non significano necessariamente dieci canali energetici fondamentali. L'idea di una coppia ordinata (colore primario, colore secondario) scelta da una palette finita di 10 capi produce fino a 100 combinazioni ordinate, o 55 se l'ordine non conta; sono GENOTIPI cromatici, non 100 nuove leggi fisiche. Migrare i codec con versionamento e senza rompere i DNA esistenti. Nello Sprint Zero ridurre drasticamente a due canali.

### Vincolo geometrico sottovalutato
Una griglia esagonale regolare supporta simmetrie planari di ordine 6 (rotazioni da 60°) e sottogruppi di ordine 2 e 3. Non possiede, in generale, simmetrie discrete esatte di ordine 4 (90°) o 5 (72°): cubo/ottaedro e dodecaedro/icosaedro non possono *proiettare* tutte le loro simmetrie di rotazione sui sei assi di una griglia esagonale senza perdita.
**Scelta:** la griglia può discretizzare *le posizioni dei centri*, ma i raggi possono muoversi in **un piano continuo** con angoli indipendenti dai lati delle celle. Alternativamente accettare una rappresentazione volutamente lossy (2/3/6 directions). Non associare ingenuamente "icosaedro = cinque raggi a 72°" se lo snap hex obbliga sei direzioni.
Per un primo test: uno schema a sei settori garantisce un fenomeno D6 (ciclo C6 + riflessioni) leggibile, con un Architron al centro.

### La luce reale non funziona così
E = hν per fotone, quindi un fotone blu/violetto porta più energia di un fotone rosso, a parità di numero di fotoni; la **tinta CSS** non garantisce uguale corrispondenza fisica fra quantità di fotoni, intensità, ampiezza e energia.
**Colori complementari non annichiliscono.** In generale rosso+verde produce una percezione additiva, non perdita di energia. Se vogliamo annullamento, occorre un'altra quantità (fase, segno, carica, polarizzazione): si può avere **interferenza distruttiva di ampiezze coerenti**, con energia che si redistribuisce e non scompare dal sistema. Introduce però una variabile nuova. Per Zero: NO annichilazione, sì split/mix/assorbimento con ledger di perdite.

**Dissenso GC:** vuole già due colori per individuo. **PA/PG:** due colori possono essere fenotipo nel rendering ma non due controlli indipendenti dell'energia nel primo round.

**Verdetto B:** i tre assi possono essere semanticamente ortogonali, ma il giocatore deve impararli uno per volta. Il seme controlla la geometria spaziale, il colore il tipo/canale, la sequenza la trasformazione.

---

# 6. Round C — Energia finita dal portafoglio: quando il guadagno è possibile?

**Proposta dell'autore:** ad ogni turno di cristallizzazione posso iniettare fino a una quantità massima finita della mia ENERGY, ottenere dal pattern finale più energia di quella iniettata e riportarla all'Architron.

### FE: “La sola iniezione massima per turno NON impedisce il farming infinito”
Se per ogni turno \(E_\mathrm{out}>E_\mathrm{in}\) e il sistema torna allo stato iniziale, posso ripetere lo stesso ciclo arbitrariamente, generando profitto infinito. Il limite per turno risolve il throughput, **non il bilancio**. Per introdurre guadagno netto servono una riserva esterna finita, una diminuzione dell'energia potenziale interna dei Polytroni, o un sistema di punteggio/record non riscattabile più volte.

### Tre implementazioni coerenti

**C1 — Scarica di potenziale geometrico (più alchemica).**
- Una ricetta complessa possiede un potenziale \(U(P)\) finito (non semplicemente numero di facce o bellezza).
- La mutazione verso una forma più semplice riduce \(U\) e può liberare energia; il Polytrone cambia davvero.
- Per riformare il DNA precedente bisogna reinvestire almeno quell'energia + perdite (nell'assenza di fonte esterna).
- Bilancio: \(E_\mathrm{out} + Q_\mathrm{loss} \le E_\mathrm{in} + U_\mathrm{before}-U_\mathrm{after}\).
- Esempio: inietto 3, il Polytrone perde 4 unità di potenziale, dissipo 1, raccolgo al massimo 6; profitto apparente del turno +3, MA il componente ha perso una risorsa che era già immagazzinata.
- Pro: fusione/fissione hanno peso autentico, il DNA diventa un deposito di capacità; si vede un bel Polytrone semplificarsi durante il flash.
- Contro: rischiamo che il gioco “bruci” individui ai quali vogliamo affezionarci; la sintesi che ricarica \(U\) non può produrre energia gratis.

**C2 — Fonte ambientale finita (più progettuale).**
- Il campo contiene una quota accessibile ma limitata di energia ambientale per l'esperimento, per esempio \(E_\mathrm{amb}=12\). Il portafoglio paga \(E_\mathrm{in}=3\) per attivare/canalizzare.
- La trasformazione recupera \(\le 3+12\) tenendo conto delle perdite; un buon reattore può restituire \(E_\mathrm{out}=9\), guadagno wallet +6.
- Il campo/turno non si resetta gratuitamente: la sorgente viene consumata, oppure il confronto è una prova con reward una tantum.
- Pro: Polytroni restano vivi e riutilizzabili; migliore per una fantasia di reattore autocatalitico/coltivabile.
- Contro: introduce un **serbatoio del mondo** da rappresentare; non deve essere una seconda valuta del giocatore.

**C3 — Record di efficienza (laboratorio senza economia persistente).**
- Si inietta un pacchetto, si misura la frazione raccolta, si stabilisce un nuovo record.
- Eventuali bonus ENERGY per *nuovi* record, senza riscossione ripetuta.
- Pro: test di gameplay e fisica senza metagame; contra: non la completa economia di progresso cercata.

**Voto del panel:** C2 prima per Reactor Zero (4/5), C1 da preservare e testare come variante alchemica (FE e GC particolarmente interessati). PG sostiene C3 come comparatore di purezza ludica.

### Questa non è una seconda valuta
Può esistere **una sola valuta spendibile, ENERGY**, insieme a grandezze di stato non spendibili come riserva ambientale residua \(R\), carica \(U(P)\), intensità di un raggio \(q\) e calore dissipato. Una volta raccolta all'Architron, l'energia diventa ENERGY del portafoglio. Avere variabili fisiche non equivale a creare altre valute.

---

# 7. Round D — Simmetrie, Architron e “ooooh”

### Proposta SE: “Il reattore è un caleidoscopio che si può progettare”
- L'Architron occupa il centro del Mutatron, non una semplice uscita di un tubo; ha un campo di raccolta/risposta.
- Un piccolo nucleo di Polytroni (es. sei su un anello) agisce come sistema di scattering attorno al centro.
- I raggi partono da punti radiali o dai Polytroni sorgente, si propagano nel piano e vengono trasformati quando entrano in una zona d'influenza. Non è necessario *passare attraverso* tutti i Polytroni in fila.
- Un raggio può cambiare direzione/canale o dividersi; rami simmetrici possono ricongiungersi attorno al centro e creare un motivo radiale crescente.
- La configurazione fatta dal giocatore può produrre simmetrie C2, C3, C6 o asimmetrie controllate: **la bellezza non è un bonus gratuito, ma un indicatore della struttura dei processi**.
- Ricircoli finiti: max bounce/transformations, soglie di attenuazione e totale energia controllato. Nessun loop numericamente infinito di riflessioni.

### PG: “Non premiare la sola simmetria estetica”
Un'esplosione a sei punte sarebbe bellissima, ma se produce sempre più ENERGY indipendentemente dalle relazioni è soltanto uno sfondo che si accende. L'estetica deve **rivelare** una trasformazione corretta e funzionale. Simmetrie imperfette possono essere produttive; non fare un gioco che richieda obbligatoriamente di riempire tutti e sei i raggi.

### FE: “Simmetria ≠ conservazione dell'energia”
Le simmetrie si possono usare come principio di *equivarianza*: se ruoto l'intero esperimento di 60° conservando condizioni al contorno ruotate, il pattern finale deve ruotare anch'esso. Non equivale a “simmetria più bella = più energia”. La bassa tensione meccanica può ridurre la dispersione se giustifichiamo la regola, ma non è una sorgente.

### PA: “Black Box non deve diventare una scatola incomprensibile”
La configurazione può avere flussi occultati per il mistero ma serve una modalità d'ispezione: ghost rays, campo anticipato, animazione della traiettoria, cause per le perdite. NO successo dipendente dai riflessi.

### GC: “La trasformazione deve riguardare persone geometriche”
Quando un individuo si trasforma, il suo nome e la sua identità persistono; non è un cutter anonimo sostituito all'istante. Se si scarica, la forma si semplifica e torna stabilizzabile/ricaricabile attraverso vere azioni.

**Verdetto D:** scegliere un **simmetric radial scattering field** come core visivo, non una fabbrica lineare né necessariamente un tower defense. Nel primo test le emissioni devono essere 2/3 raggi al massimo prima di passare a sei; visualizzazione ricca attraverso particelle/trails e audio senza mille tipi di regole.

---

# 8. Round E — E la fase fluida? Mossa, fase o sotto-gioco?

**SE:** “Il movimento continuo è il tratto distintivo di Mindeleev: non possiamo relegarlo a una scorciatoia dell'ottimizzatore.”
**PA:** “Se una mossa gratuitissima fa risolvere automaticamente lo stress, non c'è puzzle. Meglio una scelta deliberata e un costo/opportunity.”
**PG:** “L'utente ha esplicitamente escluso i giochi di riflessi. Una sim fluida realtime per meravigliarsi, fermabile in ogni momento, non è un problema. La sfida non deve richiedere di catturare un frame fortunato.”
**GC:** “I cambi del DNA modificano le forze. Osservare gli individui muoversi dopo una trasmutazione è una conseguenza leggibile e affettiva.”
**FE:** “Il sistema a molle con smorzamento raggiunge minimi locali del potenziale meccanico; non un minimo globale garantito. L'assenza di moto non garantisce stress zero né stato ottimo.”

### Tre ruoli possibili
- **F1 — Fase di pari dignità:** fra due turni di reattore la simulazione deve rilassarsi e ricristallizzarsi; lo schema influenza le posizioni e la produttività. Rischia ripetitività.
- **F2 — Azione "Rilascia / Rilassa" (preferita, provvisoria):** il giocatore può liberare temporaneamente i Polytroni per lasciare che cerchino un nuovo equilibrio dopo una mutazione; poi ricristallizza con preview. Può aiutare o peggiorare il risultato, dipendendo dalle attrazioni. È una scelta interessante solo se c'è un tradeoff.
- **F3 — Laboratorio separato:** fase fluida spettacolare accessibile in sandbox, ma gioco core soltanto sul cristallo. C'è il rischio di dichiarare una parte essenziale che non serve al gioco.

**Dissenso mantenuto:** SE vota F1, PA/PG votano F2, FE domanda un test A/B con F3, GC vuole che la mutazione produca un riallineamento riconoscibile in F2.
**Prima scelta:** F2, ma con gate rigoroso: **se la strategia ottima non richiede mai di usare Rilassa, rimuoverlo dal core e mantenerlo come visualizzatore, senza inventargli una tassa fittizia.**

**Il ruolo dello stress:** lo stress deve essere misura di distanze desiderate *coerenti con geometria e potenziale*; un reattore rilassato può avere dispersione minore, ma soprattutto la fluidità deve poter cambiare posizione e connessioni, non soltanto scontare un punteggio. Non usare la formula arbitraria "stesso seme => più vicini" come legge definitiva.

---

# 9. Proposta di REACTOR ZERO v2 — Symmetry Reactor

## 9.1 Fantasia
"Un campo di Polytroni viventi intorno a un Architron. Ogni turno investo fino a una quota di ENERGY in una scarica radiale. I fasci cambiano forma, colore e distribuzione secondo il DNA e le posizioni dei Polytroni. Se sono riuscito a costruire una struttura capace di raccogliere energia ambientale o liberare un potenziale interno, l'Architron recupera più di quanto ho investito. Il risultato è una figura luminosa, simmetrica quanto voglio, che esprime le leggi del sistema."

## 9.2 Dimensioni MVP (deliberatamente minime)
- **Board:** 19 sink esagonali (raggio 2); cella centrale riservata all'Architron. La *scacchiera* conserva simmetria di ordine 6 ma le traiettorie dei raggi possono essere continue.
- **Individui:** 4–6 Polytroni iniziali con nome e numero permanenti; la *popolazione globale* futura è al massimo 72, non necessariamente tutti simultaneamente sulla piccola scacchiera.
- **Semi nel test:** T e C soltanto; i cinque semi T/C/O/D/I restano architetturalmente ammessi e dovranno distinguersi per geometria/simmetrie, NON rarità potere.
- **Canali energetici:** due, per esempio azzurro e ambra, visivamente distinti dalla diagnostica rosso→verde dello stress. Per evitare confusione separare fondo solid-color e overlay.
- **Operatori nel test:** d e a, con rappresentazione energetica rispettosa almeno delle identità topologiche pertinenti (d² = identity, aa = e se e definito). k è il terzo candidato solo dopo test riusciti.
- **Sorgente:** ambientale *finita*, con quantità nota; il portafoglio del giocatore paga un impulso/iniezione \(\leq I_{\max}\). Per esempio Imax = 3. Sorgente esterna ambientale distinta dal wallet.
- **Collector:** Architron centrale, raccoglie una quota degli impulsi che tornano a una sua regione, convertendola in ENERGY wallet. Energy ledger visibile (iniettato, ambientale, raccolto, dissipato, residuo).
- **Raggi:** emessi in direzioni speculari; interazione possibile entro raggio vicino a Polytroni, non serve attraversarli in fila. MAX tre generazioni di ramificazione, attenuazione, stop threshold e no infinito ricircolo.
- **Azione fluida:** Rilassa per lasciare il sistema seguire forze e cercare una configurazione nuova; cristallizza di nuovo senza tempo di reazione imposto; preview trasparente.
- **Fusione/fissione:** permangono perché modificano ricette e quindi trasformazioni possibili. Non introdurre probabilità di esito nel test di base.
- **Cannon:** non presente come spinta. Il ruolo eventuale è soltanto emettitore da bordo/particella con scelta strategica, in confronto futuro.
- **Griglia 2D e zoom 3D:** due visualizzazioni dello STESSO stato; il 3D deve enfatizzare la geometria reale del Polytrone, indipendentemente da fluido/cristallo.
- **No missioni di collezionabilità né enemy waves né sistemi di salute.**

## 9.3 Un linguaggio visivo leggibile
- Ogni Polytrone mostra il proprio colore genetico primario/secondario discretamente (gradienti).
- Gli anelli/facce rappresentano la geometria e l'orientamento; le emissioni visibili hanno **colore di energia**, distinto dal colore del genotipo quando necessario.
- Tracce sottili e curve di energia prima del commit; tracce luminose, biforcazioni, scie e dissolvenze durante la scarica.
- Il centro pulsa mentre raccoglie energia; all'aumentare delle compatibilità le scie diventano più ordinate, NON per una regola "bellezza = bonus", ma perché la geometria della propagazione è più regolare.
- Diagnostica stress a overlay separato; all'inizio mostra solo quando si seleziona un individuo, per non affogare nel colore.
- Il pannello del pezzo mostra nome, seed, due colori, operatori, **schema di trasformazione energetica previsto** e stato energetico/potenziale se applicabile.
- Una piccola traccia della trasformazione energetica deve poter essere osservata a velocità ridotta o in step dopo l'esecuzione: mai vincere grazie al riflesso.

## 9.4 Una legge di interazione proposta (INVENZIONE, non Conway scientifico)
Definire uno stato del fascio \(b=(x,y,\theta,\mathbf{q},\ell)\): posizione, direzione, vettore di canali non negativi, numero massimo di trasformazioni restanti. Evolvere in segmenti nel piano.

Quando un raggio passa in un disco di interazione intorno a P:
1. una parte \(\alpha(P)\) della sua intensità è assorbita e/o convertita, il resto può proseguire;
2. un'operazione energetica \(T_\mathrm{DNA}\) agisce su canali/direzioni del fascio, derivata dalla composizione degli operatori con il seme e l'orientamento; vietata creazione gratuita d'intensità;
3. un raggio può biforcarsi con intensità totale non superiore all'entrata + contributo di potenziale \(U\) o sorgente \(\Delta R\) esplicitamente registrato;
4. al massimo B rami per evento, L eventi per scarica, eps soglia: il calcolo è finito, deterministico e ricostruibile.

**Non attribuire "d" = prisma e "a" = duplicatore come legge definitiva**: sono solo esempi del tipo di regola da cercare. Preferire una rappresentazione coerente rispetto alle identità geometriche, con l'altra opzione di calcolare direttamente la risposta dalla mesh finale.

### Ledger energetico
Per ogni scarica:

\(E_\mathrm{in}+\Delta R+\Delta U = E_\mathrm{returned}+E_\mathrm{stored}+E_\mathrm{loss}+E_\mathrm{exit}\)

dove \(E_\mathrm{returned}\) è quella raccolta all'Architron e accreditabile al wallet. Usare toleranza numerica nota e gestione dei floating-point. Nel prototipo la relazione è inventata e verificata tramite unit test, ma evita l'assurdo matematico "inietto 3, restituisco 7, stato interamente immutato, ripeto per sempre".

### Due esempi da contrapporre al giocatore
- **A — Scattering imperfetto:** inietto 3; sorgente esterna rilascia 6; solo 2 tornano al centro, 7 escono o si dissipano. Wallet perde 1.
- **B — Struttura symmetrizzata:** stessa iniezione 3 e stessa sorgente 6; 6 tornano all'Architron, 3 escono o si dissipano. Wallet guadagna 3. Le scie formano un disegno più ricco perché le biforcazioni sono orientate verso zone di raccolta; NON perché la simmetria abbia un moltiplicatore arbitrario.
In entrambi i casi \(E_\mathrm{out}\le9\). La fonte esterna da 6 è consumata e non ricompare gratuitamente.

## 9.5 Il puzzle minimo senza DNA-obiettivo imposto
- Con lo stesso insieme limitato di individui e stessa sorgente disponibile, il giocatore prova a superare la propria resa.
- Una ricetta con d+a su un pezzo in una posizione scelta altera il pattern (non solo output numerico).
- Un’altra disposizione produce un incremento ulteriore grazie a una trasformazione nel DNA.
- La vittoria locale NON è “crea daC”; è “riesco a recuperare più ENERGY in modo prevedibile?”
- Le preview mostrano la geometria delle traiettorie e un bilancio di output senza obbligare a esaminare decine di pannelli.
- Non vincolare risultato a uno stato in un millisecondo.

### Vincolo discriminante principale
A parità di posizioni e di sorgente, una **modifica DNA** deve generare un effetto sul pattern e sul rendimento che una pura permutazione dei pezzi iniziali **non può ottenere**.  
Altrimenti non abbiamo un gioco alchemico: abbiamo un Black Box con icone.

---

# 10. Simmetria come proprietà di un processo, non “achievement”

- In una disposizione radiale simmetrica, se fisica e input rispettano rotazioni 60°, la simulazione dovrebbe essere **equivariante**: ruotare tutto ruota il pattern, senza cambiare arbitrariamente efficienza.
- L'Architron centrale rende piacevole leggere la figura e il bilancio.
- La simmetria da E8/Lisi è un riferimento iconografico, non un modello da importare; il reticolo esagonale ha D6, una struttura molto più semplice. Non chiamare i pattern "E8" se non provengono dal relativo sistema matematico.
- Nella vita artificiale pattern emergenti non devono essere sempre perfettamente simmetrici. Stati quasi simmetrici, cicli e asimmetrie residue sono forti sorgenti di meraviglia.
- Promemoria: rivedere le distanze di equilibrio inventate a favore di una legge più strutturale, eventualmente a simmetria di gruppo con pochi invarianti. **NON cambiare nello Sprint Zero**.

---

# 11. Note su Algebra, isomorfismi e analogie autentiche

**Conway come trasformazioni:** i generatori \(d,a,k,\ldots\) operano su classi di poliedri, spesso parzialmente. Le composizioni sono associative ma non commutative; varie identità riducono le parole. Questo è vicino a monoidi di trasformazioni su grafi planari, algebre di riscrittura e sistemi di operatori morfologici discreti, non al fatto che esista un misterioso “gruppo Conway delle fusioni”.

**Morfismo energetico:** una mappa \(\rho: M_\mathrm{Conway} \to M_\mathrm{Energy}\), se rispetta composizione e identità, è un *omomorfismo di monoidi* (o rappresentazione adeguata alla struttura parziale). Se l'obiettivo è mappare TUTTE le informazioni topologiche, semplici matrici 3×3 sui conteggi \(V,E,F\) non bastano.

**Primo benchmark della rappresentazione:** verificare \(\rho(dd)=I\), \(\rho(aa)=\rho(e)\), consistenza delle equivalenze geometrico-topologiche; scegliere se la funzionalità dipenda dal *DNA* o soltanto dalla *mesh finale*. Non è possibile promettere che ogni ricetta diversa produca un'effetto funzionale diverso entro un piccolo numero di canali e regole senza moltiplicare arbitrariamente la complessità.

**Relazione Tonnetz:** le triadi del Tonnetz formano un sistema di trasformazioni P/L/R e cicli su classi d'altezza; la composizione dei generatori e la visualizzazione su reticolo offrono analogie strutturali utili. Un isomorfismo con Conway va DIMOSTRATO mediante mappa biunivoca che conservi le operazioni; nessuna evidenza che esista tale mappa in questa sessione.

**Relazione Rubik:** il grafo degli stati ha nodi (configurazioni) e archi (mosse/generatori). Allo stesso modo, potremmo costruire il grafo dei genotipi/reattori raggiungibili, utile come mappa di scoperta e analisi di puzzle. Un grafo degli stati non implica un'identità algebrica con il gruppo di Rubik; le mosse Conway non sono generalmente invertibili.

---

# 12. Musica, suono e Tonnetz — backlog esplicito
L'autore segnala il Tonnetz, senza volerlo ancora integrare. Registriamo possibili ricerche:
- Tonnetz come organizzazione di note/accordi sul reticolo; triadi come celle triangolari e P/L/R come trasformazioni locali. Possibile sonificazione delle geometrie simmetriche e delle trasformazioni energetiche.
- Ogni canale energetico potrebbe avere una timbrica riconoscibile; ogni trasformazione un intervallo armonico/cambiamento di struttura, ma evitare un mapping puramente decorativo.
- Convergenza dei fasci sul centro => risoluzione armonica, biforcazione => polifonia/contrappunto, stress => dissonanza percepita, con enorme prudenza prima di associarli alla psicoacustica reale.
- Preferenza futura: progettare una **partitura generativa** che condivida lo stesso stato di simulazione con il rendering, non un audio loop sovrapposto.
- NON assegnare ancora note alle palette, né introdurre Tonnetz come regola nel core.

---

# 13. Decisioni, dissensi e roadmap

| ID | Proposta | Stato | Evidenza richiesta |
|----|----------|-------|-------------------|
| 11.1 | Black Box radiale attorno ad Architron, NO catena Shapez | CANDIDATO PRIORITARIO | Un pattern bello e strategicamente leggibile |
| 11.2 | Massimo 72 individui permanenti con nome e genealogia | PRINCIPIO RIPRESO DAL VECCHIO PROGETTO | Trattamento coerente dell'identità in fusion/fission |
| 11.3 | Seme=geometria dei campi; colore=canale; operatori=composizione | IPOTESI FORTE | I tre assi cambiano decisioni diverse |
| 11.4 | ENERGY wallet unica; grandezze fisiche non spendibili ammesse | PRINCIPIO | Contabilità che impedisca cicli free-energy |
| 11.5 | Iniezione max per turno | VINCOLO UTILE MA NON SUFFICIENTE | Serve anche sorgente esterna finita o potenziale consumato |
| 11.6 | Primo test con fonte ambientale finita | 4/5 favorevoli | Bilancio + profitto misurabile e anti-farm |
| 11.7 | Variante Polytron-carica che si scarica semplificandosi | RICERCA PRIORITARIA SUCCESSIVA | Invariante U(DNA)/costo di ricostruzione |
| 11.8 | Algebra energetica rispettosa di relazioni Conway | IPOTESI MATEMATICA | Dimostrare identità, preservazione budget e prevedibilità |
| 11.9 | Fluidità come mossa “Rilassa”, non tempo di riflessi | 3/5 favorevoli, SE contrario | A/B dimostra decisione utile |
| 11.10 | Cannone impulso rimosso, iniettore futuro facoltativo | 5/5 per rimuovere vecchio cannone | Una nuova decisione diversa da “Avvia” |
| 11.11 | D6 come simmetria esatta del reticolo, flussi anche continui | DATO GEOMETRICO | Verifica equivarianza nelle rotazioni |
| 11.12 | Dieci palette → eventuale cromia a coppie di geni discrete | PROMEMORIA | Migrazione codec e miglioramento reale della leggibilità |
| 11.13 | Cambiare legge delle distanze spring-mass | PROMEMORIA | Modello strutturale verificabile, compatibile con pattern simmetrici |
| 11.14 | Tonnetz + sound/music design | BACKLOG ESPLICITO | Esplorazione successiva, non una dipendenza del gioco |
| 11.15 | Rubik state graph → spazio delle trasformazioni | BACKLOG ESPLICITO | Uno strumento di scoperta utile, non solo rappresentazione |
| 11.16 | Non modificare Sprint 09 | FATTO | Solo documentazione sul branch di ricerca |

## Esperimenti imprescindibili prima di promuovere Reactor Zero v2
1. **Visual law:** un giocatore può prevedere qualitativamente dove va un raggio prima di eseguirlo?
2. **DNA has effect:** una trasformazione della ricetta cambia davvero pattern e risultato, non soltanto la mesh.
3. **Topology matters:** stessa lista di Polytroni, posizioni diverse => raccolta diversa.
4. **No free energy:** ripetendo un ciclo con stato di mondo identico non si accumula ENERGY netta senza consumare una fonte.
5. **Fluid matters:** il relax produce almeno una nuova scelta che non esiste nel controllo solo boardgame.
6. **Astonishment matters:** registrare separatamente il grado di bellezza/meraviglia dal desiderio di riprovare.
7. **Complexity cap:** al massimo due canali, due operatori, due semi nell'esperimento iniziale; gli altri geni restano promessa, non 100 regole simultanee.
8. **Population law:** la fusione non distrugge arbitrariamente l'identità 72; la fissione non crea individui infiniti.
9. **Reproducible:** replay deterministico, undo, input not time-sensitive.
10. **No fake E8 or fake physics:** simbolismi visivi dichiarati e conservazioni rispettate nel modello astratto.

## Giudizio finale
Il prossimo prototipo **non** dovrebbe essere né Shapez in esagoni né un tower defense classico. Dovrebbe essere un *campo sperimentale di propagazione*: Architron centrale, piccoli gruppi di Polytroni con identità, flussi radiali che interagiscono con il DNA, raccolta di una quota energetica finita, gioia di scoprire una trasformazione bella e capace.

La domanda-criterio resta: **“Che cosa è accaduto perché ho cambiato *questo gene* e collocato *questa persona geometrica* in *questa posizione*?”**

Se possiamo rispondere visivamente, e il risultato ci meraviglia, la meccanica comincia a giustificare se stessa. Se dobbiamo aprire tabelle per capire come ottenere ENERGY, è ancora un simulatore incomprensibile con un numero premio.
