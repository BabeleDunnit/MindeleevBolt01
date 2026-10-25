# Mindeleev — Sprint 04: feedback e revisione dei laboratori

## Cosa cambia rispetto a Sprint 03

- **Fissione sempre disponibile:** nessuna regola artificiale la disabilita nel primo o nel secondo puzzle. Rimangono solo i vincoli del DNA (almeno due operatori), una cella confinante libera, il taglio e l'energia.
- **Errori contestuali:** ogni tentativo comunica che cosa impedisce la mossa (adiacenza, occupazione, profondità DNA, limite energetico, condizioni del Nucleo).
- **Nucleo:** la casella (0,0) serve alla stabilizzazione di DNA *prodotti durante la partita*. Un'azione esplicita sposta dal ring 1 al Nucleo spendendo un'unità di energia. È possibile anche estrarre un Polytrone al costo di una unità.
- **Tavola:** i DNA nuovi entrati nel Nucleo vengono memorizzati localmente tramite localStorage. Niente login o backend. Non vengono cancellati usando «Annulla».
- **Vittoria:** richiede il DNA bersaglio prodotto e collocato nel Nucleo. La vittoria non blocca il laboratorio: si può continuare a sperimentare.
- **E+U:** non è più nel cruscotto principale. Il dettaglio (energia spendibile E e potenziale matematico U) è disponibile in una sezione a espansione.
- **Discovery Lab:** energia iniziale ampliata (6/8/12), mini-tutorial con esempio dichiaratamente fittizio, feedback che conta le ipotesi eliminate, avviso sulle prove ripetute, pulsante di suggerimento di un test informativo a costo zero.

## Percorsi del sito Pages (deploy unico)

- Visualizzatore originale: `/MindeleevBolt01/`
- Ring Reactor: `/MindeleevBolt01/?experiment=conway-ring`
- Discovery Lab: `/MindeleevBolt01/discovery/`

## Risolvibilità dei tre puzzle Ring Reactor

Verifica indipendente mediante esplorazione a larghezza (regole replicate in un piccolo solver, senza prerequisiti grafici):

- **A1:** 4 mosse. Ruota ring 1 due volte in senso antiorario, fondi da 1:4 con 2:7, stabilizza da 1:4 nel Nucleo.
- **A2:** 4 mosse. Ruota ring 1 in senso orario, fondi 1:1 con 2:3, stabilizza 1:1 nel Nucleo, fondi il DNA nel Nucleo con 1:4.
- **A3:** 5 mosse. Ruota ring 1 due volte in senso antiorario, dividi da 1:4 verso il centro tagliando dopo un operatore, poi fondi 1:4 con 2:7 e il Nucleo con 1:4.

Le soluzioni sono verifiche di fattibilità nel *modello semplificato del gioco*, non test di divertimento e non una garanzia di ottimalità per una versione futura.

## Rischi di design ancora aperti (adversarial)

1. **Sfruttamento del Nucleo:** il criterio «creato nella partita» potrebbe risultare troppo permissivo. Valutare registrazione solo di scoperte non presenti nella Tavola e/o differenze fenotipiche reali.
2. **Deposito troppo meccanico:** se il Nucleo è solo l'ultima mossa obbligata, aggiunge un costo ma non profondità. Prototipare regole per cui il Nucleo interviene attivamente in fusioni, fissioni o condizioni di stabilità.
3. **Motore fisico evocativo:** U è una funzione ludica assegnata al DNA, non energia quantistica. Continuare a separare analogie dichiarate da leggi scientifiche autentiche.
4. **Stato persistente:** localStorage è adeguato a questa fase; non sincronizza dispositivi e può essere cancellato.
5. **Discovery Lab ancora astratto:** il prossimo sprint dovrebbe collegare il feedback sperimentale a proprietà geometriche derivanti dagli operatori Conway.

## Integrità della repository

Modifiche solo nel branch `experiments/sprint03-conway-ring`. Nessun commit su `main` o `develop`.
