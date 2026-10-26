# Sessione 08b — Ritorno dal primo playtest, aggiornamento delle regole e dibattito su ENERGY

**Data:** 26 ottobre 2026  
**Origine:** feedback dell'autore sul primo prototipo web "Mutatron · Phase Shift".  
**Natura del documento:** verbale di co-design con cinque prospettive ESPERTE SIMULATE dall'assistente; non corrisponde a consulenti umani né a risultati di playtest esterni.  
**Branch:** \`experiments/sprint08-mutatron-dual-state\`. \`main\` e \`develop\` non modificati.

## 1. Requisiti registrati — fonte: feedback dell'autore

| ID | Idea / osservazione | Categoria | Azione immediata |
|---|---|---|---|
| 08-F01 | Lo *stress* è cruciale: configurazione ferma/stabile ≠ distanze mutuali vicine all'ideale. Obiettivo anche trovare stati a bassa tensione. | Design core | Rendere visibile la differenza fra velocità e stress; formalizzare vittoria futura |
| 08-F02 | Metafora dei gas nobili: shell complete, configurazioni difficilmente perturbabili, premio in ENERGY? | Economia/narrazione | Dibattito e anti-farming, non inventare subito produzione energetica |
| 08-F03 | Il rettangolo bianco/blu di focus resta visibile anche quando il Polytrone viene deselezionato. | Bug UX | Rimuovere outline permanente del SVG group, distinguere selezione e focus tastiera |
| 08-F04 | In fase fluida la simulazione dovrebbe ripartire e progredire **in tempo reale**. Nessun gioco di riflessi, pausa e passi tecnici solo come strumenti di analisi. | UX/runtime | Realtime automatico e pulsante pausa; tick fisico a passo fisso |
| 08-F05 | Bond stress come continua variazione di tinta, alpha e spessore: legame buono quasi invisibile/verde, cattivo rosso/grosso. | Visual feedback | Implementare funzione di errore relativo \`|d-d*|/d*\` |
| 08-F06 | Trascinare un Polytrone, con sistema spring-mass che reagisce, potrebbe essere migliore del cannone come impulso. | UX/controllo | Primo gesto "afferra e trascina" in fase fluida; cannone conservato come confronto |
| 08-F07 | Cannone come bombardamento per trasmutazione, più interessante di quattro frecce-impulso. | Design | Conservare come ipotesi: fascio energetico e reazioni, non implementare senza legge |
| 08-F08 | Preview di fusione/fissione, compatibilità, DNA possibili, distanze desiderate, caratteristiche di ogni Polytrone; non aprire decine di pannelli. | UX | Preview locale delle ricette legali e info selezione; evolvere a outcome cards |
| 08-F09 | Reazioni potenzialmente stocastiche, come Pocket Frogs: ordine fusioni, posizione di taglio, possibili figli; preview di esiti e probabilità. | Meccaniche genetiche | Valutazione, non modificare motore deterministico senza controlli |
| 08-F10 | Mutazione puntuale di un gene, incluso il seme geometrico C→T, con effetti sulla famiglia. | Meccaniche genetiche | Progettare legge esplicita, non confondere mutazione geometrica con materialità |
| 08-F11 | Semi dodecaedrici/icosaedrici potenzialmente più rari e più energetici. | Progressione/economia | Criticare rarità artificiale, bilanciamento e interpretazione dell'energia |
| 08-F12 | Caratteristiche visive devono rendere leggibili le proprietà: forma, colori, affinità, distanza. | Art direction core | Separazione fenotipo/diagnostica stress; legami come heat map |
| 08-F13 | Collezione: colori primario e secondario e razza/seed; palette discrete, ma possibilmente gradienti fra due colori. | Genetica/estetica | Proposta di alleli/palette finite e face-class palette interpolation |
| 08-F14 | Modalità zoom-to-3D del catalogo stile Tower Madness è importante. | Camera / UX | Tenere separati "fase fluida/cristallo" e "vista 2D/3D": assi ortogonali |
| 08-F15 | Apprezzamento molto forte per due fasi + cristallizzazione e ambizione puzzle/caleidoscopio. | Visione | Concentrare gli esperimenti su questa ipotesi |

**Nota importante:** la richiesta NON autorizza ad attivare un sistema di premi, mutation RNG o nuove tabelle di genetica come regole definitive. Priorità a correzioni piccole per continuare a giocare.

## 2. Round 1 — Che cosa è davvero lo stress?

**Architetto del Puzzle (PA):** «Un obiettivo "stabile" non è abbastanza discriminante. Una configurazione che ha smesso di muoversi può avere una grande tensione residua. La sfida interessante è trovare un assetto che soddisfi quasi tutti i vincoli reciproci — e sapere quali cambiare quando sono incompatibili.»

**Progettista di Emergenza (SE):** «Non costringiamo ogni livello a una quiete assoluta: cicli dinamici possono essere magnifici e significativi. Usiamo obiettivi diversi: cristalli rilassati, orbite persistenti, pattern ricorrenti, sopravvivenza.» Riserva: un'orbita non è un equilibrio statico.

**Genetista (GC):** «La caratteristica eccitante è che cambiare una ricetta cambi davvero la distanza ottima fra le altre. Ma la misura del successo deve tenere conto del numero di vincoli: eliminare Polytroni non può essere un trucco automatico per abbassare la somma dei quadrati.»

**Psicologo (PG):** «Stress = "quanto sto sbagliando" deve essere immediatamente osservabile, non soltanto un numero. Un legame rosso spesso è utile; uno verde tenue è una promessa di essere vicino a un obiettivo. Servono tooltip facoltativi, non una schermata dati obbligatoria.»

**Fisico (FE):** «Definiamo con rigore due grandezze: (a) *residual stress* = differenza dalle distanze desiderate e dai vincoli del nucleo, (b) *motion* = velocità delle particelle. Possono variare indipendentemente. "Stabile" significa non divergere con piccole perturbazioni e/o basso moto secondo un criterio; "rilassato" significa basso errore residuo. Il motore attuale mostra una proxy, non una dimostrazione di stabilità dinamica.»

### Esito
Adottiamo **stabilità** e **rilassamento** come due assi del sistema. La prossima valutazione dovrà mostrare almeno un esempio "fermo ma stressato" e uno "in moto ma con distanze quasi ideali". La vittoria non deve dipendere soltanto da velocità piccola.

**Accorgimento matematico fondamentale:** la quantità attuale \`Σ (d_ij - d*_ij)^2\` non è confrontabile direttamente fra N=4 e N=2 (cambiano i termini). Prima di assegnare ENERGY bisogna definire stress normalizzato, severità del vincolo e una soglia per non premiare un campo vuoto. Il colore delle connessioni può mostrare \`e_ij=|d-d*|/d*\` in modo relativo, ma il punteggio globale deve distinguere distanze incompatibili da errore numerico.

## 3. Round 2 — Come guadagnare ENERGY?

**PA:** «L'ENERGY deve restare una risorsa per creare scelte strategiche, non una progress bar infinita. Il modo più chiaro è premiare un *obiettivo verificabile*: sintetizza un certo genotipo e stabilizza una disposizione con stress sotto soglia. Guadagno una sola volta.»

**SE:** «La scoperta scientifica di un pattern nuovo può costituire una ricompensa. Ciò motiva a esplorare e a sperimentare, non solo a seguire livelli prestabiliti. Ma serve impedire di premiare infinite variazioni banali dello stesso minimo.»

**GC:** «Proposta: bonus di scoperta per **nuovo tipo di legame/stato/bond pattern + genotipo**; non per un colore casuale o un click ogni ciclo. Una semplice chiave canonica deve distinguere equivalenze e permutazioni dei Polytroni.»

**PG:** «Reintegro dell'energia deve essere coerente con la fantasia di gioco e mai scattare come tassa sul fallimento: niente timer che ricaricano, nessuna pubblicità, niente grind ripetitivo. La curiosità è CD7, la padronanza CD2 e la creazione CD3 di Octalysis; CD6 e CD8 bassi.»

**FE:** «Non confondere ENERGY spendibile con energia potenziale elastica. Un sistema che si rilassa dissipa energia meccanica in calore; non produce automaticamente una "batteria". Se si vuole narrativamente ricavare ENERGY, occorre postulare un apparato che converta una parte dell'energia rilasciata da una *transizione* in risorsa utilizzabile, oppure dichiararla "premio scientifico" astratto, non energia fisica.»

### Proposte in competizione
1. **E1 — Ricompensa di livello (priorità):** una quantità fissa di ENERGY per la prima soluzione di un obiettivo complesso che richiede stress normalizzato sotto una soglia e moto residuo sotto un'altra. Nessun premio per rimanere fermi.
2. **E2 — Scoperta unica:** premio una tantum per nuove configurazioni "nobili" (almeno 3–4 Polytroni, invarianti o specie nuove, stress basso, resilienza a piccole perturbazioni).
3. **E3 — Conversione di rilassamento:** energia recuperata proporzionale al calo di potenziale fra prima e dopo una trasmutazione, ma non superiore all'energia spesa, salvo riserva iniziale esterna; seria contabilità fisica e possibili exploit.
4. **E4 — Accumulo nel tempo a stress basso:** bocciata quasi all'unanimità; basta lasciare aperta la simulazione per farmare all'infinito.
5. **E5 — Seed rari come batterie:** bocciata quale primo principio; rende semi D/I oggetti di potere più che proprietà geometriche, e induce grind.

**Verdetto preliminare:** sperimentare **E1**, poi **E2**. La metafora dei **gas nobili** è ottima come *stato desiderabile di shell completa e stabilità chimica*: non significa che tutti i legami del gas siano senza stress o che gli atomi producano energia da soli. Nella chimica, la bassa reattività dei gas nobili deriva dalla configurazione elettronica di valenza completa, non da una "mappa di distanze ideali" fra atomi.

**Vincoli anti-farming per un futuro reward:**
- Premio una sola volta per \`(scenario,composizione canonica,configurazione di tipo)\` oppure per traguardo definito.
- Test automatico che esclude cicli a costo zero o negativo con guadagno positivo.
- Compensazione di costo e ricompensa definita separatamente dalla dinamica visuale.
- Cambiando il numero di individui non deve essere possibile ridurre artificialmente lo stress per ottenere più ENERGY.
- Stato "nobile" richiede anche resilienza a una piccola perturbazione, non soltanto un singolo screenshot fortunato.

## 4. Round 3 — Trascinamento, cannone, realtime, vista

**PA:** «Usare drag per spostare gratuitamente qualunque pezzo rende il puzzle banale; nel laboratorio va bene per esplorare. Quando sarà un gioco, il drag deve essere soggetto a una legge di lavoro/forza o a un budget ben spiegato.»

**SE:** «Il drag con molle che seguono è un gesto scenico e causale molto più immediato delle frecce discrete. Il campo deve muoversi realtime per costruire il modello intuitivo delle forze.»

**PG:** «La pausa esiste come *strumento di lettura*, mai come penalità. Il cursore rettangolare rimasto dopo deselezione era particolarmente pericoloso: confonde focus tecnico e selezione ludica. Rimuovere il rettangolo persistente senza perdere navigabilità tramite tastiera.»

**FE:** «Realtime di visualizzazione non implica variabilità del risultato rispetto agli FPS: avanzamento a timestep fisso, azioni serializzabili, snapshot prima del drag, linee di legame aggiornate dalla stessa posizione usata dal calcolo. Se lo spostamento durante il drag è kinematico e gratuito, dichiarare che è una concessione del laboratorio.»

**GC:** «La vista 2D della griglia e quella 3D immersiva devono essere intercambiabili senza cambiare genotipo né regole. Non confondere *switch camera 2D/3D* con *fase fisica fluido/cristallo*. Sono due assi diversi e possono coesistere in quattro combinazioni.»

### Esito
- Fase fluida **realtime di default**, pausa/ripresa e strumenti +1/+60 solo in pausa; cristallo ferma automaticamente la dinamica; rilascio la riavvia.
- Trascinamento diretto in modalità laboratorio, gli altri pezzi reagiscono alle forze in tempo reale. Gli impulsi restano disponibili come confronto ma il loro ruolo definitivo è aperto.
- Il cannone "nucleare"/di bombardamento è un possibile strumento di **reazione e mutazione**, non semplicemente un vettore di accelerazione. Ma non lo si deve implementare per imitazione verbale di una fusione nucleare: vere trasmutazioni di elementi implicano cambiare il numero di protoni; mutare un seme Conway non è trasmutazione nucleare reale.
- Zoom to 3D come modalità visuale indipendente, da valutare senza mescolare cambio di regole e cambio camera.

## 5. Round 4 — Colori, genetica, mutazione, probabilità

**GC:** «La struttura a tre assi di Pocket Frogs è un riferimento forte: colore primario, colore secondario e razza. Il DNA Mindeleev può avere *operatori, palette/geni cromatici e seme*. Proporrei una tabella di colori primari e secondari FINITI, con un gradiente interpolato sulle facce del solido — il gradiente è resa visiva, non un quarto gene.»

**PA:** «La randomizzazione del punto di taglio e dell'ordine dei reagenti può dare rigiocabilità, ma rischia di rendere i puzzle insolubili per sfortuna. Un puzzle di pura previsione deve essere risolvibile anche con gli esiti peggiori, oppure dotato di azioni per influenzare le probabilità.»

**PG:** «Preview di TUTTI gli esiti con probabilità chiaramente visibili, niente esito segreto che distrugge una scoperta rara. Se c'è alea, chiudere la porta al grind con strumenti di controllo, annulla o conservazione dei blueprint.»

**SE:** «Un punto di split casuale può creare sorprese, ma la sorpresa è più bella quando produce una nuova famiglia di comportamenti e non un fallimento ripetitivo. Separiamo modalità "esperimento incerto" e modalità "sintesi controllata".»

**FE:** «La scelta stocastica richiede un generatore pseudocasuale con seed registrato e distribuzioni note; i risultati devono rispettare sempre il parser dei DNA, i limiti di profondità, i vincoli della geometria e l'economia. Il gene seed non è materiale nucleare.»

### Alternative per alea
- **P0 Deterministica con anteprima completa:** modello Sprint 08 di controllo, da mantenere.
- **P1 Alea visibile:** una fusione ha per esempio due possibili ordini di concatenazione A+B e B+A, con quote note e mostrabili prima; una fissione seleziona fra tagli ammessi con probabilità dichiarate. Non sono *regole deliberate finali*.
- **P2 Controllo dell'esito pagando ENERGY:** si può restringere una distribuzione o scegliere un target al costo di ENERGY; non si introducono valute extra.
- **P3 Breeding separato:** ereditarietà di cromie e semi con progenie possibili, mantenendo i genitori; differente da fusione consumante 2→1 e da fissione 1→2.

**Proposta test futuro:** stesso puzzle risolvibile sia con P0 sia con P1, confronto fra curiosità positiva e frustrazione; registrare quanti tentativi i tester accettano prima di percepire perdita di controllo.

### Rareza dei semi
I semi T/C/O/D/I sono oggetti geometrici di partenza, non una progressione intrinsecamente ordinata per potenza. Dodecaedro e icosaedro possono richiedere più scoperte o una procedura di mutazione, ma **rarità non significa automaticamente energia fisica maggiore**. Se scegliamo un costo maggiore, va motivato da complessità sintetica misurata e da nuove scelte conseguenti, non da rarità artificiale.

### Colori multipli e legami
Separare in modo rigoroso i canali visuali:
- **Fenotipo/collezione:** palette primaria+secondaria discrete, possibile gradiente sulle classi di facce; non variano continuamente durante il gioco.
- **Diagnostica:** bond colori rosso/verde + spessore/alpha progressivi secondo errore. La loro tinta variabile non è il genotipo.
- **Seme:** silhouette di solido reale T/C/O/D/I, eventualmente microicona.
- **Operatori:** silhouette effettiva di Conway, complessità e famiglia, non affidarsi al testo.
- **Accessibilità:** spessore/alpha e tratteggio/texture rendono l'errore leggibile anche se non si distinguono rosso e verde.

La mappa dovrebbe comunicare immediatamente che cos'è *fuori equilibrio*. Il pannello dettaglio, quando selezionato, spiega *perché*, senza doversi aprire per ciascuno degli altri individui.

## 6. Migliorie del codice introdotte in Sprint 08b

- Rimozione del focus rettangolare persistente su Polytroni SVG; focus tastiera rappresentato da un anello soltanto con \`:focus-visible\`.
- Ciclo fluid-phase automatico con \`requestAnimationFrame\` e **passi fisici fissi**, pulsante pausa/ripresa; strumenti di avanzamento manuale solo quando in pausa; cristallizzazione ferma il loop, rilascio lo riavvia.
- Primo supporto al **drag diretto** nel laboratorio in fluido: posizione del corpo controllata verso il target del puntatore, altri Polytroni reagiscono alla fisica. Non è ancora un costo di movimento bilanciato.
- Bond diagnostici continui secondo \`severity=clamp(|d-d*|/(0.6 d*), 0,1)\`; tinta HSL verde→rosso, spessore e opacità crescenti. Tooltip accessibili con distanza reale e ideale.
- Visibilità di stress aggregato e moto RMS, per evitare di confondere quiete e rilassamento.
- Prime anteprime di fusione/fissione in cristallo: DNA risultante, condizioni di legalità e stress immediatamente successivo; avviso che non predice l'equilibrio finale.
- Rimangono in sospeso: probabilità, mutazioni del seme, reward ENERGY, rendering pieno in 3D e vincita per stress basso.

**Attenzione:** questo elenco descrive le modifiche del branch. La loro validazione definitiva richiede test nel browser; la sola compilazione TypeScript non certifica l'ergonomia del drag o la leggibilità della heat map.

## 7. Criteri per il prossimo test

1. **Cursore:** clicca un Polytrone, cliccalo di nuovo, verifica che sparisca sia il contorno selezione sia il rettangolo browser; tastiera conserva un focus leggibile.
2. **Realtime:** appena aperta la fase fluida, i Polytroni si muovono. Metti in pausa, verifica che il campo si fermi, avanza +1, riprendi, poi cristallizza e verifica congelamento.
3. **Bond:** un legame lontano dall'ideale è rosso, spesso e opaco; un legame quasi perfetto è quasi invisibile. In pausa puoi leggere il tooltip preciso.
4. **Drag:** trascina un Polytrone, nota le reazioni degli altri senza scattare verso i sink. Il gesto non deve essere una sfida di velocità.
5. **Fusion/fission preview:** due Polytroni compatibili selezionati in cristallo mostrano risultato prima dell'azione; tagli alternativi mostrano ricette diverse; sink vuoto valido mostra la valutazione.
6. **Fairness:** anteprima sink e cristallizzazione devono continuare a coincidere; la simulazione deve avere undo e restart.
7. **Economia:** nessun premio ENERGY automatico è attivo. Il prossimo sprint deve formalizzare anti-farming e stress normalizzato prima di usarlo come reward.
8. **Dati:** annotare se le informazioni visive rendono davvero superflue decine di pannelli.

## 8. Una nuova ipotesi da promuovere
Il "gas nobile" di Mindeleev potrebbe essere una classe di **configurazioni autonome, composte, poco stressate e resistenti alle piccole perturbazioni**, non semplicemente una geometria fermata sul sink. Il momento di scoperta e cristallizzazione di una tale configurazione può essere una ricompensa di comprensione (Tavola) e forse di ENERGY una tantum. Verificare con 3–5 Polytroni, una dinamica smorzata, una funzione di stress normalizzato e perturbazioni controllate.

**Principio di tutela:** non implementare un premio prima di poter rispondere a "può il giocatore guadagnare la stessa ENERGY ripetendo la medesima sequenza senza nuove scoperte?" Se la risposta è sì, la regola non è pronta.
