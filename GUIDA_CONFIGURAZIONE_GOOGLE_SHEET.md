# Guida Rapida · Collegamento Google Sheet per Sincronizzazione Live Gratuita

Questa guida spiega come attivare la sincronizzazione automatica in tempo reale per l'**App Staff Istruttori**, esattamente come nell'app Gare Atleti. In questo modo:
1. Ogni feedback, esercizio o criticità inserito da un istruttore appare **all'istante** su tutti i cellulari degli altri colleghi e nel foglio Google.
2. I colleghi possono rispondere direttamente ai feedback (creando utili thread di consigli).
3. Le comunicazioni e le date dei brevetti inserite dal coordinatore si aggiornano in automatico.
4. Il planning turni e le sostituzioni restano sempre sincronizzati.

---

## 1. Creazione del Foglio Google (Richiede 2 Minuti)

1. Apri [Google Drive](https://drive.google.com/) con il tuo account Google.
2. Clicca su **+ Nuovo** -> **Fogli Google** (crea un nuovo foglio vuoto).
3. Assegna un titolo al foglio in alto a sinistra, ad esempio:  
   `Dinamica Sport - Portale Istruttori`

---

## 2. Inserimento dello Script di Sincronizzazione

1. Nel menu in alto del Foglio Google, clicca su:  
   **Estensioni** -> **Apps Script**.
2. Si aprirà una schermata di programmazione con un file `Codice.gs`.
3. **Cancella tutto** il testo preesistente all'interno dell'editor.
4. Apri sul tuo computer il file:  
   [`scripts/google-apps-script.js`](file:///c:/Users/lucaz/Desktop/App%20istruttori/scripts/google-apps-script.js)
5. Seleziona tutto il codice, copialo e **incollalo** nell'editor di Google Apps Script.
6. Clicca sull'icona **Salva** (il dischetto in alto).

---

## 3. Distribuzione come Applicazione Web

1. In alto a destra della pagina Apps Script, clicca sul pulsante blu **Distribuisci** -> **Nuova distribuzione**.
2. Clicca sull'icona a forma di ingranaggio accanto a "Seleziona tipo" e scegli **Applicazione web**.
3. Compila i campi in questo modo:
   - **Descrizione:** `API Dinamica Sport Istruttori`
   - **Esegui come:** `Utente corrente (tua-email@gmail.com)`
   - **Chi può accedere:** `Chiunque`  
     *(Importante: permette alla Web App da smartphone e PC di leggere e salvare i dati senza richiedere account Google agli istruttori).*
4. Clicca sul pulsante **Distribuisci**.
5. Se Google richiede l'autorizzazione, clicca su **Autorizza accesso**, scegli il tuo account Google, tocca **Avanzate** e infine **Apri... (non sicura)** per confermare.
6. Al termine della procedura, comparirà una finestra con la dicitura:  
   `URL applicazione web` (un link che termina con `/exec`).
7. **Copia questo URL**.

---

## 4. Collegamento all'App

Hai due modalità semplicissime:

### Metodo A (Direttamente dall'App):
1. Apri l'app (fai doppio click su `avvia-app.bat` o apri `index.html`).
2. Clicca in alto a destra sull'icona **⚙️ Impostazioni / Profilo**.
3. Incolla il link appena copiato nel campo **URL Web App Google Sheets**.
4. Clicca su **Salva Impostazioni**.

### Metodo B (Nel file di configurazione predefinito):
1. Apri il file [`config.json`](file:///c:/Users/lucaz/Desktop/App%20istruttori/config.json) con Blocco Note o il tuo editor.
2. Incolla l'URL alla voce `"apiUrl"`, ad esempio:
   ```json
   "apiUrl": "https://script.google.com/macros/s/AKfycb.../exec"
   ```
3. Salva il file.

---

## 5. Come Funziona la Sincronizzazione Live

- **Inizializzazione automatica**: Al primo avvio, lo script creerà da solo 4 schede nel tuo foglio Google:
  - `Feedback`: contiene il registro lezioni con data, turno, autore, tipo, tag rapidi, testo e risposte dei colleghi in formato JSON.
  - `News`: contiene le comunicazioni della direzione con date e stato "In evidenza".
  - `Turni`: contiene il planning vasca con orari, corsie, istruttori assegnati e sostituzioni.
  - `Brevetti`: contiene la guida ai requisiti e ai test per ogni livello di scuola nuoto.
- **Aggiornamento automatico (Auto-Sync)**: L'applicazione interroga il foglio Google ogni 20 secondi in background mentre è aperta, mostrando il badge verde `🟢 Live Sincronizzato`.
- **Zero Latenza & Funzionamento Offline**: Quando un istruttore pubblica un commento o un esercizio a bordo vasca, questo compare istantaneamente sull'app anche in caso di rete debole, e si sincronizza con il foglio Google non appena disponibile la connessione.
