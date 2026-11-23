/**
 * =========================================================================
 * GOOGLE APPS SCRIPT · BACKEND DINAMICA SPORT STAFF ISTRUTTORI
 * =========================================================================
 * Gestisce la sincronizzazione in tempo reale di:
 * 1. Feedback & Diario Lezioni (con supporto risposte e tag)
 * 2. News & Avvisi della Direzione
 * 3. Planning & Turni Istruttori
 * 4. Schema Ufficiale Brevetti (Tartarughe Marine, Delfini, 2 Corsia)
 * =========================================================================
 */

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Scheda FEEDBACK
  var sFeedback = ss.getSheetByName('Feedback') || ss.insertSheet('Feedback');
  if (sFeedback.getLastRow() === 0) {
    sFeedback.appendRow([
      'Id', 'Data', 'Orario', 'Istruttore', 'GruppoCorsia', 'Tipo', 'Tag', 'Testo', 'RisposteJson', 'DataAggiornamento'
    ]);
    sFeedback.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#e0f2fe');
    sFeedback.setFrozenRows(1);
  }

  // 2. Scheda NEWS (BACHECA COMUNICAZIONI)
  var sNews = ss.getSheetByName('News') || ss.insertSheet('News');
  if (sNews.getLastRow() === 0) {
    sNews.appendRow([
      'Id', 'Data', 'Titolo', 'Testo', 'Autore', 'Categoria', 'InEvidenza', 'DataAggiornamento'
    ]);
    sNews.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#fef3c7');
    sNews.setFrozenRows(1);
  }

  // 3. Scheda TURNI (71 TURNI COMPLETI DALL'ORARIO RAGAZZI 2026-27)
  var sTurni = ss.getSheetByName('Turni') || ss.insertSheet('Turni');
  if (sTurni.getLastRow() === 0) {
    sTurni.appendRow([
      'Id', 'Giorno', 'Orario', 'CorsiaGruppo', 'Istruttore', 'Note', 'Sostituto'
    ]);
    sTurni.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#dcfce7');
    sTurni.setFrozenRows(1);
  }

  var sampleTurni = [
    // LUNEDÌ
    ['t_1', 'Lunedì', '17:00 - 17:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Luca', 'Vasca Nuoto', ''],
    ['t_2', 'Lunedì', '17:00 - 17:45', 'Corsia 1 Alta · Delfini', 'Carlo', 'Vasca Nuoto', ''],
    ['t_3', 'Lunedì', '17:00 - 17:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Agata', 'Vasca Nuoto', ''],
    ['t_4', 'Lunedì', '17:00 - 17:45', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_5', 'Lunedì', '17:45 - 18:30', 'Corsia 2 · 2 Corsia (Avanzate)', 'Agata', 'Vasca Nuoto', ''],
    ['t_6', 'Lunedì', '17:45 - 18:30', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_7', 'Lunedì', '17:45 - 18:30', 'Vaschetta · Ambientamento', 'Carlo', 'Vaschetta', ''],
    ['t_8', 'Lunedì', '18:30 - 19:15', 'Corsia 1 · Hydrobike', 'Laura', 'Fitness', ''],
    ['t_9', 'Lunedì', '18:30 - 19:15', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_10', 'Lunedì', '19:15 - 20:00', 'Corsia 1 · Acquagym', 'Laura', 'Fitness', ''],
    ['t_11', 'Lunedì', '19:15 - 20:00', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],

    // MARTEDÌ
    ['t_12', 'Martedì', '17:00 - 17:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_13', 'Martedì', '17:00 - 17:45', 'Corsia 1 Alta · Delfini', 'Mariagiulia', 'Vasca Nuoto', ''],
    ['t_14', 'Martedì', '17:00 - 17:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Luca', 'Vasca Nuoto', ''],
    ['t_15', 'Martedì', '17:00 - 17:45', 'Vaschetta · Ambientamento', 'Sara', 'Vaschetta', ''],
    ['t_16', 'Martedì', '17:45 - 18:30', 'Corsia 1 Bassa · Tartarughe Marine', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_17', 'Martedì', '17:45 - 18:30', 'Corsia 4 · Esordienti C', 'Mariagiulia', 'Vasca Nuoto', ''],
    ['t_18', 'Martedì', '17:45 - 18:30', 'Corsia 5 · Reclutamento', 'Luca', 'Vasca Nuoto', ''],
    ['t_19', 'Martedì', '17:45 - 18:30', 'Vaschetta · Ambientamento', 'Sara', 'Vaschetta', ''],
    ['t_20', 'Martedì', '18:30 - 19:15', 'Corsie 1-2 · Ragazzi', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_21', 'Martedì', '18:30 - 19:15', 'Corsie 4-5 · Agonistica', 'Luca', 'Vasca Nuoto', ''],
    ['t_22', 'Martedì', '19:15 - 20:00', 'Corsie 1-2 · Master Adulti', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_23', 'Martedì', '19:15 - 20:00', 'Corsie 4-5 · Agonistica', 'Luca', 'Vasca Nuoto', ''],

    // MERCOLEDÌ
    ['t_24', 'Mercoledì', '17:00 - 17:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Luca', 'Vasca Nuoto', ''],
    ['t_25', 'Mercoledì', '17:00 - 17:45', 'Corsia 1 Alta · Delfini', 'Elisa', 'Vasca Nuoto', ''],
    ['t_26', 'Mercoledì', '17:00 - 17:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Sara', 'Vasca Nuoto', ''],
    ['t_27', 'Mercoledì', '17:00 - 17:45', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_28', 'Mercoledì', '17:45 - 18:30', 'Corsia 1 Bassa · Tartarughe Marine', 'Sara', 'Vasca Nuoto', ''],
    ['t_29', 'Mercoledì', '17:45 - 18:30', 'Corsia 1 Alta · Delfini', 'Luca', 'Vasca Nuoto', ''],
    ['t_30', 'Mercoledì', '17:45 - 18:30', 'Corsia 2 · 2 Corsia (Avanzate)', 'Elisa', 'Vasca Nuoto', ''],
    ['t_31', 'Mercoledì', '17:45 - 18:30', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_32', 'Mercoledì', '18:30 - 19:15', 'Corsia 1 · Acquagym', 'Laura', 'Fitness', ''],
    ['t_33', 'Mercoledì', '18:30 - 19:15', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_34', 'Mercoledì', '19:15 - 20:00', 'Corsia 1 · Hydrobike', 'Laura', 'Fitness', ''],
    ['t_35', 'Mercoledì', '19:15 - 20:00', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],

    // GIOVEDÌ
    ['t_36', 'Giovedì', '17:00 - 17:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Mariagiulia', 'Vasca Nuoto', ''],
    ['t_37', 'Giovedì', '17:00 - 17:45', 'Corsia 1 Alta · Delfini', 'Luca', 'Vasca Nuoto', ''],
    ['t_38', 'Giovedì', '17:00 - 17:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_39', 'Giovedì', '17:00 - 17:45', 'Vaschetta · Ambientamento', 'Sofia', 'Vaschetta', ''],
    ['t_40', 'Giovedì', '17:45 - 18:30', 'Corsia 1 Bassa · Tartarughe Marine', 'Mariagiulia', 'Vasca Nuoto', ''],
    ['t_41', 'Giovedì', '17:45 - 18:30', 'Corsia 4 · Esordienti C', 'Luca', 'Vasca Nuoto', ''],
    ['t_42', 'Giovedì', '17:45 - 18:30', 'Corsia 5 · Reclutamento', 'Luca', 'Vasca Nuoto', ''],
    ['t_43', 'Giovedì', '17:45 - 18:30', 'Vaschetta · Ambientamento', 'Sofia', 'Vaschetta', ''],
    ['t_44', 'Giovedì', '18:30 - 19:15', 'Corsie 1-2 · Ragazzi', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_45', 'Giovedì', '18:30 - 19:15', 'Corsie 4-5 · Agonistica', 'Luca', 'Vasca Nuoto', ''],
    ['t_46', 'Giovedì', '19:15 - 20:00', 'Corsie 1-2 · Master Adulti', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_47', 'Giovedì', '19:15 - 20:00', 'Corsie 4-5 · Agonistica', 'Luca', 'Vasca Nuoto', ''],

    // VENERDÌ
    ['t_48', 'Venerdì', '17:00 - 17:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Luca', 'Vasca Nuoto', ''],
    ['t_49', 'Venerdì', '17:00 - 17:45', 'Corsia 1 Alta · Delfini', 'Agata', 'Vasca Nuoto', ''],
    ['t_50', 'Venerdì', '17:00 - 17:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Elisa', 'Vasca Nuoto', ''],
    ['t_51', 'Venerdì', '17:00 - 17:45', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_52', 'Venerdì', '17:45 - 18:30', 'Corsia 1 Bassa · Tartarughe Marine', 'Agata', 'Vasca Nuoto', ''],
    ['t_53', 'Venerdì', '17:45 - 18:30', 'Corsia 1 Alta · Delfini', 'Elisa', 'Vasca Nuoto', ''],
    ['t_54', 'Venerdì', '17:45 - 18:30', 'Corsia 2 · 2 Corsia (Avanzate)', 'Luca', 'Vasca Nuoto', ''],
    ['t_55', 'Venerdì', '17:45 - 18:30', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_56', 'Venerdì', '18:30 - 19:15', 'Corsie 1-2 · Agonistica', 'Luca', 'Vasca Nuoto', ''],
    ['t_57', 'Venerdì', '18:30 - 19:15', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],
    ['t_58', 'Venerdì', '19:15 - 20:00', 'Corsie 1-2 · Agonistica', 'Luca', 'Vasca Nuoto', ''],
    ['t_59', 'Venerdì', '19:15 - 20:00', 'Corsie 4-5 · Agonistica', 'Riccardo', 'Vasca Nuoto', ''],

    // SABATO
    ['t_60', 'Sabato', '10:00 - 10:45', 'Corsia 1 Bassa · Tartarughe Marine', 'Elisa', 'Mattino', ''],
    ['t_61', 'Sabato', '10:00 - 10:45', 'Corsia 1 Alta · Delfini', 'Carlo', 'Mattino', ''],
    ['t_62', 'Sabato', '10:00 - 10:45', 'Corsia 2 · 2 Corsia (Avanzate)', 'Noemi', 'Mattino', ''],
    ['t_63', 'Sabato', '10:00 - 10:30', 'Vaschetta · Ambientamento', 'Sofia', 'Mattino', ''],
    ['t_64', 'Sabato', '10:30 - 11:00', 'Vaschetta · Ambientamento', 'Sofia', 'Mattino', ''],
    ['t_65', 'Sabato', '10:45 - 11:30', 'Corsia 1 Bassa · Tartarughe Marine', 'Carlo', 'Mattino', ''],
    ['t_66', 'Sabato', '10:45 - 11:30', 'Corsia 1 Alta · Delfini', 'Noemi', 'Mattino', ''],
    ['t_67', 'Sabato', '10:45 - 11:30', 'Corsia 2 · 2 Corsia (Avanzate)', 'Elisa', 'Mattino', ''],
    ['t_68', 'Sabato', '11:00 - 11:45', 'Vaschetta · Ambientamento', 'Sofia', 'Mattino', ''],
    ['t_69', 'Sabato', '11:45 - 12:30', 'Corsia 1 · Master Adulti', 'Noemi', 'Mattino', ''],
    ['t_70', 'Sabato', '11:45 - 12:30', 'Corsia 2 · Ragazzi', 'Noemi', 'Mattino', ''],
    ['t_71', 'Sabato', '12:30 - 13:15', 'Corsie 1-2 · Agonistica', 'Riccardo', 'Mattino', '']
  ];

  // Se i turni presenti sono meno di 40 (vecchia versione parziale), aggiorna automaticamente con l'orario completo
  if (sTurni.getLastRow() < 40) {
    var existingSubstitutes = {};
    if (sTurni.getLastRow() > 1) {
      var oldRows = sTurni.getDataRange().getValues();
      for (var o = 1; o < oldRows.length; o++) {
        var oldId = String(oldRows[o][0]);
        var oldSub = String(oldRows[o][6] || '');
        var oldNotes = String(oldRows[o][5] || '');
        if (oldSub || oldNotes) {
          existingSubstitutes[oldId] = { sub: oldSub, note: oldNotes };
        }
      }
    }
    sTurni.clearContents();
    sTurni.appendRow([
      'Id', 'Giorno', 'Orario', 'CorsiaGruppo', 'Istruttore', 'Note', 'Sostituto'
    ]);
    sTurni.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#dcfce7');
    sTurni.setFrozenRows(1);

    for (var i = 0; i < sampleTurni.length; i++) {
      var row = sampleTurni[i].slice();
      var rId = row[0];
      if (existingSubstitutes[rId]) {
        if (existingSubstitutes[rId].sub) row[6] = existingSubstitutes[rId].sub;
        if (existingSubstitutes[rId].note) row[5] = existingSubstitutes[rId].note;
      }
      sTurni.appendRow(row);
    }
  }

  // 4. Scheda BREVETTI (SCHEMA UFFICIALE DINAMICA SPORT)
  var sBrevetti = ss.getSheetByName('Brevetti') || ss.insertSheet('Brevetti');
  if (sBrevetti.getLastRow() === 0) {
    sBrevetti.appendRow([
      'LivelloId', 'NomeLivello', 'Icona', 'ColoreBadge', 'Descrizione', 'ProveTecniche', 'ProveSicurezza', 'Comportamento'
    ]);
    sBrevetti.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f3e8ff');
    sBrevetti.setFrozenRows(1);

    var sampleBrevetti = [
      [
        'liv_tarta',
        '1° BREVETTO TARTARUGHE MARINE',
        '🐢',
        '#059669',
        'Livello base di ambientamento, galleggiamento e prime propulsioni autonome a stile e dorso.',
        [
          'Battuta di gambe alla sbarra',
          'Immersione del volto',
          'Respirazioni statiche alla sbarra',
          'Galleggiamento supino (stellina)',
          'Galleggiamento prono',
          'Scivolamento supino con o senza gambe',
          'Scivolamento prono con o senza gambe',
          'Propulsione supino con prime bracciate',
          'Propulsione prono con prime bracciate',
          'Rotolamenti e capovolte con tappeto'
        ].join('\n'),
        [
          'Dalla posizione prona alla posizione supina',
          'Tuffo con ritorno al bordo'
        ].join('\n'),
        'Comportamento individuale (ascolto dell\'istruttore, rispetto della fila e dei compagni)'
      ],
      [
        'liv_delf',
        '2° BREVETTO DELFINI',
        '🐬',
        '#0284c7',
        'Livello intermedio di coordinazione e continuità nelle nuotate dorso e stile, introduzione all\'apnea e prove di sicurezza.',
        [
          'Respirazioni statiche alla sbarra',
          'Impostazione delle nuotate dorso e stile',
          'Brevi tratti in apnea',
          'Nuotate con passaggi',
          'Delfinizzazione',
          'Tuffo a chiodo, bomba o di testa in ginocchio'
        ].join('\n'),
        [
          'Caduta in acqua con galleggiamento supino',
          'Galleggiamento verticale',
          'Capovolte avanti',
          '25 metri nuotati in qualsiasi stile e tecnica',
          'Raccolta oggetti sul fondale (acqua bassa)',
          'Passaggio da prono a supino in avanzamento'
        ].join('\n'),
        'Comportamento individuale (disciplina, autonomia a bordo vasca e rispetto delle indicazioni)'
      ],
      [
        'liv_2corsia',
        '3° BREVETTO 2 CORSIA (CORSIE AVANZATE)',
        '🏊',
        '#6366f1',
        'Livello avanzato di padronanza dei 4 stili (stile, dorso, basi rana e delfino), virate, apnea prolungata e sicurezza in acqua alta.',
        [
          '25 metri dorso completo',
          '25 metri stile libero completo',
          'Impostazione nuotata rana',
          'Impostazione nuotata delfino',
          'Tuffo di testa dall\'alto',
          'Accenni di virate a stile libero e dorso',
          'Apnea oltre i 10 metri',
          'Raccolta oggetti sul fondale',
          'Remate in posizione supina testa e piedi'
        ].join('\n'),
        [
          'Galleggiamento verticale con mani fuori dall\'acqua',
          'Caduta in acqua dall\'alto con nuotata continua',
          'Immersione in acqua alta'
        ].join('\n'),
        'Comportamento individuale (spirito di squadra, costanza e rispetto delle corsie)'
      ]
    ];

    for (var j = 0; j < sampleBrevetti.length; j++) {
      sBrevetti.appendRow(sampleBrevetti[j]);
    }
  }

  // 5. Scheda PROFILI (PIN PERSONALI ISTRUTTORI)
  var sProfili = ss.getSheetByName('Profili') || ss.insertSheet('Profili');
  if (sProfili.getLastRow() === 0) {
    sProfili.appendRow(['Istruttore', 'Pin', 'DataCreazione', 'UltimoAccesso']);
    sProfili.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#fce7f3');
    sProfili.setFrozenRows(1);
  }

  // 6. Scheda VALUTAZIONI BREVETTI (STORICO ESAMI ALLIEVI)
  var sVal = ss.getSheetByName('ValutazioniBrevetti') || ss.insertSheet('ValutazioniBrevetti');
  if (sVal.getLastRow() === 0) {
    sVal.appendRow([
      'Id', 'Data', 'Allievo', 'LivelloId', 'LivelloNome', 'Istruttore', 'ProveSuperate', 'ProveTotali', 'Percentuale', 'Esito', 'DettaglioProveJson', 'Note'
    ]);
    sVal.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#f3e8ff');
    sVal.setFrozenRows(1);
  }

  // Rimuovi Foglio1 se vuoto
  var defSheet = ss.getSheetByName('Foglio1');
  if (defSheet && defSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defSheet); } catch (e) {}
  }
}

function doGet(e) {
  try {
    setupSheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Leggi Feedback
    var sFb = ss.getSheetByName('Feedback');
    var fbRows = sFb.getDataRange().getValues();
    var feedbacks = [];
    if (fbRows.length > 1) {
      for (var i = 1; i < fbRows.length; i++) {
        var r = fbRows[i];
        if (!r[0] && !r[7]) continue;
        if (String(r[0]).indexOf('fb_demo_') === 0) continue;
        var responses = [];
        try {
          if (r[8]) responses = JSON.parse(r[8]);
        } catch (err) {}

        var dtStr = r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1] || '');

        feedbacks.push({
          id: String(r[0] || ('fb_' + i)),
          date: dtStr,
          time: String(r[2] || ''),
          author: String(r[3] || 'Istruttore'),
          group: String(r[4] || ''),
          type: String(r[5] || 'positivo'),
          tags: String(r[6] || '').split(',').map(function(t) { return t.trim(); }).filter(Boolean),
          text: String(r[7] || ''),
          responses: responses,
          updatedAt: String(r[9] || '')
        });
      }
    }

    // 2. Leggi News
    var sNews = ss.getSheetByName('News');
    var newsRows = sNews.getDataRange().getValues();
    var newsList = [];
    if (newsRows.length > 1) {
      for (var j = 1; j < newsRows.length; j++) {
        var rn = newsRows[j];
        if (!rn[0] && !rn[2]) continue;
        if (String(rn[0]).indexOf('news_demo_') === 0 || String(rn[0]) === 'news_1' || String(rn[0]) === 'news_2' || String(rn[0]) === 'news_3') continue;
        var ndt = rn[1] instanceof Date ? Utilities.formatDate(rn[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(rn[1] || '');

        newsList.push({
          id: String(rn[0] || ('news_' + j)),
          date: ndt,
          title: String(rn[2] || ''),
          text: String(rn[3] || ''),
          author: String(rn[4] || 'Direzione'),
          category: String(rn[5] || 'avviso'),
          pinned: String(rn[6]).toLowerCase() === 'true',
          updatedAt: String(rn[7] || '')
        });
      }
    }

    // 3. Leggi Turni
    var sTurni = ss.getSheetByName('Turni');
    var turniRows = sTurni.getDataRange().getValues();
    var turniList = [];
    if (turniRows.length > 1) {
      for (var k = 1; k < turniRows.length; k++) {
        var rt = turniRows[k];
        if (!rt[0] && !rt[3]) continue;
        turniList.push({
          id: String(rt[0] || ('t_' + k)),
          day: String(rt[1] || ''),
          time: String(rt[2] || ''),
          laneGroup: String(rt[3] || ''),
          instructor: String(rt[4] || ''),
          notes: String(rt[5] || ''),
          substitute: String(rt[6] || '')
        });
      }
    }

    // 4. Leggi Brevetti
    var sBr = ss.getSheetByName('Brevetti');
    var brRows = sBr.getDataRange().getValues();
    var brevettiList = [];
    if (brRows.length > 1) {
      for (var m = 1; m < brRows.length; m++) {
        var rb = brRows[m];
        if (!rb[0] && !rb[1]) continue;
        brevettiList.push({
          id: String(rb[0] || ('liv_' + m)),
          name: String(rb[1] || ''),
          icon: String(rb[2] || '🏊'),
          badgeColor: String(rb[3] || '#0284c7'),
          description: String(rb[4] || ''),
          technicalTests: String(rb[5] || '').split('\n').filter(Boolean),
          safetyTests: String(rb[6] || '').split('\n').filter(Boolean),
          behavior: String(rb[7] || '')
        });
      }
    }

    // 5. Leggi Profili (PIN)
    var sProfili = ss.getSheetByName('Profili');
    var profRows = sProfili ? sProfili.getDataRange().getValues() : [];
    var profiliList = [];
    if (profRows.length > 1) {
      for (var p = 1; p < profRows.length; p++) {
        var rp = profRows[p];
        if (!rp[0]) continue;
        profiliList.push({
          instructor: String(rp[0]),
          pin: String(rp[1] || ''),
          createdAt: String(rp[2] || ''),
          lastLogin: String(rp[3] || '')
        });
      }
    }

    // 6. Leggi Valutazioni Brevetti (Storico Allievi)
    var sVal = ss.getSheetByName('ValutazioniBrevetti');
    var valRows = sVal ? sVal.getDataRange().getValues() : [];
    var valutazioniList = [];
    if (valRows.length > 1) {
      for (var v = 1; v < valRows.length; v++) {
        var rv = valRows[v];
        if (!rv[0] && !rv[2]) continue;
        var vDate = rv[1] instanceof Date ? Utilities.formatDate(rv[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(rv[1] || '');
        var det = [];
        try { if (rv[10]) det = JSON.parse(rv[10]); } catch (e) {}
        valutazioniList.push({
          id: String(rv[0] || ('eval_' + v)),
          date: vDate,
          allievo: String(rv[2] || ''),
          livelloId: String(rv[3] || ''),
          livelloNome: String(rv[4] || ''),
          instructor: String(rv[5] || ''),
          passedTests: Number(rv[6] || 0),
          totalTests: Number(rv[7] || 0),
          percentage: Number(rv[8] || 0),
          esito: String(rv[9] || 'Idoneo'),
          checkedTests: det,
          notes: String(rv[11] || '')
        });
      }
    }

    var payload = {
      success: true,
      timestamp: new Date().toISOString(),
      feedback: feedbacks.reverse(),
      news: newsList.reverse(),
      turni: turniList,
      brevetti: brevettiList,
      profili: profiliList,
      valutazioni: valutazioniList.reverse()
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    setupSheet();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = data.action || 'save_feedback';

    // 1. SALVA FEEDBACK
    if (action === 'save_feedback') {
      var sFb = ss.getSheetByName('Feedback');
      var item = data.feedback || data;
      var id = item.id || ('fb_' + new Date().getTime());
      var date = item.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var time = item.time || '';
      var author = item.author || 'Istruttore';
      var group = item.group || '';
      var type = item.type || 'positivo';
      var tags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
      var text = item.text || '';
      var responsesJson = typeof item.responses === 'string' ? item.responses : JSON.stringify(item.responses || []);
      var updatedAt = new Date().toISOString();

      var rows = sFb.getDataRange().getValues();
      var foundRow = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(id)) {
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow > 0) {
        sFb.getRange(foundRow, 1, 1, 10).setValues([[
          id, date, time, author, group, type, tags, text, responsesJson, updatedAt
        ]]);
      } else {
        sFb.appendRow([
          id, date, time, author, group, type, tags, text, responsesJson, updatedAt
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'saved_feedback', id: id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. RISPONDI A FEEDBACK
    if (action === 'reply_feedback') {
      var sFbR = ss.getSheetByName('Feedback');
      var fbId = data.feedbackId;
      var newReply = data.reply;
      if (!fbId || !newReply || !newReply.text) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Dati risposta mancanti' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var rowsR = sFbR.getDataRange().getValues();
      var targetRow = -1;
      var existingReplies = [];

      for (var r = 1; r < rowsR.length; r++) {
        if (String(rowsR[r][0]) === String(fbId)) {
          targetRow = r + 1;
          try {
            if (rowsR[r][8]) existingReplies = JSON.parse(rowsR[r][8]);
          } catch(e) {}
          break;
        }
      }

      if (targetRow > 0) {
        newReply.id = newReply.id || ('rep_' + new Date().getTime());
        newReply.date = newReply.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
        existingReplies.push(newReply);

        sFbR.getRange(targetRow, 9).setValue(JSON.stringify(existingReplies));
        sFbR.getRange(targetRow, 10).setValue(new Date().toISOString());

        return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'replied', reply: newReply }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Feedback non trovato' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. ELIMINA FEEDBACK
    if (action === 'delete_feedback') {
      var sFbD = ss.getSheetByName('Feedback');
      var delId = data.id;
      var rowsD = sFbD.getDataRange().getValues();
      for (var d = 1; d < rowsD.length; d++) {
        if (String(rowsD[d][0]) === String(delId)) {
          sFbD.deleteRow(d + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'deleted_feedback' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Elemento non trovato' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. SALVA NEWS
    if (action === 'save_news') {
      var sNw = ss.getSheetByName('News');
      var n = data.news || data;
      var nId = n.id || ('news_' + new Date().getTime());
      var nDate = n.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var nTitle = n.title || '';
      var nText = n.text || '';
      var nAuthor = n.author || 'Direzione Vasca';
      var nCategory = n.category || 'avviso';
      var nPinned = String(n.pinned) === 'true' ? 'true' : 'false';
      var nUpdated = new Date().toISOString();

      var rowsNw = sNw.getDataRange().getValues();
      var foundNw = -1;
      for (var w = 1; w < rowsNw.length; w++) {
        if (String(rowsNw[w][0]) === String(nId)) {
          foundNw = w + 1;
          break;
        }
      }

      if (foundNw > 0) {
        sNw.getRange(foundNw, 1, 1, 8).setValues([[
          nId, nDate, nTitle, nText, nAuthor, nCategory, nPinned, nUpdated
        ]]);
      } else {
        sNw.appendRow([
          nId, nDate, nTitle, nText, nAuthor, nCategory, nPinned, nUpdated
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'saved_news', id: nId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. AGGIORNA TURNO / SOSTITUTO
    if (action === 'update_turno') {
      var sTu = ss.getSheetByName('Turni');
      var tId = data.id;
      var sub = data.substitute || '';
      var note = data.notes || '';
      var day = data.day || '';
      var time = data.time || '';
      var laneGroup = data.laneGroup || '';
      var instructor = data.instructor || '';

      var rowsTu = sTu.getDataRange().getValues();
      for (var tu = 1; tu < rowsTu.length; tu++) {
        if (String(rowsTu[tu][0]) === String(tId)) {
          if (sub !== undefined) sTu.getRange(tu + 1, 7).setValue(sub);
          if (note !== undefined) sTu.getRange(tu + 1, 6).setValue(note);
          return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'updated_turno' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Se non ancora presente nel foglio, aggiungi il turno
      sTu.appendRow([tId, day, time, laneGroup, instructor, note, sub]);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'appended_turno' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. SALVA / IMPOSTA PIN PROFILO ISTRUTTORE
    if (action === 'save_pin') {
      var sPr = ss.getSheetByName('Profili');
      var instr = data.instructor;
      var pin = String(data.pin || '').trim();
      var pRows = sPr.getDataRange().getValues();
      var foundP = -1;
      for (var pi = 1; pi < pRows.length; pi++) {
        if (String(pRows[pi][0]).toLowerCase() === String(instr).toLowerCase()) {
          foundP = pi + 1;
          break;
        }
      }
      var nowIso = new Date().toISOString();
      if (foundP > 0) {
        sPr.getRange(foundP, 2).setValue(pin);
        sPr.getRange(foundP, 4).setValue(nowIso);
      } else {
        sPr.appendRow([instr, pin, nowIso, nowIso]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'saved_pin', instructor: instr }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7. RESET PIN PROFILO (COORDINATORE)
    if (action === 'reset_pin') {
      var sPrReset = ss.getSheetByName('Profili');
      var instrReset = data.instructor;
      var prRows = sPrReset.getDataRange().getValues();
      for (var pri = 1; pri < prRows.length; pri++) {
        if (String(prRows[pri][0]).toLowerCase() === String(instrReset).toLowerCase()) {
          sPrReset.getRange(pri + 1, 2).setValue('');
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'reset_pin', instructor: instrReset }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 8. SALVA VALUTAZIONE ALLIEVO (BREVETTI)
    if (action === 'save_valutazione_brevetto') {
      var sV = ss.getSheetByName('ValutazioniBrevetti');
      var val = data.valutazione || data;
      var vId = val.id || ('eval_' + new Date().getTime());
      var vDate = val.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var vAllievo = val.allievo || '';
      var vLivId = val.livelloId || '';
      var vLivNome = val.livelloNome || '';
      var vInstr = val.instructor || '';
      var vPass = val.passedTests || 0;
      var vTot = val.totalTests || 0;
      var vPct = val.percentage || 0;
      var vEsito = val.esito || 'Idoneo';
      var vDetJson = typeof val.checkedTests === 'string' ? val.checkedTests : JSON.stringify(val.checkedTests || []);
      var vNote = val.notes || '';

      sV.appendRow([
        vId, vDate, vAllievo, vLivId, vLivNome, vInstr, vPass, vTot, vPct, vEsito, vDetJson, vNote
      ]);

      return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'saved_valutazione', id: vId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 9. ELIMINA VALUTAZIONE ALLIEVO (COORDINATORE)
    if (action === 'delete_valutazione_brevetto') {
      var sVDel = ss.getSheetByName('ValutazioniBrevetti');
      var delVId = data.id;
      var vr = sVDel.getDataRange().getValues();
      for (var vi = 1; vi < vr.length; vi++) {
        if (String(vr[vi][0]) === String(delVId)) {
          sVDel.deleteRow(vi + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, action: 'deleted_valutazione' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Azione non riconosciuta' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
