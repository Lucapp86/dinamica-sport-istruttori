/**
 * DINAMICA SPORT · STAFF ISTRUTTORI
 * Architettura PWA Mobile-First con sincronizzazione Live Google Sheets
 * Schemario Ufficiale Brevetti: TARTARUGHE MARINE, DELFINI e 2 CORSIA
 */

(function () {
  'use strict';

  // =========================================================================
  // STATO GLOBALE DELL'APPLICAZIONE
  // =========================================================================
  const state = {
    config: {
      clubName: 'Dinamica Sport · Staff Istruttori',
      coordinatorPinHash: 'e496e7378047eb3dbdfb134e1e23f66dfdf521086b42164a60ca0f8144079113',
      apiUrl: 'https://script.google.com/macros/s/AKfycbyoMPGp7PUtlbDRmU5M0fVcKGrUYgc6A8wYYmzpxAD3HODUdEBvwEuaDUtnJyfw-con/exec',
      syncIntervalSeconds: 20,
      instructors: [
        'Luca', 'Riccardo', 'Mariagiulia', 'Elisa', 'Agata', 'Carlo', 'Sara', 'Noemi', 'Sofia', 'Laura', 'Giulia'
      ],
      groups: [
        'Tartarughe Marine',
        'Delfini',
        '2 Corsia (Avanzate)',
        'Vaschetta (Ambientamento)',
        'Esordienti C',
        'Reclutamento',
        'Agonistica',
        'Ragazzi',
        'Master Adulti',
        'Hydrobike & Acquagym'
      ],
      quickTags: [
        'Gestione fila',
        'Esercizio riuscito',
        'Difficoltà ascolto',
        'Ambientamento',
        'Respirazione sbarra',
        'Gambe stile/dorso',
        'Bracciata e scivolamento',
        'Gamba rana',
        'Delfinizzazione',
        'Tuffi dal blocco',
        'Capovolte e rotolamenti',
        'Apnea',
        'Gioco fine lezione',
        'Sicurezza vasca'
      ]
    },
    user: {
      name: localStorage.getItem('dinamica_my_name') || '',
      isCoordinator: localStorage.getItem('dinamica_is_coordinator') === 'true',
      isLoggedIn: localStorage.getItem('dinamica_logged_in') === 'true'
    },
    profiles: {},
    valutazioni: [],
    activeSubtabBrevetti: 'subtab-schede',
    statFilterLevel: 'all',
    statSearchStudent: '',
    feedbacks: [],
    news: [],
    turni: [],
    brevetti: [],
    activeTab: 'tab-feedback',
    feedbackFilter: 'all',
    feedbackSearch: '',
    selectedDay: 'Lunedì',
    selectedShiftInstructor: 'all',
    selectedBrevetto: 'all',
    brevettoSearch: '',
    checkedEvaluations: new Set(),
    syncTimer: null,
    isSyncing: false
  };

  // =========================================================================
  // DATI UFFICIALI PREDEFINITI (Brevetti Dinamica Sport, Turni reali & News)
  // =========================================================================
  const DEFAULT_DATA = {
    brevetti: [
      {
        id: 'liv_tarta',
        name: '1° BREVETTO TARTARUGHE MARINE',
        icon: '🐢',
        badgeColor: '#059669',
        description: 'Livello base di ambientamento, immersione, galleggiamento e prime propulsioni autonome a stile e dorso.',
        technicalTests: [
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
        ],
        safetyTests: [
          'Dalla posizione prona alla posizione supina',
          'Tuffo con ritorno al bordo'
        ],
        behavior: 'Comportamento individuale (ascolto dell\'istruttore, rispetto della fila e dei compagni di corsia)'
      },
      {
        id: 'liv_delf',
        name: '2° BREVETTO DELFINI',
        icon: '🐬',
        badgeColor: '#0284c7',
        description: 'Livello intermedio di coordinazione e continuità nelle nuotate dorso e stile, introduzione all\'apnea e prove di sicurezza.',
        technicalTests: [
          'Respirazioni statiche alla sbarra',
          'Impostazione delle nuotate dorso e stile',
          'Brevi tratti in apnea',
          'Nuotate con passaggi',
          'Delfinizzazione',
          'Tuffo a chiodo, bomba o di testa in ginocchio'
        ],
        safetyTests: [
          'Caduta in acqua con galleggiamento supino',
          'Galleggiamento verticale',
          'Capovolte avanti',
          '25 metri nuotati in qualsiasi stile e tecnica',
          'Raccolta oggetti sul fondale (acqua bassa)',
          'Passaggio da prono a supino in avanzamento'
        ],
        behavior: 'Comportamento individuale (disciplina, autonomia a bordo vasca e rispetto delle indicazioni)'
      },
      {
        id: 'liv_2corsia',
        name: '3° BREVETTO 2 CORSIA (CORSIE AVANZATE)',
        icon: '🏊',
        badgeColor: '#6366f1',
        description: 'Livello avanzato di padronanza dei 4 stili (stile, dorso, basi rana e delfino), virate, apnea prolungata e sicurezza in acqua alta.',
        technicalTests: [
          '25 metri dorso completo',
          '25 metri stile libero completo',
          'Impostazione nuotata rana',
          'Impostazione nuotata delfino',
          'Tuffo di testa dall\'alto',
          'Accenni di virate a stile libero e dorso',
          'Apnea oltre i 10 metri',
          'Raccolta oggetti sul fondale',
          'Remate in posizione supina testa e piedi'
        ],
        safetyTests: [
          'Galleggiamento verticale con mani fuori dall\'acqua',
          'Caduta in acqua dall\'alto con nuotata continua',
          'Immersione in acqua alta'
        ],
        behavior: 'Comportamento individuale (spirito di squadra, costanza e rispetto delle corsie)'
      }
    ],

    turni: [
      // LUNEDÌ
      { id: 't_1', day: 'Lunedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_2', day: 'Lunedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Carlo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_3', day: 'Lunedì', time: '17:00 - 17:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Agata', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_4', day: 'Lunedì', time: '17:00 - 17:45', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_5', day: 'Lunedì', time: '17:45 - 18:30', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Agata', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_6', day: 'Lunedì', time: '17:45 - 18:30', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_7', day: 'Lunedì', time: '17:45 - 18:30', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Carlo', notes: 'Vaschetta', substitute: '' },
      { id: 't_8', day: 'Lunedì', time: '18:30 - 19:15', laneGroup: 'Corsia 1 · Hydrobike', instructor: 'Laura', notes: 'Fitness', substitute: '' },
      { id: 't_9', day: 'Lunedì', time: '18:30 - 19:15', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_10', day: 'Lunedì', time: '19:15 - 20:00', laneGroup: 'Corsia 1 · Acquagym', instructor: 'Laura', notes: 'Fitness', substitute: '' },
      { id: 't_11', day: 'Lunedì', time: '19:15 - 20:00', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },

      // MARTEDÌ
      { id: 't_12', day: 'Martedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_13', day: 'Martedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Mariagiulia', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_14', day: 'Martedì', time: '17:00 - 17:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_15', day: 'Martedì', time: '17:00 - 17:45', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sara', notes: 'Vaschetta', substitute: '' },
      { id: 't_16', day: 'Martedì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_17', day: 'Martedì', time: '17:45 - 18:30', laneGroup: 'Corsia 4 · Esordienti C', instructor: 'Mariagiulia', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_18', day: 'Martedì', time: '17:45 - 18:30', laneGroup: 'Corsia 5 · Reclutamento', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_19', day: 'Martedì', time: '17:45 - 18:30', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sara', notes: 'Vaschetta', substitute: '' },
      { id: 't_20', day: 'Martedì', time: '18:30 - 19:15', laneGroup: 'Corsie 1-2 · Ragazzi', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_21', day: 'Martedì', time: '18:30 - 19:15', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_22', day: 'Martedì', time: '19:15 - 20:00', laneGroup: 'Corsie 1-2 · Master Adulti', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_23', day: 'Martedì', time: '19:15 - 20:00', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },

      // MERCOLEDÌ
      { id: 't_24', day: 'Mercoledì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_25', day: 'Mercoledì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Elisa', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_26', day: 'Mercoledì', time: '17:00 - 17:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Sara', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_27', day: 'Mercoledì', time: '17:00 - 17:45', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_28', day: 'Mercoledì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Sara', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_29', day: 'Mercoledì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_30', day: 'Mercoledì', time: '17:45 - 18:30', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Elisa', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_31', day: 'Mercoledì', time: '17:45 - 18:30', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_32', day: 'Mercoledì', time: '18:30 - 19:15', laneGroup: 'Corsia 1 · Acquagym', instructor: 'Laura', notes: 'Fitness', substitute: '' },
      { id: 't_33', day: 'Mercoledì', time: '18:30 - 19:15', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_34', day: 'Mercoledì', time: '19:15 - 20:00', laneGroup: 'Corsia 1 · Hydrobike', instructor: 'Laura', notes: 'Fitness', substitute: '' },
      { id: 't_35', day: 'Mercoledì', time: '19:15 - 20:00', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },

      // GIOVEDÌ
      { id: 't_36', day: 'Giovedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Mariagiulia', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_37', day: 'Giovedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_38', day: 'Giovedì', time: '17:00 - 17:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_39', day: 'Giovedì', time: '17:00 - 17:45', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sofia', notes: 'Vaschetta', substitute: '' },
      { id: 't_40', day: 'Giovedì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Mariagiulia', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_41', day: 'Giovedì', time: '17:45 - 18:30', laneGroup: 'Corsia 4 · Esordienti C', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_42', day: 'Giovedì', time: '17:45 - 18:30', laneGroup: 'Corsia 5 · Reclutamento', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_43', day: 'Giovedì', time: '17:45 - 18:30', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sofia', notes: 'Vaschetta', substitute: '' },
      { id: 't_44', day: 'Giovedì', time: '18:30 - 19:15', laneGroup: 'Corsie 1-2 · Ragazzi', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_45', day: 'Giovedì', time: '18:30 - 19:15', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_46', day: 'Giovedì', time: '19:15 - 20:00', laneGroup: 'Corsie 1-2 · Master Adulti', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_47', day: 'Giovedì', time: '19:15 - 20:00', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },

      // VENERDÌ
      { id: 't_48', day: 'Venerdì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_49', day: 'Venerdì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Agata', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_50', day: 'Venerdì', time: '17:00 - 17:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Elisa', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_51', day: 'Venerdì', time: '17:00 - 17:45', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_52', day: 'Venerdì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Agata', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_53', day: 'Venerdì', time: '17:45 - 18:30', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Elisa', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_54', day: 'Venerdì', time: '17:45 - 18:30', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_55', day: 'Venerdì', time: '17:45 - 18:30', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_56', day: 'Venerdì', time: '18:30 - 19:15', laneGroup: 'Corsie 1-2 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_57', day: 'Venerdì', time: '18:30 - 19:15', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_58', day: 'Venerdì', time: '19:15 - 20:00', laneGroup: 'Corsie 1-2 · Agonistica', instructor: 'Luca', notes: 'Vasca Nuoto', substitute: '' },
      { id: 't_59', day: 'Venerdì', time: '19:15 - 20:00', laneGroup: 'Corsie 4-5 · Agonistica', instructor: 'Riccardo', notes: 'Vasca Nuoto', substitute: '' },

      // SABATO
      { id: 't_60', day: 'Sabato', time: '10:00 - 10:45', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Elisa', notes: 'Mattino', substitute: '' },
      { id: 't_61', day: 'Sabato', time: '10:00 - 10:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Carlo', notes: 'Mattino', substitute: '' },
      { id: 't_62', day: 'Sabato', time: '10:00 - 10:45', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Noemi', notes: 'Mattino', substitute: '' },
      { id: 't_63', day: 'Sabato', time: '10:00 - 10:30', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sofia', notes: 'Mattino', substitute: '' },
      { id: 't_64', day: 'Sabato', time: '10:30 - 11:00', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sofia', notes: 'Mattino', substitute: '' },
      { id: 't_65', day: 'Sabato', time: '10:45 - 11:30', laneGroup: 'Corsia 1 Bassa · Tartarughe Marine', instructor: 'Carlo', notes: 'Mattino', substitute: '' },
      { id: 't_66', day: 'Sabato', time: '10:45 - 11:30', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Noemi', notes: 'Mattino', substitute: '' },
      { id: 't_67', day: 'Sabato', time: '10:45 - 11:30', laneGroup: 'Corsia 2 · 2 Corsia (Avanzate)', instructor: 'Elisa', notes: 'Mattino', substitute: '' },
      { id: 't_68', day: 'Sabato', time: '11:00 - 11:45', laneGroup: 'Vaschetta · Ambientamento', instructor: 'Sofia', notes: 'Mattino', substitute: '' },
      { id: 't_69', day: 'Sabato', time: '11:45 - 12:30', laneGroup: 'Corsia 1 · Master Adulti', instructor: 'Noemi', notes: 'Mattino', substitute: '' },
      { id: 't_70', day: 'Sabato', time: '11:45 - 12:30', laneGroup: 'Corsia 2 · Ragazzi', instructor: 'Noemi', notes: 'Mattino', substitute: '' },
      { id: 't_71', day: 'Sabato', time: '12:30 - 13:15', laneGroup: 'Corsie 1-2 · Agonistica', instructor: 'Riccardo', notes: 'Mattino', substitute: '' }
    ],

    news: [],

    feedbacks: []
  };

  // =========================================================================
  // SICUREZZA & HASH CRITTOGRAFICO PIN (SHA-256)
  // =========================================================================
  async function hashPin(pin, salt = '') {
    try {
      if (!pin) return '';
      const text = salt + String(pin).trim();
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('SubtleCrypto error:', err);
      return 'hash_' + String(pin).trim();
    }
  }

  // =========================================================================
  // INIZIALIZZAZIONE APPLICAZIONE
  // =========================================================================
  async function initApp() {
    loadLocalSettings();
    loadLocalData();
    await fetchConfigJson();
    setupEventListeners();
    populateSelectOptions();
    initBrevettiSubtabs();
    initEvaluationForm();
    updateUserView();
    renderAll();

    if (state.config.apiUrl) {
      syncWithGoogleSheets(true);
    }
    startAutoSync();

    // Se l'utente non ha ancora completato l'accesso col proprio profilo, apri il modale login
    if (!state.user.isLoggedIn || !state.user.name) {
      openLoginModal();
    }
  }

  function loadLocalSettings() {
    const savedApiUrl = localStorage.getItem('dinamica_api_url');
    if (savedApiUrl) state.config.apiUrl = savedApiUrl;

    const savedName = localStorage.getItem('dinamica_my_name');
    if (savedName) {
      if (savedName === 'Mariagrazia' || savedName === 'Mariag.') state.user.name = 'Mariagiulia';
      else if (savedName === 'Robaldo') state.user.name = 'Riccardo';
      else state.user.name = savedName;
    }

    const savedCoord = localStorage.getItem('dinamica_is_coordinator');
    // La modalità coordinatore è concessa ESCLUSIVAMENTE a Luca
    state.user.isCoordinator = ((state.user.name || '').toLowerCase() === 'luca') && (savedCoord === 'true');

    const savedLoggedIn = localStorage.getItem('dinamica_logged_in');
    state.user.isLoggedIn = savedLoggedIn === 'true' && Boolean(state.user.name);
  }

  function loadLocalData() {
    try {
      const storedProfiles = localStorage.getItem('dinamica_profiles');
      state.profiles = storedProfiles ? JSON.parse(storedProfiles) : {};

      const storedVal = localStorage.getItem('dinamica_valutazioni');
      state.valutazioni = storedVal ? JSON.parse(storedVal) : [];

      const storedFb = localStorage.getItem('dinamica_feedbacks');
      state.feedbacks = storedFb ? JSON.parse(storedFb) : [];

      // Rimuovi commenti e feedback di prova
      state.feedbacks = (state.feedbacks || []).filter(f => 
        !f.id.startsWith('fb_demo_') && 
        f.id !== 'fb_1' && 
        f.id !== 'fb_2' && 
        f.id !== 'fb_3'
      );

      const storedNews = localStorage.getItem('dinamica_news');
      state.news = storedNews ? JSON.parse(storedNews) : [];
      // Rimuovi comunicazioni di prova
      state.news = (state.news || []).filter(n =>
        !n.id.startsWith('news_demo_') &&
        n.id !== 'news_1' &&
        n.id !== 'news_2' &&
        n.id !== 'news_3'
      );

      const storedTurni = localStorage.getItem('dinamica_turni');
      if (storedTurni) {
        try {
          const parsed = JSON.parse(storedTurni);
          const storedMap = new Map();
          parsed.forEach(t => {
            if (t.id) storedMap.set(String(t.id), t);
            const key = `${t.day}_${t.time}_${t.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            storedMap.set(key, t);
          });
          state.turni = DEFAULT_DATA.turni.map(defT => {
            const key = `${defT.day}_${defT.time}_${defT.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const st = storedMap.get(String(defT.id)) || storedMap.get(key);
            if (st) {
              return {
                ...defT,
                substitute: st.substitute || defT.substitute || '',
                notes: st.notes || defT.notes || ''
              };
            }
            return { ...defT };
          });
        } catch (e) {
          state.turni = DEFAULT_DATA.turni.map(t => ({ ...t }));
        }
      } else {
        state.turni = DEFAULT_DATA.turni.map(t => ({ ...t }));
      }

      const storedBr = localStorage.getItem('dinamica_brevetti_v2');
      state.brevetti = storedBr ? JSON.parse(storedBr) : [...DEFAULT_DATA.brevetti];
    } catch (e) {
      console.warn('Errore lettura localStorage, uso dati default:', e);
      state.feedbacks = [];
      state.news = [...DEFAULT_DATA.news];
      state.turni = DEFAULT_DATA.turni.map(t => ({ ...t }));
      state.brevetti = [...DEFAULT_DATA.brevetti];
    }

    // Assicura la presenza della corsia Delfini su Lunedì
    if (!state.turni.some(t => t.day === 'Lunedì' && t.laneGroup.includes('Delfini'))) {
      state.turni.splice(1, 0, { id: 't_1_delf', day: 'Lunedì', time: '17:00 - 17:45', laneGroup: 'Corsia 1 Alta · Delfini', instructor: 'Carlo', notes: 'Vasca Nuoto', substitute: '' });
    }

    // Normalizzazione automatica nomi (Mariagiulia e Riccardo)
    state.turni.forEach(t => {
      if (t.instructor === 'Mariagrazia' || t.instructor === 'Mariag.') t.instructor = 'Mariagiulia';
      if (t.instructor === 'Robaldo') t.instructor = 'Riccardo';
      if (t.substitute === 'Mariagrazia' || t.substitute === 'Mariag.') t.substitute = 'Mariagiulia';
      if (t.substitute === 'Robaldo') t.substitute = 'Riccardo';
    });
    state.feedbacks.forEach(f => {
      if (f.author === 'Mariagrazia' || f.author === 'Mariag.') f.author = 'Mariagiulia';
      if (f.author === 'Robaldo') f.author = 'Riccardo';
      if (Array.isArray(f.responses)) {
        f.responses.forEach(r => {
          if (r.author === 'Mariagrazia' || r.author === 'Mariag.') r.author = 'Mariagiulia';
          if (r.author === 'Robaldo') r.author = 'Riccardo';
        });
      }
    });

    saveLocalData();
  }

  function saveLocalData() {
    try {
      localStorage.setItem('dinamica_feedbacks', JSON.stringify(state.feedbacks));
      localStorage.setItem('dinamica_news', JSON.stringify(state.news));
      localStorage.setItem('dinamica_turni', JSON.stringify(state.turni));
      localStorage.setItem('dinamica_brevetti_v2', JSON.stringify(state.brevetti));
      localStorage.setItem('dinamica_profiles', JSON.stringify(state.profiles));
      localStorage.setItem('dinamica_valutazioni', JSON.stringify(state.valutazioni));
    } catch (e) {
      console.error('Errore scrittura localStorage:', e);
    }
  }

  async function fetchConfigJson() {
    try {
      const resp = await fetch('config.json');
      if (resp.ok) {
        const json = await resp.json();
        if (json.clubName) state.config.clubName = json.clubName;
        if (json.coordinatorPinHash) state.config.coordinatorPinHash = json.coordinatorPinHash;
        if (json.apiUrl && !state.config.apiUrl) state.config.apiUrl = json.apiUrl;
        if (json.instructors) state.config.instructors = json.instructors;
        if (json.groups) state.config.groups = json.groups;
        if (json.quickTags) state.config.quickTags = json.quickTags;
      }
    } catch (e) {
      // Ignora errore se offline
    }
  }

  // =========================================================================
  // SINCRONIZZAZIONE CON GOOGLE SHEETS
  // =========================================================================
  async function syncWithGoogleSheets(silent = false) {
    if (!state.config.apiUrl) {
      updateSyncBadge('idle', 'Offline (Locale)');
      return;
    }

    if (state.isSyncing) return;
    state.isSyncing = true;
    updateSyncBadge('syncing', 'Sincronizzazione...');

    try {
      const resp = await fetch(state.config.apiUrl + (state.config.apiUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), {
        method: 'GET',
        mode: 'cors'
      });

      if (!resp.ok) throw new Error('Risposta HTTP: ' + resp.status);
      const data = await resp.json();

      if (data.success) {
        if (Array.isArray(data.feedback)) {
          state.feedbacks = data.feedback.filter(f => 
            !f.id.startsWith('fb_demo_') && 
            f.id !== 'fb_1' && 
            f.id !== 'fb_2' && 
            f.id !== 'fb_3'
          );
        }
        if (Array.isArray(data.news)) {
          state.news = data.news.filter(n => 
            !n.id.startsWith('news_demo_') && 
            n.id !== 'news_1' && 
            n.id !== 'news_2' && 
            n.id !== 'news_3'
          );
        }
        if (Array.isArray(data.turni) && data.turni.length > 0) {
          const sheetMapById = new Map();
          const sheetMapByKey = new Map();
          data.turni.forEach(t => {
            if (t.id) sheetMapById.set(String(t.id), t);
            const key = `${t.day}_${t.time}_${t.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            sheetMapByKey.set(key, t);
          });

          // Unisci i turni del foglio con l'orario ufficiale completo di 71 turni
          const mergedTurni = DEFAULT_DATA.turni.map(defT => {
            const key = `${defT.day}_${defT.time}_${defT.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fromSheet = sheetMapById.get(String(defT.id)) || sheetMapByKey.get(key);
            if (fromSheet) {
              return {
                ...defT,
                instructor: fromSheet.instructor || defT.instructor,
                substitute: fromSheet.substitute || defT.substitute || '',
                notes: fromSheet.notes || defT.notes || ''
              };
            }
            return { ...defT };
          });

          // Aggiungi eventuali turni custom inseriti a mano sul foglio Google
          data.turni.forEach(t => {
            const key = `${t.day}_${t.time}_${t.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const exists = DEFAULT_DATA.turni.some(defT =>
              String(defT.id) === String(t.id) ||
              `${defT.day}_${defT.time}_${defT.laneGroup}`.toLowerCase().replace(/[^a-z0-9]/g, '') === key
            );
            if (!exists) {
              mergedTurni.push(t);
            }
          });

          state.turni = mergedTurni;
        }
        if (Array.isArray(data.brevetti) && data.brevetti.length > 0) {
          state.brevetti = data.brevetti;
        }
        if (data.profili && typeof data.profili === 'object') {
          state.profiles = { ...state.profiles, ...data.profili };
        }
        if (Array.isArray(data.valutazioni)) {
          state.valutazioni = data.valutazioni;
        }

        saveLocalData();
        renderAll();
        updateSyncBadge('online', 'Live Sincronizzato');
        if (!silent) showToast('✓ Dati sincronizzati con Google Sheets!');
      } else {
        throw new Error(data.error || 'Risposta non valida dal foglio Google');
      }
    } catch (err) {
      console.warn('Errore sync Google Sheets:', err);
      updateSyncBadge('error', 'Sync non riuscito');
      if (!silent) showToast('⚠️ Connessione al foglio non riuscita. Verificato l\'URL?', true);
    } finally {
      state.isSyncing = false;
    }
  }

  async function postToGoogleSheets(payload) {
    if (!state.config.apiUrl) return false;
    try {
      updateSyncBadge('syncing', 'Invio dati...');
      await fetch(state.config.apiUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setTimeout(() => syncWithGoogleSheets(true), 1200);
      return true;
    } catch (err) {
      console.error('Errore post Google Apps Script:', err);
      return false;
    }
  }

  function startAutoSync() {
    if (state.syncTimer) clearInterval(state.syncTimer);
    const interval = (state.config.syncIntervalSeconds || 20) * 1000;
    state.syncTimer = setInterval(() => {
      if (!document.hidden && state.config.apiUrl) {
        syncWithGoogleSheets(true);
      }
    }, interval);
  }

  function updateSyncBadge(status, text) {
    const dot = document.getElementById('sync-dot');
    const label = document.getElementById('sync-text');
    if (!dot || !label) return;

    dot.className = 'sync-dot';
    if (status === 'syncing') dot.classList.add('syncing');
    else if (status === 'error') dot.classList.add('offline');

    label.textContent = text;
  }

  // =========================================================================
  // RENDERING DELLE VISTE
  // =========================================================================
  function renderAll() {
    const clubTitle = document.getElementById('app-club-name');
    if (clubTitle) clubTitle.textContent = state.config.clubName;

    updateUserView();
    renderFeedbacks();
    renderTurni();
    renderNews();
    renderBrevetti();
    renderBrevettiStats();
    updateBadges();
  }

  function updateUserView() {
    const isLuca = (state.user.name || '').trim().toLowerCase() === 'luca';
    if (!isLuca) {
      state.user.isCoordinator = false;
      localStorage.setItem('dinamica_is_coordinator', 'false');
    }

    const coordLabel = document.getElementById('coordinator-status-label');
    if (coordLabel) {
      coordLabel.textContent = (isLuca && state.user.isCoordinator) ? '👑 Coordinatore (Luca)' : '👤 ' + (state.user.name || 'Accedi');
    }

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.style.display = isLuca ? 'inline-flex' : 'none';
    }

    // Il pulsante per pubblicare comunicazioni in bacheca è visibile ESCLUSIVAMENTE a Luca
    const openNewsBtn = document.getElementById('open-new-news-btn');
    if (openNewsBtn) {
      openNewsBtn.style.display = (isLuca && state.user.isCoordinator) ? 'inline-flex' : 'none';
    }

    // La sezione Coordinatore nelle Impostazioni è visibile ESCLUSIVAMENTE a Luca
    const coordSection = document.getElementById('section-coordinator-wrap');
    if (coordSection) {
      coordSection.style.display = isLuca ? 'block' : 'none';
    }

    const userName = state.user.name || 'Accedi';
    const initial = (state.user.name || '?').charAt(0).toUpperCase();
    const avatarGradient = getInstructorColor(state.user.name);

    // Topbar
    const topAvatar = document.getElementById('user-topbar-avatar');
    if (topAvatar) {
      topAvatar.textContent = initial;
      topAvatar.style.background = avatarGradient;
    }
    const topName = document.getElementById('user-topbar-name');
    if (topName) {
      topName.textContent = state.user.name || 'Accedi Profilo';
    }

    // Modal Feedback autore certificato
    const fbAvatar = document.getElementById('fb-author-avatar');
    if (fbAvatar) {
      fbAvatar.textContent = initial;
      fbAvatar.style.background = avatarGradient;
    }
    const fbName = document.getElementById('fb-author-name');
    if (fbName) {
      fbName.textContent = state.user.name || 'Istruttore';
    }
    const fbHidden = document.getElementById('fb-author');
    if (fbHidden) fbHidden.value = state.user.name || '';

    // Modal Reply autore certificato
    const repAvatar = document.getElementById('reply-author-avatar');
    if (repAvatar) {
      repAvatar.textContent = initial;
      repAvatar.style.background = avatarGradient;
    }
    const repName = document.getElementById('reply-author-name');
    if (repName) {
      repName.textContent = state.user.name || 'Istruttore';
    }
    const repHidden = document.getElementById('reply-author');
    if (repHidden) repHidden.value = state.user.name || '';

    // Modal Brevetto Allievo esaminatore
    const evalAvatar = document.getElementById('valuta-evaluator-avatar');
    if (evalAvatar) {
      evalAvatar.textContent = initial;
      evalAvatar.style.background = avatarGradient;
    }
    const evalName = document.getElementById('valuta-evaluator-name');
    if (evalName) {
      evalName.textContent = state.user.name || 'Istruttore';
    }

    // Settings modal
    const settAvatar = document.getElementById('settings-user-avatar');
    if (settAvatar) {
      settAvatar.textContent = initial;
      settAvatar.style.background = avatarGradient;
    }
    const settName = document.getElementById('settings-user-name');
    if (settName) {
      settName.textContent = state.user.name || 'Nessun profilo selezionato';
    }
    const settRole = document.getElementById('settings-user-role');
    if (settRole) {
      settRole.textContent = (isLuca && state.user.isCoordinator) ? '👑 Coordinatore Staff' : (state.user.isLoggedIn ? '🏊 Istruttore Certificato' : 'Profilo non collegato');
    }

    // Sezione reset PIN istruttori (visibile solo se coordinatore Luca attivo)
    const resetPanel = document.getElementById('coord-reset-pin-panel');
    if (resetPanel) {
      resetPanel.classList.toggle('hidden', !(isLuca && state.user.isCoordinator));
    }
    const resetSelect = document.getElementById('select-reset-instructor');
    if (resetSelect && resetSelect.children.length === 0) {
      resetSelect.innerHTML = state.config.instructors.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    }
  }

  function updateBadges() {
    const badgeFb = document.getElementById('badge-feedback-count');
    if (badgeFb) badgeFb.textContent = state.feedbacks.length;

    const badgeNews = document.getElementById('badge-news-count');
    if (badgeNews) badgeNews.textContent = state.news.length;
  }

  // --- HELPER ESTETICI COLORI & CORSIA ---
  function getInstructorColor(name) {
    if (!name) return 'linear-gradient(135deg, #0284c7, #0369a1)';
    const n = name.trim().toLowerCase();
    if (n.startsWith('luca')) return 'linear-gradient(135deg, #0284c7, #0369a1)';
    if (n.startsWith('riccardo')) return 'linear-gradient(135deg, #e11d48, #be123c)';
    if (n.startsWith('mariagiulia') || n.startsWith('mariag')) return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
    if (n.startsWith('elisa')) return 'linear-gradient(135deg, #0d9488, #0f766e)';
    if (n.startsWith('agata')) return 'linear-gradient(135deg, #ea580c, #c2410c)';
    if (n.startsWith('carlo')) return 'linear-gradient(135deg, #059669, #047857)';
    if (n.startsWith('sara')) return 'linear-gradient(135deg, #d97706, #b45309)';
    if (n.startsWith('noemi')) return 'linear-gradient(135deg, #6366f1, #4f46e5)';
    if (n.startsWith('sofia')) return 'linear-gradient(135deg, #db2777, #be185d)';
    if (n.startsWith('laura')) return 'linear-gradient(135deg, #9333ea, #7e22ce)';
    if (n.startsWith('giulia')) return 'linear-gradient(135deg, #06b6d4, #0891b2)';
    return 'linear-gradient(135deg, #0284c7, #0369a1)';
  }

  function getLaneMeta(laneGroup) {
    if (!laneGroup) return { icon: '🏊', cls: '' };
    const lg = laneGroup.toLowerCase();
    if (lg.includes('tarta')) return { icon: '🐢', cls: 'lane-tarta' };
    if (lg.includes('delf')) return { icon: '🐬', cls: 'lane-delf' };
    if (lg.includes('2 corsia') || lg.includes('avanzat')) return { icon: '🏊', cls: 'lane-2corsia' };
    if (lg.includes('vaschetta')) return { icon: '🌊', cls: 'lane-vaschetta' };
    if (lg.includes('agonistic') || lg.includes('ago')) return { icon: '⚡', cls: 'lane-ago' };
    if (lg.includes('esordienti') || lg.includes('es.')) return { icon: '🏅', cls: 'lane-esordienti' };
    if (lg.includes('reclut')) return { icon: '🎯', cls: 'lane-reclut' };
    if (lg.includes('bike') || lg.includes('gym') || lg.includes('fitness')) return { icon: '🚴', cls: 'lane-fitness' };
    return { icon: '🏊', cls: '' };
  }

  // --- 1. RENDER FEEDBACK ---
  function renderFeedbacks() {
    const container = document.getElementById('feedback-list');
    if (!container) return;

    let list = [...state.feedbacks];

    if (state.feedbackFilter === 'positivo') {
      list = list.filter(f => f.type === 'positivo');
    } else if (state.feedbackFilter === 'criticità') {
      list = list.filter(f => f.type === 'criticità');
    } else if (state.feedbackFilter === 'my-posts') {
      list = list.filter(f => (f.author || '').toLowerCase() === (state.user.name || '').toLowerCase());
    }

    if (state.feedbackSearch.trim()) {
      const q = state.feedbackSearch.toLowerCase();
      list = list.filter(f =>
        (f.text || '').toLowerCase().includes(q) ||
        (f.author || '').toLowerCase().includes(q) ||
        (f.group || '').toLowerCase().includes(q) ||
        (Array.isArray(f.tags) ? f.tags.join(' ') : (f.tags || '')).toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-title">Nessun feedback presente</div>
          <div class="empty-desc">Nessuna nota trovata per i filtri attivi. Clicca su <strong>"✏️ Nuovo Feedback"</strong> per inaugurare il diario con i colleghi!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      const isPositive = item.type === 'positivo';
      const badgeClass = isPositive ? 'badge-positive' : 'badge-critic';
      const badgeLabel = isPositive ? '👍 Esercizio TOP' : '⚠️ Difficoltà / Criticità';
      const initial = (item.author || 'I').charAt(0).toUpperCase();
      const authorGradient = getInstructorColor(item.author);

      const tagsArray = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const tagsHtml = tagsArray.map(t => `<span class="tag-label">#${escapeHtml(t)}</span>`).join('');

      const replies = item.responses || [];
      const repliesHtml = replies.map(r => {
        const rInitial = (r.author || 'C').charAt(0).toUpperCase();
        const rGradient = getInstructorColor(r.author);
        return `
        <div class="reply-item">
          <div class="reply-header">
            <span class="reply-author" style="display: inline-flex; align-items: center; gap: 5px;">
              <span class="mini-avatar" style="background: ${rGradient}; width: 18px; height: 18px; font-size: 10px;">${rInitial}</span>
              ${escapeHtml(r.author || 'Collega')}
            </span>
            <span class="reply-date">${escapeHtml(r.date || '')}</span>
          </div>
          <div class="reply-text">${escapeHtml(r.text || '')}</div>
        </div>
      `;
      }).join('');

      const canDelete = state.user.isCoordinator || (item.author || '').toLowerCase() === (state.user.name || '').toLowerCase();

      return `
        <article class="feedback-card" data-id="${item.id}">
          <div class="card-top">
            <div class="author-meta">
              <div class="author-avatar" style="background: ${authorGradient};">${initial}</div>
              <div>
                <div class="author-name">${escapeHtml(item.author || 'Istruttore')}</div>
                <div class="post-date">${escapeHtml(item.date || '')} ${item.time ? '· ' + escapeHtml(item.time) : ''}</div>
              </div>
            </div>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
          </div>

          ${item.group ? `<div class="group-pill">🏊 ${escapeHtml(item.group)}</div>` : ''}

          ${tagsHtml ? `<div class="tags-container">${tagsHtml}</div>` : ''}

          <div class="card-text">${escapeHtml(item.text || '')}</div>

          <div class="replies-section">
            ${repliesHtml}
            <div class="reply-action-bar">
              <button type="button" class="btn btn-outline btn-sm btn-open-reply" data-id="${item.id}">
                💬 Rispondi / Consiglia (${replies.length})
              </button>
              ${canDelete ? `
                <button type="button" class="btn btn-outline btn-sm btn-delete-fb" data-id="${item.id}" style="color: var(--danger-text); border-color: transparent;" title="Elimina feedback">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- 2. RENDER TURNI & PLANNING ---
  function renderTurni() {
    const container = document.getElementById('turni-list');
    if (!container) return;

    let list = state.turni.filter(t => t.day === state.selectedDay);

    if (state.selectedShiftInstructor !== 'all') {
      list = list.filter(t =>
        (t.instructor || '').toLowerCase() === state.selectedShiftInstructor.toLowerCase() ||
        (t.substitute || '').toLowerCase() === state.selectedShiftInstructor.toLowerCase()
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">Nessun turno programmato per ${escapeHtml(state.selectedDay)}</div>
          <div class="empty-desc">Nessuna corsia o corso presente per questo giorno con i filtri attivi.</div>
        </div>
      `;
      return;
    }

    const currentUserName = (state.user.name || '').trim().toLowerCase();

    container.innerHTML = list.map(item => {
      const subVal = (item.substitute || '').trim();
      const isPending = subVal.toUpperCase() === 'CERCASI';
      const hasSub = Boolean(subVal && !isPending);
      const isOwner = currentUserName !== '' && (item.instructor || '').trim().toLowerCase() === currentUserName;
      const isSubMe = currentUserName !== '' && subVal.toLowerCase() === currentUserName;
      const laneMeta = getLaneMeta(item.laneGroup);
      const instColor = getInstructorColor(item.instructor);
      const subColor = hasSub ? getInstructorColor(item.substitute) : '';
      const initial = (item.instructor || 'S').charAt(0).toUpperCase();
      const subInitial = hasSub ? item.substitute.charAt(0).toUpperCase() : '';

      let subActionBtnHtml = '';

      if (isPending) {
        // Turno in attesa di sostituto
        if (isOwner) {
          subActionBtnHtml = `
            <button type="button" class="btn btn-outline btn-sm btn-cancel-sub-req" data-id="${item.id}" style="color: var(--danger-text); border-color: var(--danger-border); font-size: 11px;">
              ❌ Annulla Richiesta
            </button>
          `;
        } else {
          // Un collega può prenderlo con 1 tocco
          subActionBtnHtml = `
            <button type="button" class="btn btn-success btn-sm btn-take-shift" data-id="${item.id}" style="font-size: 11px; font-weight: 800;">
              🙋‍♂️ Prendo io il turno
            </button>
          `;
        }
        if (state.user.isCoordinator) {
          subActionBtnHtml += `
            <button type="button" class="btn btn-outline btn-sm btn-manage-sub" data-id="${item.id}" style="margin-top: 4px; font-size: 10px;">
              👑 Gestisci
            </button>
          `;
        }
      } else if (hasSub) {
        // Turno già sostituito
        if (isOwner || isSubMe || state.user.isCoordinator) {
          subActionBtnHtml = `
            <button type="button" class="btn btn-outline btn-sm btn-manage-sub" data-id="${item.id}" style="margin-top: 4px; font-size: 11px;">
              Modifica Sostituto
            </button>
          `;
        }
      } else {
        // Nessun sostituto richiesto finora
        if (isOwner) {
          subActionBtnHtml = `
            <button type="button" class="btn btn-outline btn-sm btn-request-sub" data-id="${item.id}" style="margin-top: 4px; font-size: 11px; font-weight: 700;">
              🔁 Chiedi Cambio
            </button>
          `;
        } else if (state.user.isCoordinator) {
          subActionBtnHtml = `
            <button type="button" class="btn btn-outline btn-sm btn-manage-sub" data-id="${item.id}" style="margin-top: 4px; font-size: 11px;">
              👑 Assegna Sostituto
            </button>
          `;
        }
      }

      return `
        <div class="shift-card ${laneMeta.cls}" data-id="${item.id}">
          <div class="shift-info">
            <span class="shift-time-pill">⏰ ${escapeHtml(item.time || '')}</span>
            <span class="shift-lane">${laneMeta.icon} ${escapeHtml(item.laneGroup || '')}</span>
            ${item.notes ? `<span class="shift-notes">ℹ️ ${escapeHtml(item.notes)}</span>` : ''}
          </div>
          <div class="shift-person">
            <span class="instructor-badge">
              <span class="mini-avatar" style="background: ${instColor};">${initial}</span>
              ${escapeHtml(item.instructor || 'Staff')}
            </span>
            ${isPending ? `
              <span class="badge-pending-sub">🟡 CERCASI SOSTITUTO</span>
            ` : ''}
            ${hasSub ? `
              <span class="substitute-badge">
                <span class="mini-avatar" style="background: ${subColor}; width:16px; height:16px; font-size:9px;">${subInitial}</span>
                🔁 Sostituito da: <strong>${escapeHtml(item.substitute)}</strong>
              </span>
            ` : ''}
            ${subActionBtnHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 3. RENDER NEWS ---
  function renderNews() {
    const container = document.getElementById('news-list');
    if (!container) return;

    if (state.news.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📢</div>
          <div class="empty-title">Nessuna comunicazione presente</div>
          <div class="empty-desc">La direzione pubblicherà qui chiusure straordinarie, date dei brevetti e avvisi importanti.</div>
        </div>
      `;
      return;
    }

    const sorted = [...state.news].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.date || '').localeCompare(a.date || '');
    });

    container.innerHTML = sorted.map(item => {
      const isPinned = item.pinned === true || String(item.pinned) === 'true';
      let catBadge = '';
      if (item.category === 'chiusura') {
        catBadge = '<span class="badge" style="background:#fee2e2; color:#991b1b;">🔴 Chiusura Impianto</span>';
      } else if (item.category === 'brevetti') {
        catBadge = '<span class="badge" style="background:#e0e7ff; color:#3730a3;">🏆 Valutazione Brevetti</span>';
      } else if (item.category === 'riunione') {
        catBadge = '<span class="badge" style="background:#fef3c7; color:#92400e;">🏊 Riunione Staff</span>';
      } else {
        catBadge = '<span class="badge" style="background:#f1f5f9; color:#475569;">📢 Avviso Generale</span>';
      }

      return `
        <article class="news-card ${isPinned ? 'pinned' : ''}">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${catBadge}
              ${isPinned ? '<span class="news-badge-pinned">📌 In Evidenza</span>' : ''}
            </div>
            <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(item.date || '')}</span>
          </div>

          <h3 class="news-title">${escapeHtml(item.title || '')}</h3>
          <div class="news-text">${escapeHtml(item.text || '')}</div>

          <div class="news-footer">
            <span>Autore: <strong>${escapeHtml(item.author || 'Direzione')}</strong></span>
            ${state.user.isCoordinator ? `
              <button type="button" class="btn btn-outline btn-sm btn-delete-news" data-id="${item.id}" style="color: var(--danger-text); border:none; padding: 2px 6px;">
                Elimina
              </button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // --- 4. RENDER SCHEMARIO BREVETTI (TARTARUGHE, DELFINI, 2 CORSIA) ---
  function renderBrevetti() {
    const container = document.getElementById('brevetti-list');
    if (!container) return;

    let list = [...state.brevetti];

    // Filtra per livello selezionato
    if (state.selectedBrevetto !== 'all') {
      list = list.filter(b => b.id === state.selectedBrevetto);
    }

    // Ricerca testuale
    const query = state.brevettoSearch.trim().toLowerCase();

    let totalTestsInView = 0;
    let checkedTestsInView = 0;

    const cardsHtml = list.map(b => {
      let techTests = Array.isArray(b.technicalTests) ? b.technicalTests : (b.technicalTests || '').split('\n').filter(Boolean);
      let safetyTests = Array.isArray(b.safetyTests) ? b.safetyTests : (b.safetyTests || '').split('\n').filter(Boolean);

      // Applica filtro ricerca se presente
      if (query) {
        techTests = techTests.filter(t => t.toLowerCase().includes(query));
        safetyTests = safetyTests.filter(t => t.toLowerCase().includes(query));
        const matchDesc = (b.description || '').toLowerCase().includes(query);
        const matchName = (b.name || '').toLowerCase().includes(query);

        if (techTests.length === 0 && safetyTests.length === 0 && !matchDesc && !matchName) {
          return ''; // nessun match per questa scheda
        }
      }

      totalTestsInView += (techTests.length + safetyTests.length);

      // Genera righe Prove Tecniche
      const techRows = techTests.map((t, idx) => {
        const testKey = `${b.id}_tech_${idx}`;
        const isChecked = state.checkedEvaluations.has(testKey);
        if (isChecked) checkedTestsInView++;

        return `
          <div class="test-item-row ${isChecked ? 'checked' : ''}" data-test-key="${testKey}">
            <input type="checkbox" class="test-check-box" ${isChecked ? 'checked' : ''} aria-label="Spunta prova">
            <span class="test-num-circle">${idx + 1}</span>
            <span class="test-name-text">${escapeHtml(t)}</span>
            <span class="badge badge-info" style="font-size: 10px;">Tecnica</span>
          </div>
        `;
      }).join('');

      // Genera righe Prove di Sicurezza
      const safetyRows = safetyTests.map((s, idx) => {
        const testKey = `${b.id}_safety_${idx}`;
        const isChecked = state.checkedEvaluations.has(testKey);
        if (isChecked) checkedTestsInView++;

        return `
          <div class="test-item-row ${isChecked ? 'checked' : ''}" data-test-key="${testKey}">
            <input type="checkbox" class="test-check-box" ${isChecked ? 'checked' : ''} aria-label="Spunta prova">
            <span class="test-num-circle" style="background:#dcfce7; color:#166534;">${idx + 1}</span>
            <span class="test-name-text">${escapeHtml(s)}</span>
            <span class="badge badge-positive" style="font-size: 10px;">Sicurezza</span>
          </div>
        `;
      }).join('');

      return `
        <article class="brevetto-full-card" style="border-left-color: ${b.badgeColor || '#0284c7'};">
          <div class="brevetto-main-header">
            <div class="brevetto-main-title">
              <span>${b.icon || '🏅'}</span>
              <span>${escapeHtml(b.name)}</span>
            </div>
            <span class="brevetto-tag-badge">Totale: ${techTests.length + safetyTests.length} Prove</span>
          </div>

          <p class="brevetto-desc-box">${escapeHtml(b.description || '')}</p>

          <!-- BLOCCO 1: PROVE TECNICHE -->
          ${techTests.length > 0 ? `
            <div class="test-section-block">
              <div class="test-section-header">
                <span class="test-section-label tech">
                  ⚙️ Prove Tecniche
                </span>
                <span class="test-count-badge">${techTests.length} prove</span>
              </div>
              <div class="test-grid">
                ${techRows}
              </div>
            </div>
          ` : ''}

          <!-- BLOCCO 2: PROVE DI SICUREZZA -->
          ${safetyTests.length > 0 ? `
            <div class="test-section-block">
              <div class="test-section-header">
                <span class="test-section-label safety">
                  🛡️ Prove di Sicurezza
                </span>
                <span class="test-count-badge" style="background: #dcfce7; color: #166534;">${safetyTests.length} prove</span>
              </div>
              <div class="test-grid">
                ${safetyRows}
              </div>
            </div>
          ` : ''}

          <!-- BLOCCO 3: COMPORTAMENTO INDIVIDUALE -->
          ${b.behavior ? `
            <div class="test-section-block" style="margin-bottom: 0;">
              <div class="test-section-header">
                <span class="test-section-label behavior">
                  🌟 Comportamento & Attitudine
                </span>
              </div>
              <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #92400e;">
                ${escapeHtml(b.behavior)}
              </div>
            </div>
          ` : ''}
        </article>
      `;
    }).filter(Boolean).join('');

    container.innerHTML = cardsHtml || `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Nessuna prova trovata</div>
        <div class="empty-desc">Nessuna prova corrisponde al termine cercato "${escapeHtml(state.brevettoSearch)}".</div>
      </div>
    `;

    // Aggiorna la barra di avanzamento della valutazione in tempo reale
    updateEvaluationProgress(checkedTestsInView, totalTestsInView);
  }

  function updateEvaluationProgress(checked, total) {
    const label = document.getElementById('eval-progress-label');
    const bar = document.getElementById('eval-progress-fill');
    if (!label || !bar) return;

    if (total === 0) {
      label.textContent = 'Nessuna prova visualizzata';
      bar.style.width = '0%';
      return;
    }

    const pct = Math.round((checked / total) * 100);
    label.innerHTML = `Valutazione allievo: <strong>${checked} su ${total} prove superate</strong> (${pct}%)`;
    bar.style.width = pct + '%';
  }

  // --- SUBTABS BREVETTI (SCHEDE, VALUTA, STATISTICHE) ---
  function initBrevettiSubtabs() {
    document.querySelectorAll('.sub-nav-pill[data-subtab]').forEach(pill => {
      pill.addEventListener('click', () => {
        const target = pill.getAttribute('data-subtab');
        document.querySelectorAll('.sub-nav-pill[data-subtab]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        document.querySelectorAll('.subtab-content').forEach(pane => {
          pane.classList.toggle('hidden', pane.id !== target);
        });

        state.activeSubtabBrevetti = target;
        if (target === 'subtab-valuta') {
          initEvaluationForm();
        } else if (target === 'subtab-stats') {
          renderBrevettiStats();
        }
      });
    });
  }

  // --- COMPILAZIONE PROVA ALLIEVO (VALUTA) ---
  function initEvaluationForm() {
    const dataInput = document.getElementById('valuta-data');
    if (dataInput && !dataInput.value) {
      dataInput.value = getTodayIsoDate();
    }

    renderValutaChecklist();
    updateLiveValutaScore();
  }

  function renderValutaChecklist() {
    const container = document.getElementById('valuta-checklist-box');
    const selectLevel = document.getElementById('valuta-livello-select');
    if (!container || !selectLevel) return;

    const levelId = selectLevel.value;
    const currentBrevetto = state.brevetti.find(b => b.id === levelId) || DEFAULT_DATA.brevetti.find(b => b.id === levelId);
    if (!currentBrevetto) {
      container.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">Nessuna scheda trovata per questo brevetto.</div>';
      return;
    }

    let techTests = Array.isArray(currentBrevetto.technicalTests) ? currentBrevetto.technicalTests : (currentBrevetto.technicalTests || '').split('\n').filter(Boolean);
    let safetyTests = Array.isArray(currentBrevetto.safetyTests) ? currentBrevetto.safetyTests : (currentBrevetto.safetyTests || '').split('\n').filter(Boolean);

    let html = '';

    if (techTests.length > 0) {
      html += '<div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-top: 4px;">⚙️ Prove Tecniche</div>';
      html += techTests.map((t, idx) => `
        <label class="valuta-test-row" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 12px;">
          <input type="checkbox" class="valuta-checkbox" data-test-name="${escapeHtml(t)}" data-test-type="tech" style="width: 17px; height: 17px;">
          <span style="font-weight: 700; color: var(--text-muted); width: 18px;">${idx + 1}.</span>
          <span style="flex: 1; color: var(--text);">${escapeHtml(t)}</span>
          <span class="badge badge-info" style="font-size: 9px;">Tecnica</span>
        </label>
      `).join('');
    }

    if (safetyTests.length > 0) {
      html += '<div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-top: 10px;">🛡️ Prove di Sicurezza</div>';
      html += safetyTests.map((s, idx) => `
        <label class="valuta-test-row" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 12px;">
          <input type="checkbox" class="valuta-checkbox" data-test-name="${escapeHtml(s)}" data-test-type="safety" style="width: 17px; height: 17px;">
          <span style="font-weight: 700; color: var(--text-muted); width: 18px;">${idx + 1}.</span>
          <span style="flex: 1; color: var(--text);">${escapeHtml(s)}</span>
          <span class="badge badge-positive" style="font-size: 9px;">Sicurezza</span>
        </label>
      `).join('');
    }

    container.innerHTML = html;

    // Aggiungi listener sulle checkbox
    container.querySelectorAll('.valuta-checkbox').forEach(cb => {
      cb.addEventListener('change', updateLiveValutaScore);
    });
  }

  function updateLiveValutaScore() {
    const checkboxes = document.querySelectorAll('.valuta-checkbox');
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const total = checkboxes.length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

    const summaryBadge = document.getElementById('valuta-summary-score');
    if (summaryBadge) {
      summaryBadge.textContent = `${checked} su ${total} superate (${pct}%)`;
    }

    const esitoText = document.getElementById('valuta-esito-preview');
    const esitoBadge = document.getElementById('valuta-badge-esito');

    if (total === 0) {
      if (esitoText) esitoText.textContent = 'In attesa di livello...';
      if (esitoBadge) {
        esitoBadge.className = 'badge';
        esitoBadge.textContent = '⏳ In attesa';
      }
      return;
    }

    const isPassed = pct >= 75;
    if (esitoText) {
      esitoText.innerHTML = isPassed ?
        '<span style="color: #059669;">🏆 IDONEO AL BREVETTO (Tasso ≥ 75%)</span>' :
        '<span style="color: #d97706;">⚠️ DA CONSOLIDARE (Tasso < 75%)</span>';
    }
    if (esitoBadge) {
      esitoBadge.className = isPassed ? 'badge badge-positive' : 'badge badge-critic';
      esitoBadge.textContent = isPassed ? '✓ IDONEO' : '⚠️ RIVEDERE';
    }
  }

  // --- STATISTICHE & CLASSIFICA PROVE MENO SUPERATE ---
  function renderBrevettiStats() {
    let evals = [...state.valutazioni];

    // Filtro livello
    if (state.statFilterLevel !== 'all') {
      evals = evals.filter(e => e.levelId === state.statFilterLevel);
    }

    // Ricerca allievo o esaminatore
    if (state.statSearchStudent.trim()) {
      const q = state.statSearchStudent.toLowerCase();
      evals = evals.filter(e =>
        (e.student || '').toLowerCase().includes(q) ||
        (e.evaluator || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
      );
    }

    // 1. KPI Counters
    const totalCount = evals.length;
    const passedCount = evals.filter(e => (e.outcome || '').toUpperCase().includes('IDONEO')).length;
    const reviewCount = totalCount - passedCount;
    const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    const kpiTotal = document.getElementById('stat-total-evals');
    if (kpiTotal) kpiTotal.textContent = totalCount;
    const kpiRate = document.getElementById('stat-pass-rate');
    if (kpiRate) kpiRate.textContent = passRate + '%';
    const kpiPassed = document.getElementById('stat-total-passed');
    if (kpiPassed) kpiPassed.textContent = passedCount;
    const kpiReview = document.getElementById('stat-total-review');
    if (kpiReview) kpiReview.textContent = reviewCount;

    // 2. Classifica Prove Più Difficili (Prove Meno Superate)
    renderWeaknessChart(evals);

    // 3. Registro Cronologico Allievi
    renderEvalHistory(evals);
  }

  function renderWeaknessChart(evals) {
    const container = document.getElementById('weakness-chart-list');
    if (!container) return;

    if (evals.length === 0) {
      container.innerHTML = `
        <div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 24px 0;">
          Nessuna valutazione registrata per il filtro corrente. Registra le prove nella scheda "Valuta Allievo" per visualizzare l'analisi delle criticità.
        </div>
      `;
      return;
    }

    // Mappa per contare per ogni prova: testata e superata
    const testStatsMap = new Map();

    evals.forEach(ev => {
      let details = [];
      if (Array.isArray(ev.details)) {
        details = ev.details;
      } else if (typeof ev.details === 'string') {
        try { details = JSON.parse(ev.details); } catch (e) { details = []; }
      }

      details.forEach(d => {
        const testName = d.test || d.name || '';
        if (!testName) return;

        if (!testStatsMap.has(testName)) {
          testStatsMap.set(testName, { name: testName, type: d.type || 'tech', tested: 0, passed: 0 });
        }
        const item = testStatsMap.get(testName);
        item.tested++;
        if (d.passed) item.passed++;
      });
    });

    const testList = Array.from(testStatsMap.values());
    if (testList.length === 0) {
      container.innerHTML = `
        <div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 20px 0;">
          Nessun dettaglio prova registrato nei report selezionati.
        </div>
      `;
      return;
    }

    // Calcola percentuale di superamento e ordina in modo CRESCENTE (la meno superata in cima!)
    testList.forEach(t => {
      t.pct = t.tested > 0 ? Math.round((t.passed / t.tested) * 100) : 0;
    });

    testList.sort((a, b) => a.pct - b.pct);

    const html = testList.map((item, idx) => {
      let barColorClass = 'danger'; // < 60%
      let statusIcon = '🔴';
      if (item.pct >= 80) {
        barColorClass = 'success';
        statusIcon = '🟢';
      } else if (item.pct >= 60) {
        barColorClass = 'warning';
        statusIcon = '🟡';
      }

      return `
        <div class="weakness-row">
          <div class="weakness-info">
            <span class="weakness-test-name">
              ${statusIcon} <strong>#${idx + 1}</strong> ${escapeHtml(item.name)}
            </span>
            <span class="weakness-stat-meta">
              <strong>${item.pct}%</strong> superata (${item.passed} su ${item.tested} allievi)
            </span>
          </div>
          <div class="weakness-bar-bg">
            <div class="weakness-bar-fill ${barColorClass}" style="width: ${item.pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  function renderEvalHistory(evals) {
    const container = document.getElementById('eval-history-list');
    if (!container) return;

    if (evals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">Nessun allievo nel registro</div>
          <div class="empty-desc">Nessuna valutazione corrisponde ai filtri di ricerca.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = evals.map(ev => {
      const isPassed = (ev.outcome || '').toUpperCase().includes('IDONEO');
      const badgeCls = isPassed ? 'badge-positive' : 'badge-critic';
      const badgeLabel = isPassed ? '✓ IDONEO' : '⚠️ DA RIVEDERE';
      const evalInitial = (ev.evaluator || 'I').charAt(0).toUpperCase();
      const evalColor = getInstructorColor(ev.evaluator);
      const canDelete = state.user.isCoordinator || (ev.evaluator || '').toLowerCase() === (state.user.name || '').toLowerCase();

      return `
        <article class="eval-history-card">
          <div class="card-top">
            <div>
              <div style="font-weight: 800; font-size: 15px; color: var(--text);">
                👤 ${escapeHtml(ev.student || 'Allievo')}
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                🏅 ${escapeHtml(ev.levelName || 'Brevetto')} · 📅 ${escapeHtml(ev.date || '')}
              </div>
            </div>
            <span class="badge ${badgeCls}">${badgeLabel} (${ev.percentage || 0}%)</span>
          </div>

          <div style="font-size: 12px; color: var(--text); margin-top: 8px;">
            Prove superate: <strong>${ev.passedCount || 0} su ${ev.totalCount || 0}</strong>
          </div>

          ${ev.notes ? `
            <div style="background: var(--surface-alt); border-left: 3px solid var(--primary); padding: 6px 10px; border-radius: 4px; font-size: 12px; color: var(--text-muted); margin-top: 8px;">
              "${escapeHtml(ev.notes)}"
            </div>
          ` : ''}

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border);">
            <span style="font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px;">
              <span class="mini-avatar" style="background: ${evalColor}; width: 18px; height: 18px; font-size: 10px;">${evalInitial}</span>
              Esaminatore: <strong>${escapeHtml(ev.evaluator || 'Staff')}</strong>
            </span>
            ${canDelete ? `
              <button type="button" class="btn btn-outline btn-sm btn-delete-eval" data-id="${ev.id}" style="color: var(--danger-text); border: none; padding: 2px 6px; font-size: 11px;">
                🗑️ Elimina
              </button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // SETUP DEGLI EVENT LISTENER E MODALI
  // =========================================================================
  function setupEventListeners() {
    // 1. Navigazione tra le schede (Tabs)
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(section => {
          section.classList.toggle('hidden', section.id !== targetTab);
        });
        state.activeTab = targetTab;
      });
    });

    // 2. Filtri Feedback (Chips)
    document.querySelectorAll('.chip[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.feedbackFilter = chip.getAttribute('data-filter');
        renderFeedbacks();
      });
    });

    const searchInput = document.getElementById('feedback-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.feedbackSearch = e.target.value;
        renderFeedbacks();
      });
    }

    // 3. Selettore Giorni Planning
    document.querySelectorAll('.day-pill[data-day]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.day-pill[data-day]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.selectedDay = pill.getAttribute('data-day');
        renderTurni();
      });
    });

    const shiftInstrSelect = document.getElementById('filter-shift-instructor');
    if (shiftInstrSelect) {
      shiftInstrSelect.addEventListener('change', (e) => {
        state.selectedShiftInstructor = e.target.value;
        renderTurni();
      });
    }

    // 4. Selettore Brevetti (Tartarughe, Delfini, 2 Corsia)
    document.querySelectorAll('.brevetto-select-btn[data-brevetto]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brevetto-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedBrevetto = btn.getAttribute('data-brevetto');
        renderBrevetti();
      });
    });

    const brevettoSearchInput = document.getElementById('brevetto-search-input');
    if (brevettoSearchInput) {
      brevettoSearchInput.addEventListener('input', (e) => {
        state.brevettoSearch = e.target.value;
        renderBrevetti();
      });
    }

    // 5. Spunta Interattiva Prove Brevetto (Click su riga o checkbox)
    document.getElementById('brevetti-list')?.addEventListener('click', (e) => {
      const row = e.target.closest('.test-item-row');
      if (!row) return;

      const key = row.getAttribute('data-test-key');
      if (!key) return;

      if (state.checkedEvaluations.has(key)) {
        state.checkedEvaluations.delete(key);
      } else {
        state.checkedEvaluations.add(key);
      }

      renderBrevetti();
    });

    // Reset spunte allievo
    document.getElementById('btn-reset-eval')?.addEventListener('click', () => {
      if (state.checkedEvaluations.size === 0) return;
      if (confirm('Vuoi azzerare tutte le prove spuntate per iniziare a valutare un altro allievo?')) {
        state.checkedEvaluations.clear();
        renderBrevetti();
        showToast('Spunte azzerate per nuovo allievo.');
      }
    });

    // Stampa schede
    document.getElementById('btn-print-brevetti')?.addEventListener('click', () => {
      window.print();
    });

    // 6. Pulsante Aggiorna manuale
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      syncWithGoogleSheets(false);
    });

    // 7. Pulsanti apertura Modali
    document.getElementById('btn-user-profile')?.addEventListener('click', () => {
      if (state.user.isLoggedIn && state.user.name) {
        openModal('modal-settings');
        updateCoordStatusView();
      } else {
        openLoginModal();
      }
    });

    document.getElementById('open-new-feedback-btn')?.addEventListener('click', () => {
      if (!state.user.isLoggedIn || !state.user.name) {
        openLoginModal();
        return;
      }
      openModal('modal-feedback');
      document.getElementById('fb-date').value = getTodayIsoDate();
      document.getElementById('fb-author').value = state.user.name;
    });

    document.getElementById('open-new-news-btn')?.addEventListener('click', () => {
      if ((state.user.name || '').toLowerCase() !== 'luca') {
        showToast('🔒 Accesso negato: solo il Coordinatore Luca può pubblicare avvisi in bacheca.', true);
        return;
      }
      if (!state.user.isCoordinator) {
        showToast('🔒 Inserisci il PIN Coordinatore nelle Impostazioni per procedere.', true);
        openModal('modal-settings');
        return;
      }
      openModal('modal-news');
    });

    document.getElementById('settings-btn')?.addEventListener('click', () => {
      openModal('modal-settings');
      updateCoordStatusView();
    });

    // 8. Chiusura Modali
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => {
        closeModal(el.getAttribute('data-close'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });

    // 9. Tipo Nuovo Feedback (Positivo vs Criticità)
    const btnPos = document.getElementById('btn-type-positive');
    const btnCrit = document.getElementById('btn-type-critic');
    let currentFeedbackType = 'positivo';

    btnPos?.addEventListener('click', () => {
      currentFeedbackType = 'positivo';
      btnPos.className = 'type-option-btn selected-pos';
      btnCrit.className = 'type-option-btn';
    });

    btnCrit?.addEventListener('click', () => {
      currentFeedbackType = 'criticità';
      btnCrit.className = 'type-option-btn selected-crit';
      btnPos.className = 'type-option-btn';
    });

    // 10. Submit Form Nuovo Feedback
    document.getElementById('form-feedback')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = document.getElementById('fb-author').value;
      const date = document.getElementById('fb-date').value;
      const time = document.getElementById('fb-time').value.trim();
      const group = document.getElementById('fb-group').value;
      const text = document.getElementById('fb-text').value.trim();
      const tagsStr = document.getElementById('fb-tags-hidden').value;
      const tags = tagsStr ? tagsStr.split(',').filter(Boolean) : [];

      if (!text) return;

      const newFb = {
        id: 'fb_' + Date.now(),
        date: date || getTodayIsoDate(),
        time: time,
        author: author,
        group: group,
        type: currentFeedbackType,
        tags: tags,
        text: text,
        responses: []
      };

      state.feedbacks.unshift(newFb);
      saveLocalData();
      renderFeedbacks();
      updateBadges();
      closeModal('modal-feedback');
      e.target.reset();
      clearQuickTags();
      showToast('✓ Feedback pubblicato sul diario!');

      postToGoogleSheets({ action: 'save_feedback', feedback: newFb });
    });

    // 11. Event Delegation Feedback (Risposte ed Eliminazione)
    document.getElementById('feedback-list')?.addEventListener('click', (e) => {
      const replyBtn = e.target.closest('.btn-open-reply');
      if (replyBtn) {
        openReplyModal(replyBtn.getAttribute('data-id'));
        return;
      }

      const delBtn = e.target.closest('.btn-delete-fb');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        if (confirm('Vuoi davvero eliminare questo feedback dal diario?')) {
          state.feedbacks = state.feedbacks.filter(f => f.id !== id);
          saveLocalData();
          renderFeedbacks();
          updateBadges();
          showToast('Feedback eliminato.');
          postToGoogleSheets({ action: 'delete_feedback', id: id });
        }
      }
    });

    // 12. Submit Risposta al Feedback
    document.getElementById('form-reply')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fbId = document.getElementById('reply-fb-id').value;
      const author = document.getElementById('reply-author').value;
      const text = document.getElementById('reply-text').value.trim();

      if (!text || !fbId) return;

      const targetFb = state.feedbacks.find(f => f.id === fbId);
      if (targetFb) {
        if (!targetFb.responses) targetFb.responses = [];
        const replyObj = {
          id: 'rep_' + Date.now(),
          author: author,
          date: 'Oggi ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: text
        };
        targetFb.responses.push(replyObj);

        saveLocalData();
        renderFeedbacks();
        closeModal('modal-reply');
        e.target.reset();
        showToast('✓ Risposta inviata al collega!');

        postToGoogleSheets({
          action: 'reply_feedback',
          feedbackId: fbId,
          reply: replyObj
        });
      }
    });

    // 13. Gestione e Richieste Sostituzione Turno
    document.getElementById('turni-list')?.addEventListener('click', (e) => {
      const reqBtn = e.target.closest('.btn-request-sub');
      if (reqBtn) {
        openSubRequestModal(reqBtn.getAttribute('data-id'));
        return;
      }

      const cancelBtn = e.target.closest('.btn-cancel-sub-req');
      if (cancelBtn) {
        cancelSubRequest(cancelBtn.getAttribute('data-id'));
        return;
      }

      const takeBtn = e.target.closest('.btn-take-shift');
      if (takeBtn) {
        openSubTakeModal(takeBtn.getAttribute('data-id'));
        return;
      }

      const manageBtn = e.target.closest('.btn-manage-sub');
      if (manageBtn) {
        openSubstituteModal(manageBtn.getAttribute('data-id'));
        return;
      }
    });

    // Submit Richiesta Cambio Turno (Titolare)
    document.getElementById('form-sub-request')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const shiftId = document.getElementById('req-shift-id').value;
      const note = document.getElementById('req-sub-note').value.trim();
      const shift = state.turni.find(t => t.id === shiftId);
      if (shift) {
        shift.substitute = 'CERCASI';
        shift.notes = note ? 'Cercasi cambio: ' + note : 'Cercasi cambio';
        saveLocalData();
        renderTurni();
        closeModal('modal-sub-request');
        showToast('✓ Richiesta cambio turno pubblicata per tutti i colleghi!');

        postToGoogleSheets({
          action: 'update_turno',
          id: shift.id,
          day: shift.day,
          time: shift.time,
          laneGroup: shift.laneGroup,
          instructor: shift.instructor,
          substitute: 'CERCASI',
          notes: shift.notes
        });
      }
    });

    // Submit Prendi Turno (Collega che accetta la sostituzione)
    document.getElementById('form-sub-take')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const shiftId = document.getElementById('take-shift-id').value;
      const shift = state.turni.find(t => t.id === shiftId);
      if (shift) {
        const myName = state.user.name || 'Istruttore';
        shift.substitute = myName;
        saveLocalData();
        renderTurni();
        closeModal('modal-sub-take');
        showToast(`🎉 Turno preso! Ora sostituisci ufficialmente ${shift.instructor}.`);

        postToGoogleSheets({
          action: 'update_turno',
          id: shift.id,
          day: shift.day,
          time: shift.time,
          laneGroup: shift.laneGroup,
          instructor: shift.instructor,
          substitute: myName,
          notes: shift.notes
        });
      }
    });

    // Submit Gestione Sostituto Standard (Coordinatore)
    document.getElementById('form-substitute')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const shiftId = document.getElementById('sub-shift-id').value;
      const subName = document.getElementById('sub-instructor-select').value;
      const note = document.getElementById('sub-note').value.trim();

      const shift = state.turni.find(t => t.id === shiftId);
      if (shift) {
        shift.substitute = subName;
        if (note) shift.notes = note;
        saveLocalData();
        renderTurni();
        closeModal('modal-substitute');
        showToast(`✓ Sostituzione registrata con ${subName}!`);

        postToGoogleSheets({
          action: 'update_turno',
          id: shiftId,
          day: shift.day,
          time: shift.time,
          laneGroup: shift.laneGroup,
          instructor: shift.instructor,
          substitute: subName,
          notes: shift.notes
        });
      }
    });

    document.getElementById('btn-remove-sub')?.addEventListener('click', () => {
      const shiftId = document.getElementById('sub-shift-id').value;
      const shift = state.turni.find(t => t.id === shiftId);
      if (shift) {
        shift.substitute = '';
        saveLocalData();
        renderTurni();
        closeModal('modal-substitute');
        showToast('Sostituzione rimossa.');

        postToGoogleSheets({
          action: 'update_turno',
          id: shiftId,
          day: shift.day,
          time: shift.time,
          laneGroup: shift.laneGroup,
          instructor: shift.instructor,
          substitute: '',
          notes: shift.notes
        });
      }
    });

    // 14. Eventi Brevetti: Valutazione Allievo & Statistiche
    document.getElementById('valuta-livello-select')?.addEventListener('change', () => {
      renderValutaChecklist();
      updateLiveValutaScore();
    });

    document.getElementById('btn-cancel-valuta')?.addEventListener('click', () => {
      setTimeout(() => {
        renderValutaChecklist();
        updateLiveValutaScore();
      }, 50);
    });

    document.getElementById('form-valuta-allievo')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentName = document.getElementById('valuta-nome-allievo').value.trim();
      const dateVal = document.getElementById('valuta-data').value || getTodayIsoDate();
      const levelId = document.getElementById('valuta-livello-select').value;
      const notes = document.getElementById('valuta-note').value.trim();

      if (!studentName) return;

      const currentBrevetto = state.brevetti.find(b => b.id === levelId) || DEFAULT_DATA.brevetti.find(b => b.id === levelId);
      const levelName = currentBrevetto ? currentBrevetto.name : levelId;

      const checkboxes = document.querySelectorAll('.valuta-checkbox');
      const details = [];
      let passedCount = 0;

      checkboxes.forEach(cb => {
        const testName = cb.getAttribute('data-test-name');
        const testType = cb.getAttribute('data-test-type');
        const passed = cb.checked;
        if (passed) passedCount++;
        details.push({ test: testName, type: testType, passed: passed });
      });

      const totalCount = checkboxes.length;
      const pct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      const outcome = pct >= 75 ? 'IDONEO' : 'DA CONSOLIDARE';

      const newEval = {
        id: 'eval_' + Date.now(),
        date: dateVal,
        student: studentName,
        levelId: levelId,
        levelName: levelName,
        evaluator: state.user.name || 'Istruttore',
        passedCount: passedCount,
        totalCount: totalCount,
        percentage: pct,
        outcome: outcome,
        details: details,
        notes: notes
      };

      state.valutazioni.unshift(newEval);
      saveLocalData();
      renderBrevettiStats();
      showToast(`✓ Valutazione di ${studentName} registrata nel registro ufficiale!`);

      // Reset campi
      document.getElementById('valuta-nome-allievo').value = '';
      document.getElementById('valuta-note').value = '';
      renderValutaChecklist();
      updateLiveValutaScore();

      // Invio al cloud Google Sheets
      postToGoogleSheets({
        action: 'save_valutazione_brevetto',
        valutazione: newEval
      });
    });

    document.querySelectorAll('.chip[data-stat-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip[data-stat-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.statFilterLevel = chip.getAttribute('data-stat-filter');
        renderBrevettiStats();
      });
    });

    document.getElementById('stat-search-student')?.addEventListener('input', (e) => {
      state.statSearchStudent = e.target.value;
      renderBrevettiStats();
    });

    document.getElementById('eval-history-list')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-delete-eval');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        if (confirm('Vuoi davvero eliminare questo report allievo dal registro?')) {
          state.valutazioni = state.valutazioni.filter(ev => ev.id !== id);
          saveLocalData();
          renderBrevettiStats();
          showToast('Valutazione rimossa.');
          postToGoogleSheets({ action: 'delete_valutazione_brevetto', id: id });
        }
      }
    });

    // 15. Submit Form Nuova News (Coordinatore)
    document.getElementById('form-news')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('news-title').value.trim();
      const cat = document.getElementById('news-category').value;
      const author = document.getElementById('news-author').value.trim();
      const text = document.getElementById('news-text').value.trim();
      const pinned = document.getElementById('news-pinned').checked;

      if (!title || !text) return;

      const newNews = {
        id: 'news_' + Date.now(),
        date: getTodayIsoDate(),
        title: title,
        text: text,
        author: author || 'Direzione Vasca',
        category: cat,
        pinned: pinned
      };

      state.news.unshift(newNews);
      saveLocalData();
      renderNews();
      updateBadges();
      closeModal('modal-news');
      e.target.reset();
      showToast('✓ Comunicazione pubblicata in bacheca!');

      postToGoogleSheets({ action: 'save_news', news: newNews });
    });

    document.getElementById('news-list')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-delete-news');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        if (confirm('Vuoi rimuovere questo avviso dalla bacheca?')) {
          state.news = state.news.filter(n => n.id !== id);
          saveLocalData();
          renderNews();
          updateBadges();
          showToast('Avviso rimosso.');
          postToGoogleSheets({ action: 'delete_news', id: id });
        }
      }
    });

    // 16. Profilo & Reset PIN Colleghi (Coordinatore Luca)
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
    document.getElementById('btn-change-pin')?.addEventListener('click', handleChangePin);
    document.getElementById('btn-reset-instructor-pin')?.addEventListener('click', handleResetColleaguePin);

    // 17. Accesso Profilo & PIN Istruttore
    document.getElementById('login-instructors-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.instructor-login-btn');
      if (btn) {
        const name = btn.getAttribute('data-name');
        if (name) selectInstructorForLogin(name);
      }
    });

    document.getElementById('btn-back-to-select')?.addEventListener('click', () => {
      document.getElementById('login-step-pin')?.classList.add('hidden');
      document.getElementById('login-step-select')?.classList.remove('hidden');
    });

    document.getElementById('form-login-pin')?.addEventListener('submit', handlePinSubmit);
  }

  // =========================================================================
  // HELPER MODALI & FORM
  // =========================================================================
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function openReplyModal(fbId) {
    const fb = state.feedbacks.find(f => f.id === fbId);
    if (!fb) return;

    document.getElementById('reply-fb-id').value = fb.id;
    document.getElementById('reply-author').value = state.user.name;

    const preview = document.getElementById('reply-preview-box');
    if (preview) {
      preview.innerHTML = `
        <strong>${escapeHtml(fb.author)} (${escapeHtml(fb.group || 'Vasca')}):</strong><br>
        <span style="color: #475569;">"${escapeHtml(fb.text.substring(0, 140))}${fb.text.length > 140 ? '...' : ''}"</span>
      `;
    }
    openModal('modal-reply');
  }

  function openSubstituteModal(shiftId) {
    const shift = state.turni.find(t => t.id === shiftId);
    if (!shift) return;

    document.getElementById('sub-shift-id').value = shift.id;
    const details = document.getElementById('sub-shift-details');
    if (details) {
      details.innerHTML = `
        <strong>Turno:</strong> ${escapeHtml(shift.day)} · ${escapeHtml(shift.time)}<br>
        <strong>Corsia:</strong> ${escapeHtml(shift.laneGroup)}<br>
        <strong>Titolare:</strong> ${escapeHtml(shift.instructor)}
      `;
    }

    const select = document.getElementById('sub-instructor-select');
    if (select) {
      const others = state.config.instructors.filter(name => name.toLowerCase() !== (shift.instructor || '').toLowerCase());
      select.innerHTML = others.map(name => `<option value="${escapeHtml(name)}" ${shift.substitute === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('');
    }

    document.getElementById('sub-note').value = shift.notes || '';
    openModal('modal-substitute');
  }

  function openSubRequestModal(shiftId) {
    const shift = state.turni.find(t => t.id === shiftId);
    if (!shift) return;

    document.getElementById('req-shift-id').value = shift.id;
    const details = document.getElementById('req-shift-details');
    if (details) {
      details.innerHTML = `
        <strong>Turno:</strong> ${escapeHtml(shift.day)} · ${escapeHtml(shift.time)}<br>
        <strong>Corsia:</strong> ${escapeHtml(shift.laneGroup)}<br>
        <strong>Titolare:</strong> ${escapeHtml(shift.instructor)}
      `;
    }
    document.getElementById('req-sub-note').value = '';
    openModal('modal-sub-request');
  }

  function cancelSubRequest(shiftId) {
    const shift = state.turni.find(t => t.id === shiftId);
    if (!shift) return;

    if (confirm('Vuoi annullare la richiesta di cambio per questo turno?')) {
      shift.substitute = '';
      if (shift.notes && shift.notes.startsWith('Cercasi cambio')) {
        shift.notes = '';
      }
      saveLocalData();
      renderTurni();
      showToast('Richiesta cambio annullata.');

      postToGoogleSheets({
        action: 'update_turno',
        id: shift.id,
        day: shift.day,
        time: shift.time,
        laneGroup: shift.laneGroup,
        instructor: shift.instructor,
        substitute: '',
        notes: shift.notes
      });
    }
  }

  function openSubTakeModal(shiftId) {
    const shift = state.turni.find(t => t.id === shiftId);
    if (!shift) return;

    document.getElementById('take-shift-id').value = shift.id;
    const details = document.getElementById('take-shift-details');
    if (details) {
      details.innerHTML = `
        <strong>Turno:</strong> ${escapeHtml(shift.day)} · ${escapeHtml(shift.time)}<br>
        <strong>Corsia:</strong> ${escapeHtml(shift.laneGroup)}<br>
        <strong>Titolare da sostituire:</strong> <span style="font-weight: 800; color: #b91c1c;">${escapeHtml(shift.instructor)}</span>
        ${shift.notes ? `<br><strong>Nota:</strong> <em>${escapeHtml(shift.notes)}</em>` : ''}
      `;
    }
    const ownerSpan = document.getElementById('take-owner-name');
    if (ownerSpan) ownerSpan.textContent = shift.instructor;

    openModal('modal-sub-take');
  }

  // =========================================================================
  // GESTIONE PROFILI, PIN E ACCESSO
  // =========================================================================
  function openLoginModal() {
    renderLoginInstructorsGrid();
    document.getElementById('login-step-select')?.classList.remove('hidden');
    document.getElementById('login-step-pin')?.classList.add('hidden');
    openModal('modal-login');
  }

  function renderLoginInstructorsGrid() {
    const grid = document.getElementById('login-instructors-grid');
    if (!grid) return;

    grid.innerHTML = state.config.instructors.map(name => {
      const initial = name.charAt(0).toUpperCase();
      const color = getInstructorColor(name);
      const profile = state.profiles[name];
      const hasPin = Boolean(profile && profile.pin);

      return `
        <button type="button" class="instructor-login-btn" data-name="${escapeHtml(name)}">
          <div class="mini-avatar" style="background: ${color}; width: 38px; height: 38px; font-size: 16px;">
            ${initial}
          </div>
          <div style="font-weight: 800; font-size: 14px; color: var(--text); margin-top: 4px;">
            ${escapeHtml(name)}
          </div>
          <span class="badge ${hasPin ? 'badge-info' : 'badge-positive'}" style="font-size: 9px; margin-top: 4px;">
            ${hasPin ? '🔒 PIN Configurato' : '🆕 1° Accesso'}
          </span>
        </button>
      `;
    }).join('');
  }

  function selectInstructorForLogin(name) {
    const profile = state.profiles[name];
    const hasPin = Boolean(profile && profile.pin);

    document.getElementById('login-target-instructor').value = name;
    document.getElementById('login-instructor-name').textContent = name;
    const avatar = document.getElementById('login-avatar');
    if (avatar) {
      avatar.textContent = name.charAt(0).toUpperCase();
      avatar.style.background = getInstructorColor(name);
    }

    const modeDesc = document.getElementById('login-pin-mode-desc');
    const labelPin = document.getElementById('label-pin-input');
    const groupConfirm = document.getElementById('group-confirm-pin');
    const inputPin = document.getElementById('input-instructor-pin');
    const inputConfirm = document.getElementById('input-confirm-pin');
    const errorMsg = document.getElementById('login-error-msg');

    if (errorMsg) errorMsg.style.display = 'none';
    if (inputPin) inputPin.value = '';
    if (inputConfirm) inputConfirm.value = '';

    if (hasPin) {
      if (modeDesc) modeDesc.textContent = 'Bentornato/a! Inserisci il tuo PIN personale per accedere:';
      if (labelPin) labelPin.textContent = 'Inserisci il tuo PIN (4 cifre)';
      if (groupConfirm) groupConfirm.classList.add('hidden');
    } else {
      if (modeDesc) modeDesc.textContent = 'Primo accesso: crea il tuo PIN personale di 4 cifre per proteggere il tuo profilo.';
      if (labelPin) labelPin.textContent = 'Crea il tuo PIN (4 cifre)';
      if (groupConfirm) groupConfirm.classList.remove('hidden');
    }

    document.getElementById('login-step-select')?.classList.add('hidden');
    document.getElementById('login-step-pin')?.classList.remove('hidden');
    setTimeout(() => inputPin?.focus(), 200);
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('login-target-instructor').value;
    const pin = document.getElementById('input-instructor-pin').value.trim();
    const confirmPin = document.getElementById('input-confirm-pin').value.trim();
    const errorMsg = document.getElementById('login-error-msg');

    if (!name) return;

    const profile = state.profiles[name];
    const hasPin = Boolean(profile && profile.pin);

    if (!hasPin) {
      // Primo accesso: creazione PIN
      if (!/^\d{4}$/.test(pin)) {
        if (errorMsg) {
          errorMsg.textContent = 'Il PIN deve essere composto esattamente da 4 numeri (es. 1234).';
          errorMsg.style.display = 'block';
        }
        return;
      }
      if (pin !== confirmPin) {
        if (errorMsg) {
          errorMsg.textContent = 'I due PIN inseriti non corrispondono. Riprova.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      const hashedPin = await hashPin(pin, 'dinamica_instr_salt_');

      state.profiles[name] = {
        pin: hashedPin,
        dataCreazione: getTodayIsoDate(),
        ultimoAccesso: getTodayIsoDate()
      };

      saveLocalData();
      postToGoogleSheets({ action: 'save_pin', instructor: name, pin: hashedPin });

      // Il ruolo coordinatore è riservato esclusivamente a Luca
      if (name.toLowerCase() === 'luca') {
        state.user.isCoordinator = true;
        localStorage.setItem('dinamica_is_coordinator', 'true');
      } else {
        state.user.isCoordinator = false;
        localStorage.setItem('dinamica_is_coordinator', 'false');
      }

      loginUser(name);
      showToast(`✓ Benvenuto/a ${name}! Profilo e PIN salvati.`);
    } else {
      // Accesso con PIN esistente
      const hashedInput = await hashPin(pin, 'dinamica_instr_salt_');
      const hashedCoordInput = await hashPin(pin, 'dinamica_coord_salt_');

      var isPinCorrect = (hashedInput === profile.pin || pin === profile.pin);
      if (name.toLowerCase() === 'luca' && hashedCoordInput === state.config.coordinatorPinHash) {
        isPinCorrect = true;
      }

      if (isPinCorrect) {
        // Upgrade automatico a hash crittografico se memorizzato in chiaro
        if (profile.pin === pin) {
          profile.pin = hashedInput;
          postToGoogleSheets({ action: 'save_pin', instructor: name, pin: hashedInput });
        }
        if (state.profiles[name]) {
          state.profiles[name].ultimoAccesso = getTodayIsoDate();
          saveLocalData();
        }

        // Il ruolo coordinatore è riservato esclusivamente a Luca
        if (name.toLowerCase() === 'luca') {
          state.user.isCoordinator = true;
          localStorage.setItem('dinamica_is_coordinator', 'true');
        } else {
          state.user.isCoordinator = false;
          localStorage.setItem('dinamica_is_coordinator', 'false');
        }

        loginUser(name);
        showToast(`✓ Bentornato/a ${name}!`);
      } else {
        if (errorMsg) {
          errorMsg.textContent = 'PIN errato. Riprova o chiedi al coordinatore Luca di azzerarlo.';
          errorMsg.style.display = 'block';
        }
      }
    }
  }

  function loginUser(name) {
    state.user.name = name;
    state.user.isLoggedIn = true;
    localStorage.setItem('dinamica_my_name', name);
    localStorage.setItem('dinamica_logged_in', 'true');

    closeModal('modal-login');
    updateUserView();
    renderAll();
  }

  function handleLogout() {
    state.user.isLoggedIn = false;
    localStorage.setItem('dinamica_logged_in', 'false');
    closeModal('modal-settings');
    updateUserView();
    openLoginModal();
    showToast('Profilo disconnesso.');
  }

  async function handleChangePin() {
    const currentName = state.user.name;
    if (!currentName) return;

    const newPin = prompt(`Inserisci il nuovo PIN personale di 4 cifre per ${currentName}:`);
    if (!newPin) return;

    if (!/^\d{4}$/.test(newPin.trim())) {
      alert('Il PIN deve essere esattamente di 4 cifre numeriche (es. 5678).');
      return;
    }

    const hashedPin = await hashPin(newPin.trim(), 'dinamica_instr_salt_');

    if (!state.profiles[currentName]) {
      state.profiles[currentName] = {};
    }
    state.profiles[currentName].pin = hashedPin;
    state.profiles[currentName].ultimoAccesso = getTodayIsoDate();

    saveLocalData();
    postToGoogleSheets({ action: 'save_pin', instructor: currentName, pin: hashedPin });
    showToast('✓ Nuovo PIN salvato con successo!');
  }

  function handleResetColleaguePin() {
    const select = document.getElementById('select-reset-instructor');
    if (!select) return;
    const targetInstr = select.value;
    if (!targetInstr) return;

    if (confirm(`Sei sicuro di voler azzerare il PIN di ${targetInstr}? Al prossimo accesso potrà impostarne uno nuovo.`)) {
      if (state.profiles[targetInstr]) {
        delete state.profiles[targetInstr];
      }
      saveLocalData();
      postToGoogleSheets({ action: 'reset_pin', instructor: targetInstr });
      showToast(`✓ PIN di ${targetInstr} azzerato!`);
    }
  }

  function updateCoordStatusView() {
    const isLuca = (state.user.name || '').trim().toLowerCase() === 'luca';
    const sectionWrap = document.getElementById('section-coordinator-wrap');
    if (sectionWrap) {
      sectionWrap.style.display = isLuca ? 'block' : 'none';
    }
    if (isLuca) {
      state.user.isCoordinator = true;
      localStorage.setItem('dinamica_is_coordinator', 'true');
    } else {
      state.user.isCoordinator = false;
      localStorage.setItem('dinamica_is_coordinator', 'false');
    }

    const titleEl = document.getElementById('modal-settings-title');
    if (titleEl) {
      titleEl.textContent = isLuca ? '👑 Profilo Coordinatore (Luca)' : '👤 Profilo Istruttore';
    }

    const resetSelect = document.getElementById('select-reset-instructor');
    if (resetSelect && isLuca) {
      resetSelect.innerHTML = state.config.instructors
        .filter(n => n.toLowerCase() !== 'luca')
        .map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
        .join('');
    }
  }

  function populateSelectOptions() {
    const instructors = state.config.instructors;
    const authorSelect = document.getElementById('fb-author');
    const replyAuthorSelect = document.getElementById('reply-author');
    const myNameSelect = document.getElementById('setting-my-name');
    const shiftFilterSelect = document.getElementById('filter-shift-instructor');

    const instrOptions = instructors.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

    if (authorSelect) authorSelect.innerHTML = instrOptions;
    if (replyAuthorSelect) replyAuthorSelect.innerHTML = instrOptions;
    if (myNameSelect) myNameSelect.innerHTML = instrOptions;

    if (shiftFilterSelect) {
      shiftFilterSelect.innerHTML = '<option value="all">Tutti gli istruttori</option>' + instrOptions;
    }

    const groupSelect = document.getElementById('fb-group');
    if (groupSelect) {
      groupSelect.innerHTML = state.config.groups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
    }

    const tagsContainer = document.getElementById('quick-tags-container');
    if (tagsContainer) {
      tagsContainer.innerHTML = state.config.quickTags.map(tag => `
        <button type="button" class="quick-tag-btn" data-tag="${escapeHtml(tag)}">+ ${escapeHtml(tag)}</button>
      `).join('');

      const selectedTags = new Set();
      tagsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.quick-tag-btn');
        if (!btn) return;
        const tag = btn.getAttribute('data-tag');
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
          btn.classList.remove('selected');
        } else {
          selectedTags.add(tag);
          btn.classList.add('selected');
        }
        document.getElementById('fb-tags-hidden').value = Array.from(selectedTags).join(',');
      });
    }
  }

  function clearQuickTags() {
    document.querySelectorAll('.quick-tag-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('fb-tags-hidden').value = '';
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const label = document.getElementById('toast-msg');
    const icon = document.getElementById('toast-icon');
    if (!toast || !label) return;

    label.textContent = msg;
    if (icon) icon.textContent = isError ? '⚠️' : '✓';
    toast.style.background = isError ? '#991b1b' : '#0f172a';
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTodayIsoDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getYesterdayIsoDate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // Avvio al caricamento del DOM
  window.addEventListener('DOMContentLoaded', initApp);

})();
