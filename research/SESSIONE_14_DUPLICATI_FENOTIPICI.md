# Sessione 14 — Shape-DNA, Tavola periodica e “Polytroni interessanti”
## Disambiguare le forme duplicate dalle risposte energetiche degeneri

**Data:** 27 ottobre 2026  
**Origine:** feedback dell'autore sugli esperimenti fenotipici 13 e 14.  
**Branch:** experiments/sprint14-shape-dna-fixed-orientation.  
**Stato:** misurazione e studio di ricerca; nessuna mossa/rule/gameplay di Mindeleev cambiata.

## 1. Il problema che l'autore ha visto con i suoi occhi

Molti Polytroni producono **curve di risposta angolare pressoché uguali**, anche quando la loro geometria è visibilmente differente.

Questo NON prova che esistano molti “duplicati” geometrici. La nostra prima sonda di scattering:
- considera le **normali** delle facce, pesate per **area**;
- le proietta nel piano XY, ignorando gran parte della struttura tridimensionale;
- **non tiene conto della posizione reciproca delle facce** (centroidi non usati dal kernel), della loro successione, occlusione, cammini dei raggi né impatti sulle superfici;
- normalizza la distribuzione a 1, eliminando la quantità totale di energia che ciascun solido intercetterebbe in un modello fisico di raggi;
- somma contributions di tutte le facce, anche quelle che un vero fascio probabilmente non toccherebbe.

Dunque due solidi ben distinti possono avere la **stessa “statistica delle normali proiettate”** e risultare indistinguibili alla nostra sonda. Questo è un limite *dello strumento di misura*, non necessariamente dei Polytroni.

**Il concetto da conservare:** la ricerca di “Polytroni interessanti” deve avvenire su **diversi livelli**, non con un singolo punteggio di bellezza o una sola funzione arbitraria di complessità.

## 2. Tre nozioni separate di doppione

### A. Doppione geometrico
Due ricette producono lo stesso poliedro **combinatorio** oppure la stessa **realizzazione geometrica** a meno di traslazione/rotazione/scala o equivalenze geometriche ammesse.
- Il conteggio V/E/F e gli istogrammi di facce/valenze NON bastano a provare isomorfismo.
- Una firma canonica del *grafo di incidenza* può identificare duplicati combinatori dopo opportuna validazione.
- Per congruenza geometrica servono algoritmi che confrontino coordinate e incidences sotto una trasformazione rigida (ed eventualmente scala). Una distanza Shape-DNA piccola **non dimostra** che le mesh siano equivalenti.

### B. Quasi-isospettrale
Due superfici hanno primi autovalori area-normalizzati del Laplaciano di superficie vicini.
- Shape-DNA può raggruppare geometrie simili e individuare ricette distinte con risposte intrinseche affini.
- Gli autovalori approssimati sono **invarianti rispetto alla posa** e al cambiamento di scala uniforme, entro la precisione numerica.
- È una firma *compressa*: forme non isometriche possono condividere una porzione di spettro e anche spettri interi isospettrali non garantiscono congruenza. La triangolazione e la massa concentrata influenzano l'approssimazione.
- “Stesso Shape-DNA” NON significa stessa risposta di un raggio da una direzione arbitraria: la risposta speculare è estrinseca e dipende dalla posa canonica.

### C. Doppione funzionale
Due forme (anche geometricamente diverse) si comportano allo stesso modo **rispetto a un insieme preciso di condizioni sperimentali**.
- Lo dobbiamo sempre qualificare: “equivalente per *questo modello di scattering*, con *queste condizioni di ingresso*”.
- Cambiando la legge o la sorgente, una degenerazione può scomparire.
- L'equivalenza funzionale può essere utile nel gioco: diversi individui con aspetto/colore/nome proprio ma la stessa funzione, analogamente a varianti di una famiglia chimica, non devono essere eliminati automaticamente dal catalogo.

**Vietato fondere i tre livelli sotto l'etichetta “doppioni”.**

## 3. Come rispondiamo sperimentalmente

### Aggiunta al laboratorio
- Confronto automatico delle curve di scattering su **12 direzioni di incidenza**: 0°, 30°, ..., 330°.
- Orientamento del Polytrone **fisso**. Non ruotiamo il poliedro per cercare la miglior sovrapposizione: non deve diventare un requisito ludico.
- Distanza: media sulle 12 direzioni della *total variation distance* fra le distribuzioni angolari normalizzate a 72 settori:
  \[
  D_\mathrm{angular}(P,Q)=\frac{1}{12}\sum_{\theta}\frac12\sum_{j=1}^{72}|h_{P,\theta}(j)-h_{Q,\theta}(j)|.
  \]
  È tra 0 (identiche) e 1 (disgiunte) per risposte non negative normalizzate; è un indicatore empirico, non proprietà fisica del solido.
- Il confronto A/B mostra la distanza angolare accanto a istogrammi e, quando richiesto, allo Shape-DNA e alla sua distanza spettrale.
- Uno script di audit analizza 23 ricette (semi, duali, ambo, expand, operatori non commutativi e alcune varianti) e riporta coppie con scattering vicino, Shape-DNA vicino e discrepanze interessanti (curve vicine ma spettri diversi). I test eseguibili sono in \`scripts/analyze-phenotype-degeneracy.mjs\`.

### Cosa non facciamo ancora
- Non cancelliamo forme e non assegnamo un punteggio oggettivo di “interessante”.
- Non consideriamo valori tipo 0.07 una soglia fisica: sono cutoff di esplorazione nel report, da ricalibrare statisticamente.
- Non clusterizziamo automaticamente tutta la tavola di milioni di ricette.
- Non confondiamo i primi 12 autovalori del FEM con un fingerprint infallibile di forma o comportamento.

## 4. La *Tavola periodica* fenotipica come progetto

La tavola chimica reale ha numero atomico come ordine oggettivo, gruppi di valenza simile e periodi derivati dal riempimento degli orbitali elettronici. **Non possediamo un equivalente dimostrato degli orbitali nei Polytroni**.

Una futura *tavola Mindeleev* potrebbe nascere dall'analisi:
- **Stato ID/numero polytronico:** identifica l'individuo e può conservarne la genealogia; non classifica proprietà fisiche.
- **Specie geometrica:** equivalente al *tipo fenotipico*, individuata con congruenza/struttura canonica.
- **Firma Shape-DNA:** coordinata intrinseca spettrale, per trovare *vicinanza* in uno spazio delle forme e gruppi ricorrenti.
- **Colonne / famiglie:** solo DOPO aver dimostrato che a una firma spettrale vicina corrispondono comportamenti funzionali simili sotto una o più leggi.
- **Righe / periodi:** sequenze di complessità geometrica in cui le classi funzionali ricompaiono, *se* emergono vere periodicità. Non imporre a priori dieci gruppi perché abbiamo dieci palette, o 72 celle perché abbiamo 72 identità.
- **“Gas nobili”:** da cercare come configurazioni stabili e scarsamente reattive dopo aver definito **reattività**; bassa deviazione dalle distanze ideali o alto grado di simmetria NON bastano.

Se lo studio suggerisce un **atlante di cluster** anziché una tavola periodica classica, accettarlo. La tavola periodica è un modello motivante, non una gabbia grafica.

## 5. “Interestingness” non è una funzione universale

Meglio costruire un atlante con *filtri di novità separati*:
- **Novità combinatoria:** struttura del grafo non ancora rappresentata.
- **Novità spettrale:** firma Shape-DNA sufficientemente distante dai rappresentanti esistenti.
- **Novità comportamentale:** sotto più stimoli, la risposta energetica introduce risultati non ottenuti dagli altri.
- **Novità estetica:** impressione umana di meraviglia/valore visivo (criterio soggettivo che non pretendiamo di automatizzare con autovalori).

**Una forma può valere la pena di essere conservata anche se è un “doppione”:**
1. ha una palette/genere estetico o un individuo nominato diverso;
2. appartiene a una genealogia/ricetta di trasformazioni differente;
3. è equivalente solo per lo scattering semplice, ma non per il futuro comportamento 3D;
4. può costituire un elemento simmetrico o un'alternativa compatibile in un campo di più Polytroni;
5. ha lo stesso “mestiere” ma differenze in costo, potenziale o stabilità.

## 6. Tre esperimenti formali da fare prima di un nuovo Reactor Zero

**E1 — Classi e rappresentanti:** enumerare fino a qualche centinaio di ricette, raggruppare i veri duplicati combinatori e annotare separatamente i casi spettralmente vicini. Non eliminare le ricette alias: servono per verificare i quozienti dell'algebra Conway.

**E2 — Cieca dell'attuale scattering:** produrre coppie con firma spettrale distintamente diversa ma output angolare pressoché uguale. Questo distingue la carenza del sensore dalla ridondanza del soggetto. Serve un benchmark con soglia fissata prima dei risultati.

**E3 — Seconda sonda, informazione locale:** implementare un modello in cui un vero raggio nel piano incontra la geometria **proiettata con posizione**, e reagisce soltanto all'oggetto/superficie che tocca. Confronto con la statistica globale delle normali a parità di input e bilancio. Prima uno scattering 2D di poligoni proiettati con regole deterministiche; non serve ottica complessa, ma posizione/occlusione sì.

L'obiettivo finale è una Tavola Mindeleev che non elenchi semplicemente tutti i DNA, ma consenta di scegliere **quali geometrie sono nuove, quali fenomeni sono nuovi e quali combinazioni vale la pena investigare**.

## 7. Fonti e limiti
- Martin Reuter, Franz-Erich Wolter, Niklas Peinecke, *Laplace–Beltrami spectra as Shape-DNA of surfaces and solids*, CAD 38(4) (2006), https://doi.org/10.1016/j.cad.2005.10.011
- Riferimento IUPAC tavola periodica: https://iupac.org/what-we-do/periodic-table-of-elements/
- Ripetuti limiti: “isospettrale” non implica necessariamente “isometrico”; “stessa curvatura polare” non implica stesso comportamento reale; equivalenza genetica non equivale a equivalenza fenotipica.


## 8. Primi risultati **misurati**, 27 ottobre 2026

L'audit automatico dello Sprint 14 è stato eseguito realmente su GitHub Actions (script \`scripts/analyze-phenotype-degeneracy.mjs\`, workflow \`pages-shape-dna.yml\`). Il campione analizzato comprende **23 ricette**, **253 coppie** e nessuna forma saltata. Secondo la soglia esplorativa \`D_angular < 0.07\`, **25 coppie** hanno risposte angolari molto simili. La metrica è la distanza di variazione totale media su dodici incidenze, calcolata su 72 bin di uscita; le cifre seguenti sono arrotondate a sei decimali.

| Ricette | Istogrammi/VEF uguali? | D_angolare | D_spettrale | Interpretazione prudente |
|---|---|---:|---:|---|
| C / ddC | Sì | 0 | 0 | Caso atteso di dual²: stessa forma in termini del generatore e dei descrittori |
| O / dC | Sì | 0 | 0 | Doppio costruttivo, ottaedro e duale del cubo |
| T / O | No | 0 | 0.405465 | **Falso doppione della sonda angolare**, forma spettralmente diversa |
| aC / daC | No | 0 | 0.136282 | Stessa curva ma struttura e firma spettrale differenti |
| C / daT | Sì (descrittori) | 0 | 0.162534 | Gli istogrammi non certificano equivalenza della mesh |
| D / aI | No | 0.218034 | 0.068057 | Firme spettrali relativamente vicine con risposta angolare visibilmente diversa |
| aI / aD | Sì | 0 | 0 | Comportamento atteso per ambo su solidi duali |

**Risultato concreto:** il modello di scattering basato su *somma delle normali proiettate* non ha sufficiente potere discriminante; **il problema non è principalmente la grafica del diagramma**, ma la perdita di informazioni spaziali nel kernel. La comparazione spettrale recupera informazione, ma non è una prova di identità o unicità matematica. Il confronto “colonne della tavola” dovrà eventualmente tenere conto di una **risposta funzionale misurata con un modello energetico più completo**.

Il campione contiene deliberatamente ricette equivalenti; quindi **25/253 non è la prevalenza stimata di doppioni nell'universo Mindeleev**. È soltanto un audit preliminare ad alta concentrazione di casi diagnostici, utile per falsificare il modello corrente.

**Decisione di metodo:** non filtrare automaticamente i Polytroni sulla sola forma della curva; distinguere duplicati genetici/alias, duplicati geometrici, prossimità Shape-DNA e equivalenza funzionale per un test specifico. Procedere a un secondo modello con **posizione delle facce e intersezione dei raggi nel piano** prima di attribuire classi energetiche.
