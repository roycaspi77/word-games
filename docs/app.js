/* משחקי מילים – משחקים בעברית לילדים. Vanilla JS, no build step. */
(function () {
  'use strict';

  // ---------- words ----------
  const WORDS = [];
  (window.WORDS_RAW || '').split('\n').forEach(line => {
    const i = line.indexOf('|');
    if (i < 0) return;
    const term = line.slice(0, i).trim();
    const def = line.slice(i + 1).trim();
    if (!term || !def) return;
    let id = term;
    while (WORDS.some(w => w.id === id)) id += '*';
    WORDS.push({ id, term, def, letter: firstLetter(term) });
  });

  function strip(s) { return s.replace(/[֑-ׇ]/g, ''); } // remove niqqud
  function firstLetter(s) { return strip(s).replace(/[^א-ת]/g, '').charAt(0); }
  const LETTERS = [...new Set(WORDS.map(w => w.letter))];

  // ---------- saved progress (on this device) ----------
  const KEY = 'wordgames.v1';
  const DEFAULT = {
    name: '', sound: true, stars: 0,
    mastery: {},          // id -> { ok, bad, streak }
    fav: [],              // ids
    badges: [],           // ids
    days: [],             // 'YYYY-MM-DD' played
    stats: {
      games: 0, memoryGames: 0, triviaGames: 0, flashSeen: 0, correct: 0, bestStreak: 0, perfectTrivia: 0, memoryBest: {},
      memoryThreeStars: 0, reverseGames: 0, wordsearchGames: 0, wordsFound: 0, searchHard: 0, searchNoHint: 0, early: 0, night: 0,
      duvGames: 0, duvBuilt: 0, duvPopped: 0, duvPerfect: 0,
      engGames: 0, engPerfect: 0, engSpelled: 0, engTenseRight: 0,
    },
  };
  let S = load();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Object.assign({}, DEFAULT, raw, { stats: Object.assign({}, DEFAULT.stats, raw.stats || {}) });
    } catch (e) { return JSON.parse(JSON.stringify(DEFAULT)); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }

  function m(id) { return S.mastery[id] || (S.mastery[id] = { ok: 0, bad: 0, streak: 0 }); }
  function isMastered(id) { const x = S.mastery[id]; return !!x && x.streak >= 3; }
  function isHard(id) { const x = S.mastery[id]; return !!x && x.bad > 0 && x.streak < 2; }
  function record(id, ok) {
    const x = m(id);
    if (ok) { x.ok++; x.streak++; S.stats.correct++; } else { x.bad++; x.streak = 0; }
  }
  function addStars(n) { S.stars += n; updateStars(); }
  function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function markPlayed() {
    const t = today();
    if (!S.days.includes(t)) S.days.push(t);
    if (S.days.length > 400) S.days = S.days.slice(-400);
    S.stats.games++;
    const hr = new Date().getHours();
    if (hr < 7 && hr >= 4) S.stats.early++;
    if (hr >= 21) S.stats.night++;
  }
  function dayStreak() {
    const set = new Set(S.days);
    let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1); // yesterday still counts until you play today
    for (;;) {
      const k = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      if (!set.has(k)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function masteredCount() { return WORDS.filter(w => isMastered(w.id)).length; }

  // ---------- helpers ----------
  const $app = document.getElementById('app');
  function h(html) { $app.innerHTML = html; $app.firstElementChild && $app.firstElementChild.classList.add('fade-in'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function updateStars() { document.getElementById('starsCount').textContent = S.stars; }

  // words that share a meaningful word in their definitions are "too close" to sit together
  const STOP = new Set(['של', 'את', 'על', 'עם', 'אחר', 'דבר', 'משהו', 'מאוד', 'בדרך', 'כלל', 'לא', 'אדם', 'מי', 'שלא', 'בעיקר', 'כדי', 'לרוב', 'מסוים', 'מסוימת', 'יותר', 'מדי', 'זה', 'לזה', 'שבו', 'אותו']);
  const keyWords = s => strip(s).replace(/[^א-ת ]/g, ' ').split(/\s+/).filter(x => x.length >= 3 && !STOP.has(x));
  WORDS.forEach(w => { w.keys = new Set(keyWords(w.def)); w.plain = strip(w.term).replace(/\s*\(.*?\)/g, '').trim(); });
  function tooClose(a, b) {
    if (a.plain === b.plain) return true;
    for (const k of a.keys) if (b.keys.has(k)) return true;
    return false;
  }

  // choose n words from the pool, preferring ones the child doesn't know yet
  function choose(pool, n, accept) {
    const weighted = shuffle(pool).map(w => {
      const x = S.mastery[w.id];
      let score = Math.random();
      if (!x) score += 0.6; else if (isHard(w.id)) score += 1; else if (isMastered(w.id)) score -= 0.6;
      return { w, score };
    }).sort((a, b) => b.score - a.score).map(o => o.w);
    const out = [];
    for (const w of weighted) {
      if (out.length >= n) break;
      if (accept && !accept(w)) continue;
      if (out.some(o => tooClose(o, w))) continue;
      out.push(w);
    }
    return out;
  }

  // ---------- word pools ----------
  const POOLS = {
    all:   { label: 'כל המילים', get: () => WORDS },
    fresh: { label: '🆕 מילים חדשות', get: () => WORDS.filter(w => !S.mastery[w.id]) },
    hard:  { label: '💪 מילים קשות', get: () => WORDS.filter(w => isHard(w.id)) },
    fav:   { label: '⭐ המועדפים שלי', get: () => WORDS.filter(w => S.fav.includes(w.id)) },
    letter:{ label: '🔤 לפי אות', get: (L) => WORDS.filter(w => w.letter === L) },
  };
  let pool = { kind: 'all', letter: LETTERS[0] };
  function poolWords() { return POOLS[pool.kind].get(pool.letter); }

  function poolPicker(min) {
    const chips = Object.entries(POOLS).map(([k, p]) => {
      const n = k === 'letter' ? null : p.get().length;
      const dis = n !== null && n < min;
      return `<button class="chip ${pool.kind === k ? 'on' : ''}" data-pool="${k}" ${dis ? 'disabled' : ''}>${p.label}${n !== null ? ' (' + n + ')' : ''}</button>`;
    }).join('');
    const letters = `<select class="letters" id="letterSel" ${pool.kind === 'letter' ? '' : 'hidden'}>` +
      LETTERS.map(L => `<option ${L === pool.letter ? 'selected' : ''} value="${L}">${L} (${POOLS.letter.get(L).length})</option>`).join('') + '</select>';
    return `<div class="label">על אילו מילים משחקים?</div><div class="chips">${chips}${letters}</div>`;
  }
  function bindPoolPicker(rerender) {
    $app.querySelectorAll('[data-pool]').forEach(b => b.onclick = () => { pool.kind = b.dataset.pool; sfx('tap'); rerender(); });
    const sel = document.getElementById('letterSel');
    if (sel) sel.onchange = () => { pool.letter = sel.value; rerender(); };
  }
  function ensurePool(min) {
    if (poolWords().length >= min) return true;
    toast(`צריך לפחות ${min} מילים בקבוצה הזאת – בחרו קבוצה אחרת`);
    return false;
  }

  // ---------- sound (Web Audio, no files) ----------
  let actx = null;
  function tone(freq, start, dur, type, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.18, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + start + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.02);
  }
  function sfx(kind) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      if (kind === 'tap') tone(660, 0, 0.06, 'triangle', 0.1);
      else if (kind === 'flip') tone(520, 0, 0.08, 'triangle', 0.12);
      else if (kind === 'good') { tone(660, 0, 0.12); tone(880, 0.1, 0.18); }
      else if (kind === 'bad') { tone(220, 0, 0.18, 'square', 0.08); tone(170, 0.15, 0.25, 'square', 0.08); }
      else if (kind === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25));
      else if (kind === 'badge') [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.2, 'triangle'));
    } catch (e) { /* no audio */ }
  }

  // speech (only if the device has a Hebrew voice)
  function heVoice() { return (window.speechSynthesis && speechSynthesis.getVoices().find(v => /^he|^iw/i.test(v.lang))) || null; }
  function say(text, keepNiqqud) {
    const v = heVoice(); if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(keepNiqqud ? text : strip(text)); u.voice = v; u.lang = v.lang; u.rate = 0.9;
    speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { if (location.hash === '#words' || location.hash === '#flash') route(); };

  // ---------- toast + confetti ----------
  let toastT;
  function toast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }
  const cv = document.getElementById('confetti'), cx = cv.getContext('2d');
  let parts = [], raf = 0;
  function confetti(n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const colors = ['#7c3aed', '#ec4899', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#14b8a6'];
    for (let i = 0; i < (n || 140); i++) parts.push({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.4,
      vx: (Math.random() - 0.5) * 6, vy: 3 + Math.random() * 6, r: 5 + Math.random() * 7,
      a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: pick(colors),
    });
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.a += p.va;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c;
      cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cx.restore();
    });
    parts = parts.filter(p => p.y < cv.height + 30);
    raf = parts.length ? requestAnimationFrame(step) : 0;
    if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
  }

  // ---------- badges ----------
  // each badge: v() = current value, goal = value needed (progress bar on the achievements screen)
  const st = () => S.stats;
  const BADGES = [
    // getting started
    { id: 'first',    e: '🎈', t: 'התחלה טובה',        d: 'שיחקת משחק ראשון',              v: () => st().games, goal: 1 },
    { id: 'allGames', e: '🌈', t: 'טועם מכל הבא ליד',  d: 'שיחקת בכל המשחקים',             v: () => [st().memoryGames, st().triviaGames, st().wordsearchGames, st().flashSeen].filter(Boolean).length, goal: 4 },
    { id: 'games25',  e: '🎮', t: 'שחקן מושבע',        d: 'שיחקת 25 משחקים',               v: () => st().games, goal: 25 },
    { id: 'games100', e: '🕹️', t: 'מכור למילים',       d: 'שיחקת 100 משחקים',              v: () => st().games, goal: 100 },
    // memory
    { id: 'mem1',     e: '🧠', t: 'זיכרון של פיל',     d: 'סיימת משחק זיכרון',             v: () => st().memoryGames, goal: 1 },
    { id: 'mem3',     e: '✨', t: 'זיכרון צילומי',     d: '3 כוכבים במשחק זיכרון',         v: () => st().memoryThreeStars, goal: 1 },
    { id: 'mem32',    e: '🦁', t: 'לב של אריה',        d: 'סיימת זיכרון בינוני (32 זוגות)', v: () => st().memoryBest[32] ? 1 : 0, goal: 1 },
    { id: 'memPro',   e: '🐘', t: 'אלוף הזיכרון',      d: 'סיימת זיכרון קשה (64 זוגות)',    v: () => st().memoryBest[64] ? 1 : 0, goal: 1 },
    { id: 'mem10',    e: '🎴', t: 'מהפך קלפים',        d: 'סיימת 10 משחקי זיכרון',         v: () => st().memoryGames, goal: 10 },
    // trivia
    { id: 'triv1',    e: '❓', t: 'יודע תשובות',       d: 'סיימת סבב טריוויה',             v: () => st().triviaGames, goal: 1 },
    { id: 'reverse',  e: '🔄', t: 'הפוך על הפוך',      d: 'סיימת טריוויה במצב "איזו מילה מתאימה"', v: () => st().reverseGames, goal: 1 },
    { id: 'perfect',  e: '💯', t: 'מושלם!',             d: '10 מתוך 10 בטריוויה',           v: () => st().perfectTrivia, goal: 1 },
    { id: 'perfect5', e: '🎯', t: 'צלף',                d: '5 סבבים מושלמים בטריוויה',      v: () => st().perfectTrivia, goal: 5 },
    { id: 'triv10',   e: '🎓', t: 'פרופסור',            d: 'סיימת 10 סבבי טריוויה',         v: () => st().triviaGames, goal: 10 },
    { id: 'streak5',  e: '🔥', t: 'על הגל',             d: '5 תשובות נכונות ברצף',          v: () => st().bestStreak, goal: 5 },
    { id: 'streak15', e: '🚀', t: 'בלתי ניתן לעצירה',  d: '15 תשובות נכונות ברצף',         v: () => st().bestStreak, goal: 15 },
    { id: 'streak30', e: '☄️', t: 'כוכב שביט',          d: '30 תשובות נכונות ברצף',         v: () => st().bestStreak, goal: 30 },
    { id: 'correct100', e: '💡', t: 'מאה תשובות',       d: '100 תשובות נכונות בסך הכול',    v: () => st().correct, goal: 100 },
    { id: 'correct500', e: '🧙', t: 'קוסם המילים',      d: '500 תשובות נכונות בסך הכול',    v: () => st().correct, goal: 500 },
    // word search
    { id: 'search1',  e: '🔎', t: 'בלש מילים',          d: 'סיימת תפזורת',                  v: () => st().wordsearchGames, goal: 1 },
    { id: 'searchEagle', e: '🦅', t: 'עין של נשר',      d: 'סיימת תפזורת בלי רמזים',        v: () => st().searchNoHint, goal: 1 },
    { id: 'searchHard', e: '🕵️', t: 'בלש על',          d: 'סיימת תפזורת קשה',              v: () => st().searchHard, goal: 1 },
    { id: 'search50', e: '🧩', t: 'מוצא הכול',          d: 'מצאת 50 מילים בתפזורות',        v: () => st().wordsFound, goal: 50 },
    // learning
    { id: 'flash',    e: '🃏', t: 'לומד חרוץ',          d: 'עברת על 30 כרטיסיות',           v: () => st().flashSeen, goal: 30 },
    { id: 'flash100', e: '📝', t: 'שקדן',                d: 'עברת על 100 כרטיסיות',          v: () => st().flashSeen, goal: 100 },
    { id: 'fav10',    e: '❤️', t: 'יש לי מועדפות',      d: 'סימנת 10 מילים מועדפות',        v: () => S.fav.length, goal: 10 },
    { id: 'words10',  e: '🌱', t: 'נבט של ידע',         d: 'שלטת ב-10 מילים',               v: masteredCount, goal: 10 },
    { id: 'words25',  e: '📗', t: 'אספן מילים',         d: 'שלטת ב-25 מילים',               v: masteredCount, goal: 25 },
    { id: 'words100', e: '📚', t: 'תולעת ספרים',        d: 'שלטת ב-100 מילים',              v: masteredCount, goal: 100 },
    { id: 'words200', e: '🏰', t: 'מגדל של מילים',      d: 'שלטת ב-200 מילים',              v: masteredCount, goal: 200 },
    { id: 'wordsAll', e: '👑', t: 'מלך המילים',          d: 'שלטת בכל המילים!',              v: masteredCount, goal: WORDS.length },
    // Duvduv's area
    { id: 'duv1',     e: '🍒', t: 'חבר של דובדוב',      d: 'שיחקת באיזור של דובדוב',        v: () => st().duvGames, goal: 1 },
    { id: 'duvPerfect', e: '🌟', t: 'כוכב כיתה א\'',     d: 'הכול נכון במשחק של דובדוב',     v: () => st().duvPerfect, goal: 1 },
    { id: 'duvBuild25', e: '🧱', t: 'בנאי מילים',        d: 'בנית 25 מילים',                 v: () => st().duvBuilt, goal: 25 },
    { id: 'duvPop50', e: '🎉', t: 'מפוצץ בלונים',        d: 'פוצצת 50 בלונים נכונים',        v: () => st().duvPopped, goal: 50 },
    { id: 'duv20',    e: '🧺', t: 'סל דובדבנים',         d: '20 משחקים באיזור של דובדוב',    v: () => st().duvGames, goal: 20 },
    // Noshnosh's area (English)
    { id: 'eng1',     e: '🌍', t: 'Hello World',          d: 'שיחקת באיזור של נושנוש',        v: () => st().engGames, goal: 1 },
    { id: 'engPerfect', e: '✅', t: 'Perfect!',            d: 'סבב מושלם באנגלית',             v: () => st().engPerfect, goal: 1 },
    { id: 'engTense50', e: '⏱️', t: 'אדון הזמנים',        d: '50 תשובות נכונות ב-Simple / Progressive', v: () => st().engTenseRight, goal: 50 },
    { id: 'engSpell20', e: '🔡', t: 'Spelling Bee',       d: 'איית נכון 20 מילים באנגלית',    v: () => st().engSpelled, goal: 20 },
    { id: 'eng20',    e: '🗽', t: 'דובר אנגלית',          d: '20 משחקים באיזור של נושנוש',    v: () => st().engGames, goal: 20 },
    // habits and stars
    { id: 'days3',    e: '📅', t: 'מתמיד',               d: 'שיחקת 3 ימים ברצף',             v: dayStreak, goal: 3 },
    { id: 'days7',    e: '🏅', t: 'שבוע של מילים',       d: 'שיחקת 7 ימים ברצף',             v: dayStreak, goal: 7 },
    { id: 'days14',   e: '🥈', t: 'שבועיים בלי הפסקה',   d: 'שיחקת 14 ימים ברצף',            v: dayStreak, goal: 14 },
    { id: 'days30',   e: '🥇', t: 'חודש של אלופים',      d: 'שיחקת 30 ימים ברצף',            v: dayStreak, goal: 30 },
    { id: 'early',    e: '🐓', t: 'משכים קום',           d: 'שיחקת לפני 7 בבוקר',            v: () => st().early, goal: 1 },
    { id: 'night',    e: '🦉', t: 'ינשוף לילה',          d: 'שיחקת אחרי 9 בערב',             v: () => st().night, goal: 1 },
    { id: 'stars100', e: '🌟', t: 'מאה כוכבים',          d: 'אספת 100 כוכבים',               v: () => S.stars, goal: 100 },
    { id: 'stars500', e: '💫', t: 'גלקסיה',              d: 'אספת 500 כוכבים',               v: () => S.stars, goal: 500 },
    { id: 'stars1000',e: '🪐', t: 'אלף כוכבים',          d: 'אספת 1000 כוכבים',              v: () => S.stars, goal: 1000 },
  ];
  BADGES.forEach(b => { b.test = () => b.v() >= b.goal; });
  function checkBadges() {
    const got = BADGES.filter(b => !S.badges.includes(b.id) && b.test());
    got.forEach(b => S.badges.push(b.id));
    save();
    got.forEach((b, i) => setTimeout(() => { sfx('badge'); toast(`${b.e} קיבלת תג חדש: ${b.t}!`); }, 900 + i * 2800));
  }

  // ---------- games registry (add new games here) ----------
  const GAMES = [
    { id: 'memory', emoji: '🧠', title: 'משחק הזיכרון', sub: 'מצאו זוגות של מילה ופירוש', tile: 'tile-purple' },
    { id: 'trivia', emoji: '❓', title: 'טריוויה',       sub: 'מה פירוש המילה? 3 אפשרויות', tile: 'tile-pink' },
    { id: 'wordsearch', emoji: '🔎', title: 'תפזורת',     sub: 'מוצאים מילים לפי הפירוש',   tile: 'tile-green' },
    { id: 'flash',  emoji: '🃏', title: 'כרטיסיות',      sub: 'לומדים מילים חדשות',        tile: 'tile-orange' },
  ];

  // ---------- screens ----------
  const SCREENS = { home, hebrew, memory, trivia, wordsearch, flash, words, badges, settings, duvduv, duvFirst, duvRead, duvBuild, duvBalloons, english, engVocab, engSpell, engTense, engSignal, engRules };
  let backTo = '#home';
  function route() {
    const name = (location.hash || '#home').slice(1).split('?')[0];
    const fn = SCREENS[name] || home;
    stopTimers();
    document.body.classList.toggle('duv', name.startsWith('duv'));
    document.body.classList.toggle('eng', name === 'english' || name.startsWith('eng'));
    backTo = name.startsWith('duv') && name !== 'duvduv' ? '#duvduv'
      : name.startsWith('eng') && name !== 'english' ? '#english'
      : LULI_SCREENS.includes(name) && name !== 'hebrew' ? '#hebrew' : '#home';
    document.getElementById('backBtn').hidden = fn === home;
    fn();
    scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  document.getElementById('backBtn').onclick = () => { location.hash = backTo; };

  let timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function every(fn, ms) { timers.push(setInterval(fn, ms)); }
  function stopTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

  // home: one tile per area, plus achievements and settings
  function home() {
    const ds = dayStreak();
    const greet = S.name ? `שלום ${esc(S.name)}!` : 'שלום!';
    h(`<section>
      <div class="panel hello">
        <div class="owl">🦉</div>
        <div style="flex:1">
          <h1>${greet}</h1>
          <div class="muted">לאיזה איזור נכנסים היום?${ds ? ` · <span class="streak">🔥 ${ds} ימים ברצף</span>` : ''}</div>
        </div>
      </div>
      <div class="game-grid areas">
        <button class="game-tile tile-luli" data-go="hebrew"><span class="emoji">${LULI_ICON}</span><span class="title">האיזור של לולי</span><span class="sub">משחקי עברית לכיתה ו'</span></button>
        <button class="game-tile tile-cherry" data-go="duvduv"><span class="emoji">🍒</span><span class="title">האיזור של דובדוב</span><span class="sub">משחקי עברית לכיתה א'</span></button>
        <button class="game-tile tile-indigo" data-go="english"><span class="emoji">${ENG_ICON}</span><span class="title">האיזור של נושנוש</span><span class="sub">אנגלית לכיתה ח'</span></button>
        <button class="game-tile tile-blue" data-go="badges"><span class="emoji">🏆</span><span class="title">הישגים</span><span class="sub">${S.badges.length} מתוך ${BADGES.length} תגים</span></button>
      </div>
      <div class="row center" style="margin-top:18px"><button class="btn ghost small" data-go="settings">⚙️ הגדרות</button></div>
    </section>`);
    bindGo();
  }

  // ===== Luli's area (האיזור של לולי): the vocabulary games for 6th grade =====
  const LULI_ICON = '🍭';
  const LULI_SCREENS = ['hebrew', 'memory', 'trivia', 'wordsearch', 'flash', 'words'];
  function hebrew() {
    const w = WORDS[Math.abs(hash(today())) % WORDS.length];
    const mc = masteredCount(), pct = Math.round(mc * 100 / WORDS.length);
    h(`<section>
      <div class="panel luli-hero">
        <div class="eng-mascot">${LULI_ICON}</div>
        <div style="flex:1">
          <h1>האיזור של לולי</h1>
          <div class="muted">שלטת ב-<b>${mc}</b> מתוך ${WORDS.length} מילים</div>
          <div class="progress"><div style="width:${Math.max(pct, mc ? 2 : 0)}%"></div></div>
        </div>
      </div>
      <div class="game-grid">
        ${GAMES.map(g => `<button class="game-tile ${g.tile}" data-go="${g.id}"><span class="emoji">${g.emoji}</span><span class="title">${g.title}</span><span class="sub">${g.sub}</span></button>`).join('')}
        <button class="game-tile tile-teal" data-go="words"><span class="emoji">📖</span><span class="title">המילון שלי</span><span class="sub">חיפוש, מועדפים ומילים קשות</span></button>
      </div>
      <div class="panel wotd" style="margin-top:18px">
        <div class="label">✨ המילה של היום</div>
        <div class="row"><span class="term">${esc(w.term)}</span>${heVoice() ? `<button class="icon-btn" id="sayW" aria-label="השמעה">🔊</button>` : ''}</div>
        <div style="font-size:19px;margin-top:4px">${esc(w.def)}</div>
      </div>
    </section>`);
    bindGo();
    const sb = document.getElementById('sayW'); if (sb) sb.onclick = () => say(w.term);
  }
  function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }
  function bindGo() { $app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { sfx('tap'); location.hash = '#' + b.dataset.go; }); }

  // ===== Memory game =====
  const MEM_LEVELS = [[8, '😊 קל – 8 זוגות'], [32, '😎 בינוני – 32 זוגות'], [64, '🤯 קשה – 64 זוגות']];
  let memPairs = 8;
  function memory() {
    h(`<section class="panel">
      <h2>🧠 משחק הזיכרון</h2>
      <p>הפכו שני קלפים בכל תור. מצאו את <b>המילה</b> ואת <b>הפירוש</b> שלה!</p>
      <div class="label">כמה זוגות?</div>
      <div class="chips">
        ${MEM_LEVELS.map(([n, l]) => `<button class="chip ${memPairs === n ? 'on' : ''}" data-n="${n}">${l}</button>`).join('')}
      </div>
      ${poolPicker(8)}
      <button class="btn" id="go">יאללה, מתחילים! 🎉</button>
    </section>`);
    $app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { memPairs = +b.dataset.n; sfx('tap'); memory(); });
    bindPoolPicker(memory);
    document.getElementById('go').onclick = () => { if (ensurePool(memPairs)) memoryPlay(); };
  }

  function memoryPlay() {
    const src = poolWords();
    let chosen = choose(src, memPairs, w => w.def.length <= (memPairs >= 32 ? 40 : 48));
    if (chosen.length < memPairs) chosen = choose(src, memPairs); // small pools: allow long definitions
    const n = chosen.length;
    const cards = shuffle(chosen.flatMap(w => [{ w, kind: 'term' }, { w, kind: 'def' }]));
    let open = [], matched = 0, moves = 0, secs = 0, lock = false;
    h(`<section>
      <div class="hud"><span>🔄 תורות: <b id="mv">0</b></span><span>✅ זוגות: <b id="pr">0</b>/${n}</span><span>⏱️ <b id="tm">0:00</b></span></div>
      <div class="legend"><span><i style="background:#ede9fe"></i>מילה</span><span><i style="background:#ffedd5"></i>פירוש</span></div>
      <div class="mem-grid ${n >= 64 ? 'xl' : n >= 32 ? 'lg' : ''}" id="grid">
        ${cards.map((c, i) => `<button class="mcard" data-i="${i}" aria-label="קלף ${i + 1}"><div class="inner">
          <div class="face back">?</div>
          <div class="face front ${c.kind}">${esc(c.kind === 'term' ? c.w.term : c.w.def)}</div></div></button>`).join('')}
      </div>
      <div class="row center" style="margin-top:16px"><button class="btn ghost small" id="again">🔁 משחק חדש</button></div>
    </section>`);
    const els = [...$app.querySelectorAll('.mcard')];
    const fmt = s => Math.floor(s / 60) + ':' + pad(s % 60);
    every(() => { secs++; document.getElementById('tm').textContent = fmt(secs); }, 1000);
    document.getElementById('again').onclick = memoryPlay;

    els.forEach(el => el.onclick = () => {
      const i = +el.dataset.i;
      if (lock || el.classList.contains('open') || el.classList.contains('done')) return;
      sfx('flip'); el.classList.add('open'); open.push(i);
      if (open.length < 2) return;
      moves++; document.getElementById('mv').textContent = moves;
      const [a, b] = open.map(k => cards[k]);
      const [ea, eb] = open.map(k => els[k]);
      open = [];
      if (a.w === b.w && a.kind !== b.kind) {
        record(a.w.id, true);
        later(() => { ea.classList.add('done'); eb.classList.add('done'); sfx('good'); }, 350);
        matched++; document.getElementById('pr').textContent = matched;
        if (matched === n) later(() => memoryWin(n, moves, secs, chosen), 900);
      } else {
        lock = true;
        later(() => { ea.classList.add('shake'); eb.classList.add('shake'); }, 600);
        later(() => { ea.classList.remove('open', 'shake'); eb.classList.remove('open', 'shake'); lock = false; }, 1250);
      }
    });
  }

  function memoryWin(n, moves, secs, chosen) {
    stopTimers();
    const stars = moves <= Math.ceil(n * 1.6) ? 3 : moves <= n * 2.5 ? 2 : 1;
    const earned = stars * 2 + n;
    addStars(earned);
    S.stats.memoryGames++;
    if (stars === 3) S.stats.memoryThreeStars++;
    const best = S.stats.memoryBest[n];
    const newBest = !best || moves < best;
    if (newBest) S.stats.memoryBest[n] = moves;
    markPlayed(); save();
    sfx('win'); confetti();
    h(`<section class="panel center">
      <h1>כל הכבוד! 🎉</h1>
      <div class="result-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
      <p>מצאת ${n} זוגות ב-<b>${moves}</b> תורות ובזמן ${Math.floor(secs / 60)}:${pad(secs % 60)}.<br>
      ${newBest ? '🏆 שיא חדש!' : `השיא שלך: ${best} תורות`} · הרווחת <b>${earned}</b> כוכבים</p>
      <details ${n <= 8 ? 'open' : ''} style="text-align:right"><summary class="label">המילים מהמשחק (${n})</summary>
      <ul class="mistakes">${chosen.map(w => `<li style="background:#f0fdf4"><b>${esc(w.term)}</b> – ${esc(w.def)}</li>`).join('')}</ul></details>
      <div class="row center" style="margin-top:14px">
        <button class="btn" id="again">🔁 עוד פעם</button>
        <button class="btn ghost" data-go="hebrew">${LULI_ICON} לאיזור של לולי</button>
      </div>
    </section>`);
    document.getElementById('again').onclick = memoryPlay; bindGo();
    checkBadges();
  }

  // ===== Trivia =====
  let trMode = 'word'; // word: show word, choose meaning · def: show meaning, choose word
  const TR_LEN = 10;
  function trivia() {
    h(`<section class="panel">
      <h2>❓ טריוויה</h2>
      <p>${TR_LEN} שאלות. לכל שאלה 3 תשובות – רק אחת נכונה!</p>
      <div class="label">איך משחקים?</div>
      <div class="chips">
        <button class="chip ${trMode === 'word' ? 'on' : ''}" data-m="word">📝 מה פירוש המילה?</button>
        <button class="chip ${trMode === 'def' ? 'on' : ''}" data-m="def">🔍 איזו מילה מתאימה?</button>
      </div>
      ${poolPicker(3)}
      <button class="btn pink" id="go">יאללה, מתחילים! 🎉</button>
    </section>`);
    $app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { trMode = b.dataset.m; sfx('tap'); trivia(); });
    bindPoolPicker(trivia);
    document.getElementById('go').onclick = () => { if (ensurePool(3)) triviaPlay(); };
  }

  function triviaPlay() {
    const src = poolWords();
    const qs = pickQuestions(src);
    const results = []; let qi = 0, streak = 0, starsGot = 0;

    function pickQuestions(s) {
      // questions may repeat-neighbour; distractors come from the whole list so small pools still work
      const list = choose(s, Math.min(TR_LEN, s.length));
      while (list.length < TR_LEN && s.length) list.push(pick(s));
      return list;
    }
    function distractors(w) {
      const cands = shuffle(WORDS).filter(o => o !== w && !tooClose(o, w));
      const out = [];
      for (const o of cands) { if (out.length === 2) break; if (!out.some(x => tooClose(x, o))) out.push(o); }
      return out;
    }
    function show() {
      const w = qs[qi];
      const opts = shuffle([w, ...distractors(w)]);
      const askWord = trMode === 'word';
      let hinted = false;
      h(`<section>
        <div class="panel q-card">
          <div class="q-progress">${qs.map((_, k) => `<i class="${k < qi ? (results[k] ? 'ok' : 'bad') : k === qi ? 'now' : ''}"></i>`).join('')}</div>
          <div class="hud"><span>שאלה ${qi + 1}/${qs.length}</span>${streak >= 2 ? `<span>🔥 ${streak} ברצף</span>` : ''}</div>
          <div class="q-ask">${askWord ? 'מה פירוש המילה' : 'איזו מילה מתאימה לפירוש'}</div>
          <div class="q-word ${askWord ? '' : 'long'}">${esc(askWord ? w.term : w.def)}</div>
          <div class="answers">${opts.map((o, k) => `<button class="answer" data-k="${k}">${esc(askWord ? o.def : o.term)}</button>`).join('')}</div>
          <button class="btn ghost small hint-btn" id="hint">💡 רמז (50/50)</button>
          <div class="feedback" id="fb"></div>
        </div>
      </section>`);
      const btns = [...$app.querySelectorAll('.answer')];
      document.getElementById('hint').onclick = (e) => {
        if (hinted) return; hinted = true; e.target.disabled = true; sfx('tap');
        const wrong = btns.filter((b, k) => opts[k] !== w);
        pick(wrong).style.visibility = 'hidden';
      };
      btns.forEach((b, k) => b.onclick = () => {
        btns.forEach(x => x.disabled = true);
        document.getElementById('hint').disabled = true;
        const ok = opts[k] === w;
        record(w.id, ok); results.push(ok);
        const fb = document.getElementById('fb');
        if (ok) {
          streak++; S.stats.bestStreak = Math.max(S.stats.bestStreak, streak);
          const pts = hinted ? 1 : 2; starsGot += pts;
          b.classList.add('right'); sfx('good');
          fb.textContent = pick(['מעולה! 🎉', 'נכון! 👏', 'יפה מאוד! 🌟', 'אלוף! 🏆', 'בדיוק! ✨']) + (streak >= 3 ? ` (${streak} ברצף 🔥)` : '');
          if (streak > 0 && streak % 5 === 0) confetti(70);
        } else {
          streak = 0;
          b.classList.add('wrong'); btns[opts.indexOf(w)].classList.add('right'); sfx('bad');
          fb.textContent = 'לא נורא, עכשיו כבר יודעים! 💪';
        }
        save();
        later(() => { qi++; qi < qs.length ? show() : finish(); }, ok ? 1100 : 2300);
      });
    }
    function finish() {
      const right = results.filter(Boolean).length;
      const stars = right >= 9 ? 3 : right >= 6 ? 2 : right >= 3 ? 1 : 0;
      const bonus = right === qs.length ? 5 : 0;
      addStars(starsGot + bonus);
      S.stats.triviaGames++; if (right === qs.length && qs.length >= TR_LEN) S.stats.perfectTrivia++;
      if (trMode === 'def') S.stats.reverseGames++;
      markPlayed(); save();
      sfx(stars >= 2 ? 'win' : 'good'); if (stars >= 2) confetti();
      const wrong = qs.filter((_, k) => !results[k]);
      const msg = stars === 3 ? 'מדהים! 🤩' : stars === 2 ? 'כל הכבוד! 🎉' : stars === 1 ? 'יפה! ממשיכים להתאמן 💪' : 'כל התחלה קשה – נסו שוב! 🌱';
      h(`<section class="panel center">
        <h1>${msg}</h1>
        <div class="result-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
        <p>ענית נכון על <b>${right}</b> מתוך ${qs.length} שאלות · הרווחת <b>${starsGot + bonus}</b> כוכבים${bonus ? ' (כולל בונוס 💯)' : ''}</p>
        ${wrong.length ? `<div class="label" style="text-align:right">מילים לחזור עליהן:</div><ul class="mistakes">${wrong.map(w => `<li><b>${esc(w.term)}</b> – ${esc(w.def)}</li>`).join('')}</ul>` : ''}
        <div class="row center" style="margin-top:14px">
          <button class="btn pink" id="again">🔁 עוד סבב</button>
          <button class="btn ghost" data-go="hebrew">${LULI_ICON} לאיזור של לולי</button>
        </div>
      </section>`);
      document.getElementById('again').onclick = triviaPlay; bindGo();
      checkBadges();
    }
    show();
  }

  // ===== Word search (תפזורת) =====
  // dirs are [row step, column step]; column 0 is on the right (RTL), so [0,1] reads like normal Hebrew
  // every level hides words across, down, diagonally and backwards; the levels differ in size and word count
  const WS_DIRS = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [1, -1], [-1, -1], [-1, 1]];
  const WS_LEVELS = {
    easy:   { label: '😊 קל',    size: 8,  n: 5 },
    medium: { label: '😎 בינוני', size: 10, n: 7 },
    hard:   { label: '🤯 קשה',   size: 12, n: 10 },
  };
  let wsLevel = 'easy';
  const FILL = 'אבגדהוזחטיכלמנסעפצקרשתאויהלמר'; // common letters appear more often
  const wsNorm = t => strip(t).replace(/\(.*?\)/g, '').replace(/[^א-ת]/g, '');

  function wordsearch() {
    const L = WS_LEVELS[wsLevel];
    h(`<section class="panel">
      <h2>🔎 תפזורת</h2>
      <p>המילים מתחבאות בלוח – לאורך, לרוחב, באלכסון וגם הפוך! הפירושים שלהן כתובים מתחת ללוח. מצאו כל מילה וסמנו אותה: גוררים את האצבע מהאות הראשונה עד האחרונה, או לוחצים על האות הראשונה ואז על האחרונה.</p>
      <div class="label">רמת קושי</div>
      <div class="chips">
        ${Object.entries(WS_LEVELS).map(([k, l]) => `<button class="chip ${wsLevel === k ? 'on' : ''}" data-l="${k}">${l.label} – ${l.size}×${l.size}, ${l.n} מילים</button>`).join('')}
      </div>
      ${poolPicker(L.n)}
      <button class="btn teal" id="go">יאללה, מחפשים! 🔍</button>
    </section>`);
    $app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { wsLevel = b.dataset.l; sfx('tap'); wordsearch(); });
    bindPoolPicker(wordsearch);
    document.getElementById('go').onclick = () => { if (ensurePool(L.n)) wordsearchPlay(); };
  }

  // kind of a direction: across / down / diagonal, and whether it reads backwards (column 0 is on the right)
  const wsKinds = ([dr, dc]) => [dr === 0 ? 'across' : dc === 0 ? 'down' : 'diag', ...(dc === -1 || (dc === 0 && dr === -1) ? ['reverse'] : [])];

  // places s in the first direction of `dirs` that has room, at a random free spot
  function wsPlace(g, s, dirs) {
    const N = g.length;
    for (const [dr, dc] of dirs) {
      const spots = [];
      for (let r0 = 0; r0 < N; r0++) for (let c0 = 0; c0 < N; c0++) {
        const r1 = r0 + dr * (s.length - 1), c1 = c0 + dc * (s.length - 1);
        if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
        let fit = true;
        for (let i = 0; i < s.length && fit; i++) { const v = g[r0 + dr * i][c0 + dc * i]; if (v && v !== s[i]) fit = false; }
        if (fit) spots.push([r0, c0]);
      }
      if (!spots.length) continue;
      const [r0, c0] = pick(spots);
      const cells = [];
      for (let i = 0; i < s.length; i++) { const r = r0 + dr * i, c = c0 + dc * i; g[r][c] = s[i]; cells.push([r, c]); }
      return { cells, dir: [dr, dc] };
    }
    return null;
  }

  function wsBuild(L, src) {
    const ok = src.filter(w => { const s = wsNorm(w.term); return s.length >= 2 && s.length <= L.size; });
    const cands = choose(ok, Math.min(ok.length, L.n * 3));
    let best = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const g = Array.from({ length: L.size }, () => Array(L.size).fill(''));
      const placed = [];
      const kinds = new Set();
      // the first four words go across, down, diagonal and backwards, so every board has all four; the rest go any way
      const must = shuffle([[[0, 1]], [[1, 0]], shuffle([[1, 1], [1, -1], [-1, 1], [-1, -1]]), shuffle([[0, -1], [-1, 0]])]);
      // longest words first – they are the hardest to fit
      for (const w of cands.slice().sort((a, b) => wsNorm(b.term).length - wsNorm(a.term).length)) {
        if (placed.length >= L.n) break;
        const s = wsNorm(w.term);
        if (placed.some(p => p.s.includes(s) || s.includes(p.s))) continue; // no word hidden inside another
        const dirs = placed.length < must.length ? must[placed.length] : shuffle(WS_DIRS);
        const res = wsPlace(g, s, dirs);
        if (!res) continue; // try the next word for this direction
        placed.push({ w, s, cells: res.cells, found: false });
        wsKinds(res.dir).forEach(k => kinds.add(k));
      }
      const score = placed.length * 10 + kinds.size;
      if (!best || score > best.score) best = { g, placed, score };
      if (placed.length >= L.n && kinds.size === 4) break;
    }
    best.g.forEach(row => row.forEach((v, c) => { if (!v) row[c] = pick(FILL); }));
    return best;
  }

  function wordsearchPlay() {
    const L = WS_LEVELS[wsLevel];
    const { g, placed } = wsBuild(L, poolWords());
    const N = L.size, n = placed.length;
    const bank = shuffle(placed);
    let found = 0, secs = 0, hints = 0, color = 0;
    h(`<section>
      <div class="hud"><span>✅ נמצאו: <b id="fd">0</b>/${n}</span><span>💡 רמזים: <b id="hn">0</b></span><span>⏱️ <b id="tm">0:00</b></span></div>
      <div class="ws-layout">
        <div class="ws-board">
          <div class="ws-grid" id="wsg" style="--n:${N}">
            ${g.map((row, r) => row.map((ch, c) => `<div class="ws-cell" data-r="${r}" data-c="${c}">${ch}</div>`).join('')).join('')}
          </div>
          <div class="row center" style="margin:14px 0">
            <button class="btn ghost small" id="hint">💡 רמז</button>
            <button class="btn ghost small" id="again">🔁 לוח חדש</button>
          </div>
        </div>
        <div class="panel ws-clues">
          <div class="label">בנק הפירושים – לכל פירוש מסתתרת מילה בלוח:</div>
          <ol class="ws-bank">${bank.map(p => `<li data-s="${p.s}"><span class="def">${esc(p.w.def)}</span><span class="ans"></span></li>`).join('')}</ol>
        </div>
      </div>
    </section>`);
    const gridEl = document.getElementById('wsg');
    const cellEls = [...gridEl.querySelectorAll('.ws-cell')];
    const cellOf = (r, c) => cellEls[r * N + c];
    const fmt = s => Math.floor(s / 60) + ':' + pad(s % 60);
    every(() => { secs++; document.getElementById('tm').textContent = fmt(secs); }, 1000);
    document.getElementById('again').onclick = wordsearchPlay;

    function lineCells(a, b) {
      const r0 = +a.dataset.r, c0 = +a.dataset.c, r1 = +b.dataset.r, c1 = +b.dataset.c;
      if (!(r0 === r1 || c0 === c1 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return null;
      const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0), len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
      const out = [];
      for (let i = 0; i <= len; i++) out.push(cellOf(r0 + dr * i, c0 + dc * i));
      return out;
    }
    function paint(cells) {
      cellEls.forEach(e => e.classList.remove('sel'));
      (cells || []).forEach(e => e.classList.add('sel'));
    }
    function check(cells) {
      if (cells.length < 2) return;
      const s = cells.map(e => e.textContent).join('');
      const rev = [...s].reverse().join('');
      const p = placed.find(x => !x.found && (x.s === s || x.s === rev));
      if (!p) { sfx('bad'); gridEl.classList.add('nope'); later(() => gridEl.classList.remove('nope'), 400); return; }
      p.found = true; found++;
      const k = color++ % 8;
      cells.forEach(e => { e.className = e.className.replace(/\bf\d\b/g, '').trim() + ' found f' + k; });
      const li = $app.querySelector(`.ws-bank li[data-s="${p.s}"]`);
      li.classList.add('done', 'f' + k);
      li.querySelector('.ans').textContent = p.w.term;
      record(p.w.id, true); save();
      document.getElementById('fd').textContent = found;
      sfx('good'); confetti(30);
      if (found === n) later(win, 900);
    }

    // drag from first to last letter, or tap first then last
    let start = null, cur = null, pending = null, dragging = false;
    const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.classList.contains('ws-cell') ? el : null; };
    gridEl.addEventListener('pointerdown', e => {
      const c = cellAt(e.clientX, e.clientY); if (!c) return;
      e.preventDefault();
      try { gridEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      dragging = true; start = pending || c; cur = c;
      paint(lineCells(start, cur) || [start]);
    });
    gridEl.addEventListener('pointermove', e => {
      if (!dragging) return;
      const c = cellAt(e.clientX, e.clientY);
      if (!c || c === cur) return;
      cur = c;
      const l = lineCells(start, cur); if (l) paint(l);
    });
    gridEl.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      if (cur === start && !pending) { pending = start; paint([start]); sfx('tap'); return; }
      const l = lineCells(start, cur);
      pending = null; paint(null);
      if (l) check(l);
    });
    gridEl.addEventListener('pointercancel', () => { dragging = false; pending = null; paint(null); });

    document.getElementById('hint').onclick = () => {
      const left = placed.filter(p => !p.found);
      if (!left.length) return;
      hints++; document.getElementById('hn').textContent = hints; sfx('tap');
      const p = pick(left);
      const [r, c] = p.cells[0];
      const el = cellOf(r, c);
      el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint');
      const li = $app.querySelector(`.ws-bank li[data-s="${p.s}"]`);
      li.classList.remove('hint'); void li.offsetWidth; li.classList.add('hint');
    };

    function win() {
      stopTimers();
      const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;
      const earned = n + stars * 2;
      addStars(earned);
      S.stats.wordsearchGames++; S.stats.wordsFound += n;
      if (wsLevel === 'hard') S.stats.searchHard++;
      if (hints === 0) S.stats.searchNoHint++;
      markPlayed(); save();
      sfx('win'); confetti();
      h(`<section class="panel center">
        <h1>מצאת את כל המילים! 🎉</h1>
        <div class="result-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
        <p>${n} מילים בזמן ${fmt(secs)}${hints ? `, עם ${hints} רמזים` : ', בלי אף רמז! 🦅'} · הרווחת <b>${earned}</b> כוכבים</p>
        <ul class="mistakes">${placed.map(p => `<li style="background:#f0fdf4"><b>${esc(p.w.term)}</b> – ${esc(p.w.def)}</li>`).join('')}</ul>
        <div class="row center" style="margin-top:14px">
          <button class="btn teal" id="again">🔁 עוד תפזורת</button>
          <button class="btn ghost" data-go="hebrew">${LULI_ICON} לאיזור של לולי</button>
        </div>
      </section>`);
      document.getElementById('again').onclick = wordsearchPlay; bindGo();
      checkBadges();
    }
  }

  // ===== Flash cards =====
  function flash() {
    h(`<section class="panel">
      <h2>🃏 כרטיסיות</h2>
      <p>לוחצים על הכרטיס כדי לראות את הפירוש, ואז מסמנים אם ידעתם.</p>
      ${poolPicker(1)}
      <button class="btn orange" id="go">מתחילים ללמוד 📚</button>
    </section>`);
    bindPoolPicker(flash);
    document.getElementById('go').onclick = () => { if (ensurePool(1)) flashPlay(); };
  }
  function flashPlay() {
    const deck = choose(poolWords(), 10);
    let i = 0, knew = 0;
    function show() {
      const w = deck[i];
      h(`<section>
        <div class="hud"><span>כרטיס ${i + 1}/${deck.length}</span><span>✅ ידעתי: ${knew}</span></div>
        <button class="flash" id="card"><div class="inner">
          <div class="face f1">${esc(w.term)}<small>לחצו כדי להפוך</small></div>
          <div class="face f2">${esc(w.def)}</div></div></button>
        <div class="row center" style="margin-top:20px" id="actions" hidden>
          <button class="btn green" id="yes">😀 ידעתי!</button>
          <button class="btn orange" id="no">🤔 עוד לא</button>
        </div>
        <div class="row center" style="margin-top:12px">
          ${heVoice() ? '<button class="btn ghost small" id="say">🔊 השמעה</button>' : ''}
          <button class="btn ghost small" id="favB">${S.fav.includes(w.id) ? '⭐ במועדפים' : '☆ למועדפים'}</button>
        </div>
      </section>`);
      const card = document.getElementById('card');
      card.onclick = () => { sfx('flip'); card.classList.toggle('open'); document.getElementById('actions').hidden = false; };
      const sb = document.getElementById('say'); if (sb) sb.onclick = () => say(w.term);
      document.getElementById('favB').onclick = (e) => { toggleFav(w.id); e.target.textContent = S.fav.includes(w.id) ? '⭐ במועדפים' : '☆ למועדפים'; };
      const next = (ok) => {
        record(w.id, ok); if (ok) knew++; S.stats.flashSeen++; save();
        sfx(ok ? 'good' : 'tap');
        i++; i < deck.length ? show() : done();
      };
      document.getElementById('yes').onclick = () => next(true);
      document.getElementById('no').onclick = () => next(false);
    }
    function done() {
      addStars(knew); markPlayed(); save(); sfx('win'); confetti(80);
      h(`<section class="panel center">
        <h1>סיימת את החבילה! 🎉</h1>
        <p>ידעת <b>${knew}</b> מתוך ${deck.length} מילים והרווחת <b>${knew}</b> כוכבים.</p>
        <div class="row center"><button class="btn orange" id="again">🔁 חבילה נוספת</button>
        <button class="btn pink" data-go="trivia">❓ לטריוויה</button></div>
      </section>`);
      document.getElementById('again').onclick = flashPlay; bindGo();
      checkBadges();
    }
    show();
  }

  // ===== Dictionary =====
  let wFilter = 'all', wQuery = '';
  function toggleFav(id) {
    const k = S.fav.indexOf(id);
    if (k >= 0) S.fav.splice(k, 1); else S.fav.push(id);
    save(); sfx('tap');
  }
  function words() {
    h(`<section>
      <div class="panel">
        <h2>📖 המילון שלי</h2>
        <input class="search" id="q" type="search" placeholder="🔎 חפשו מילה או פירוש..." value="${esc(wQuery)}">
        <div class="chips" style="margin-top:12px">
          ${[['all', 'הכול'], ['fav', '⭐ מועדפים'], ['hard', '💪 קשות'], ['mastered', '✅ שלטתי']].map(([k, l]) =>
            `<button class="chip ${wFilter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}
        </div>
        <div class="muted" id="count"></div>
      </div>
      <ul class="word-list" id="list"></ul>
    </section>`);
    const q = document.getElementById('q');
    q.oninput = () => { wQuery = q.value; renderList(); };
    $app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { wFilter = b.dataset.f; sfx('tap'); words(); });
    renderList();
  }
  function renderList() {
    const qq = strip(wQuery.trim());
    const voice = !!heVoice();
    const list = WORDS.filter(w =>
      (wFilter === 'all' || (wFilter === 'fav' && S.fav.includes(w.id)) || (wFilter === 'hard' && isHard(w.id)) || (wFilter === 'mastered' && isMastered(w.id))) &&
      (!qq || strip(w.term).includes(qq) || strip(w.def).includes(qq)));
    document.getElementById('count').textContent = `${list.length} מילים`;
    const ul = document.getElementById('list');
    ul.innerHTML = list.map(w => `<li class="word-item">
      <div class="grow"><div class="t">${esc(w.term)}${isMastered(w.id) ? '<span class="badge-m">שלטתי ✓</span>' : isHard(w.id) ? '<span class="badge-h">לתרגל</span>' : ''}</div>
      <div class="d">${esc(w.def)}</div></div>
      ${voice ? `<button data-say="${esc(w.id)}" aria-label="השמעה">🔊</button>` : ''}
      <button data-fav="${esc(w.id)}" aria-label="מועדפים">${S.fav.includes(w.id) ? '⭐' : '☆'}</button></li>`).join('') ||
      '<li class="panel center">לא נמצאו מילים 🙈</li>';
    ul.querySelectorAll('[data-fav]').forEach(b => b.onclick = () => { toggleFav(b.dataset.fav); b.textContent = S.fav.includes(b.dataset.fav) ? '⭐' : '☆'; });
    ul.querySelectorAll('[data-say]').forEach(b => b.onclick = () => say(WORDS.find(w => w.id === b.dataset.say).term));
  }

  // ===== Duvduv's area (האיזור של דובדוב): Hebrew games for 1st graders =====
  const KIDS = [];
  (window.KIDS_RAW || '').split('\n').forEach(line => {
    const i = line.indexOf('|'); if (i < 0) return;
    const e = line.slice(0, i).trim(), w = line.slice(i + 1).trim();
    if (e && w) KIDS.push({ e, w, letter: firstLetter(w), parts: w.match(/[א-ת][֑-ׇ]*/g) || [] });
  });
  const KID_LETTERS = [...new Set(KIDS.map(k => k.letter))];
  const LETTER_NAMES = window.LETTER_NAMES || {};
  const DUV_GAMES = [
    { id: 'duvFirst',    emoji: '<b class="emoji-letter">א</b>', title: 'באיזו אות מתחילה?', sub: 'מסתכלים על התמונה ובוחרים אות', tile: 'tile-cherry' },
    { id: 'duvRead',     emoji: '📖', title: 'קוראים ובוחרים',    sub: 'קוראים מילה ומוצאים תמונה',    tile: 'tile-pink' },
    { id: 'duvBuild',    emoji: '🧩', title: 'בונים מילה',        sub: 'מסדרים אותיות לפי הסדר',       tile: 'tile-orange' },
    { id: 'duvBalloons', emoji: '🎈', title: 'בלונים של אותיות',  sub: 'מפוצצים בלונים עם האות',       tile: 'tile-blue' },
  ];
  const DUV_PRAISE = ['כל הכבוד! 🍒', 'נכון! 👏', 'יופי! 🌟', 'מעולה! 🎉', 'אלוף! 🏆'];
  const voiceOn = () => !!heVoice();

  function duvduv() {
    const kidName = S.name ? ` ${esc(S.name)}` : '';
    h(`<section>
      <div class="panel duv-hero">
        <div class="duv-mascot">🍒</div>
        <div>
          <h1>היי${kidName}! אני דובדוב</h1>
          <div>בואו נשחק ונלמד עברית ביחד!</div>
        </div>
      </div>
      <div class="game-grid">
        ${DUV_GAMES.map(g => `<button class="game-tile ${g.tile}" data-go="${g.id}"><span class="emoji">${g.emoji}</span><span class="title">${g.title}</span><span class="sub">${g.sub}</span></button>`).join('')}
      </div>
    </section>`);
    bindGo();
  }

  function duvDots(results, i, total) {
    return `<div class="q-progress">${Array.from({ length: total }, (_, k) => `<i class="${k < i ? (results[k] ? 'ok' : 'bad') : k === i ? 'now' : ''}"></i>`).join('')}</div>`;
  }

  function duvResult(right, total, again) {
    const stars = right >= total * 0.9 ? 3 : right >= total * 0.6 ? 2 : right > 0 ? 1 : 0;
    addStars(right);
    S.stats.duvGames++;
    if (right === total && total >= 8) S.stats.duvPerfect++;
    markPlayed(); save();
    sfx(stars >= 2 ? 'win' : 'good'); if (stars >= 2) confetti();
    const msg = right === total ? 'וואו, מושלם! 🤩' : stars === 3 ? 'מדהים! 🤩' : stars === 2 ? 'כל הכבוד! 🎉' : 'יופי של התחלה! 🌱';
    h(`<section class="panel center">
      <div class="duv-mascot">🍒</div>
      <h1>${msg}</h1>
      <div class="result-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
      <p style="font-size:22px">הצלחת <b>${right}</b> מתוך ${total} · קיבלת <b>${right}</b> כוכבים</p>
      <div class="row center">
        <button class="btn cherry" id="again">🔁 עוד פעם</button>
        <button class="btn ghost" data-go="duvduv">🍒 לאיזור של דובדוב</button>
      </div>
    </section>`);
    say(msg.replace(/[^א-ת ,!]/g, ''));
    document.getElementById('again').onclick = again; bindGo();
    checkBadges();
  }

  // 1. which letter does the picture start with?
  function duvFirst() {
    const qs = shuffle(KIDS).slice(0, 10), results = [];
    let i = 0;
    function show() {
      const w = qs[i];
      const opts = shuffle([w.letter, ...shuffle(KID_LETTERS.filter(x => x !== w.letter)).slice(0, 2)]);
      const v = voiceOn();
      h(`<section><div class="panel center duv-card">
        ${duvDots(results, i, qs.length)}
        <div class="duv-ask">באיזו אות מתחילה המילה?</div>
        <div class="duv-pic">${w.e}</div>
        <div class="duv-word ${v ? 'hide' : ''}" id="dw">${w.w}</div>
        ${v ? `<div class="row center"><button class="btn ghost small" id="sayB">🔊 שמעו</button><button class="btn ghost small" id="showW">👀 הראו את המילה</button></div>` : ''}
        <div class="duv-opts">${opts.map(o => `<button class="duv-letter" data-o="${o}">${o}</button>`).join('')}</div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      if (v) {
        later(() => say(w.w, true), 250);
        document.getElementById('sayB').onclick = () => say(w.w, true);
        document.getElementById('showW').onclick = () => document.getElementById('dw').classList.remove('hide');
      }
      const btns = [...$app.querySelectorAll('.duv-letter')];
      btns.forEach(b => b.onclick = () => {
        btns.forEach(x => x.disabled = true);
        const ok = b.dataset.o === w.letter;
        results.push(ok);
        document.getElementById('dw').classList.remove('hide');
        if (ok) { b.classList.add('right'); sfx('good'); document.getElementById('fb').textContent = pick(DUV_PRAISE); }
        else {
          b.classList.add('wrong'); sfx('bad');
          btns.find(x => x.dataset.o === w.letter).classList.add('right');
          document.getElementById('fb').textContent = `המילה ${strip(w.w)} מתחילה באות ${w.letter}`;
        }
        say(`${w.w}, ${LETTER_NAMES[w.letter] || w.letter}`, true);
        later(() => { i++; i < qs.length ? show() : duvResult(results.filter(Boolean).length, qs.length, duvFirst); }, ok ? 1500 : 2800);
      });
    }
    show();
  }

  // 2. read the word and choose its picture
  function duvRead() {
    const qs = shuffle(KIDS).slice(0, 10), results = [];
    let i = 0;
    function show() {
      const w = qs[i];
      const opts = shuffle([w, ...shuffle(KIDS.filter(x => x !== w && x.letter !== w.letter)).slice(0, 2)]);
      h(`<section><div class="panel center duv-card">
        ${duvDots(results, i, qs.length)}
        <div class="duv-ask">קראו את המילה ובחרו את התמונה המתאימה</div>
        <div class="duv-word big">${w.w}</div>
        ${voiceOn() ? '<button class="btn ghost small" id="sayB">🔊 עזרה: שמעו את המילה</button>' : ''}
        <div class="duv-opts">${opts.map((o, k) => `<button class="duv-pic-btn" data-k="${k}" aria-label="תמונה ${k + 1}">${o.e}</button>`).join('')}</div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      const sb = document.getElementById('sayB'); if (sb) sb.onclick = () => say(w.w, true);
      const btns = [...$app.querySelectorAll('.duv-pic-btn')];
      btns.forEach(b => b.onclick = () => {
        btns.forEach(x => x.disabled = true);
        const ok = opts[+b.dataset.k] === w;
        results.push(ok);
        if (ok) { b.classList.add('right'); sfx('good'); document.getElementById('fb').textContent = pick(DUV_PRAISE); }
        else { b.classList.add('wrong'); sfx('bad'); btns[opts.indexOf(w)].classList.add('right'); document.getElementById('fb').textContent = 'כמעט! זאת התמונה הנכונה 👆'; }
        say(w.w, true);
        later(() => { i++; i < qs.length ? show() : duvResult(results.filter(Boolean).length, qs.length, duvRead); }, ok ? 1400 : 2600);
      });
    }
    show();
  }

  // 3. build the word from its letters (each letter keeps its niqqud)
  function duvBuild() {
    const qs = shuffle(KIDS.filter(k => k.parts.length >= 2 && k.parts.length <= 5)).slice(0, 8), results = [];
    let i = 0;
    function show() {
      const w = qs[i], parts = w.parts;
      let tiles = shuffle(parts.map((p, k) => ({ p, k })));
      if (tiles.every((t, k) => t.k === k)) tiles = tiles.reverse(); // never already in order
      let pos = 0, mistakes = 0;
      h(`<section><div class="panel center duv-card">
        ${duvDots(results, i, qs.length)}
        <div class="duv-ask">סדרו את האותיות ובנו את המילה</div>
        <div class="duv-pic">${w.e}</div>
        <div class="duv-slots">${parts.map((_, k) => `<div class="duv-slot" data-s="${k}"></div>`).join('')}</div>
        <div class="duv-opts">${tiles.map((t, k) => `<button class="duv-letter tile" data-t="${k}">${t.p}</button>`).join('')}</div>
        <div class="row center">${voiceOn() ? '<button class="btn ghost small" id="sayB">🔊 שמעו את המילה</button>' : ''}<button class="btn ghost small" id="hintB">💡 רמז</button></div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      const sb = document.getElementById('sayB'); if (sb) sb.onclick = () => say(w.w, true);
      const slots = [...$app.querySelectorAll('.duv-slot')];
      const btns = [...$app.querySelectorAll('.duv-letter.tile')];
      document.getElementById('hintB').onclick = () => {
        const b = btns.find(x => !x.disabled && tiles[+x.dataset.t].p === parts[pos]);
        if (b) { mistakes++; b.classList.remove('hint'); void b.offsetWidth; b.classList.add('hint'); sfx('tap'); }
      };
      btns.forEach(b => b.onclick = () => {
        const t = tiles[+b.dataset.t];
        if (t.p !== parts[pos]) { // same letter with the same niqqud counts too
          mistakes++; sfx('bad'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return;
        }
        sfx('tap'); b.disabled = true; b.classList.add('used');
        slots[pos].textContent = t.p; slots[pos].classList.add('filled'); pos++;
        if (pos === parts.length) {
          const ok = mistakes === 0; results.push(ok);
          S.stats.duvBuilt++; save();
          sfx('good'); confetti(40); say(w.w, true);
          document.getElementById('fb').textContent = pick(DUV_PRAISE);
          btns.forEach(x => x.disabled = true);
          later(() => { i++; i < qs.length ? show() : duvResult(results.filter(Boolean).length, qs.length, duvBuild); }, 1800);
        }
      });
    }
    show();
  }

  // 4. pop the balloons that carry the target letter
  function duvBalloons() {
    const target = pick(KID_LETTERS);
    const COUNT = 16, GAP = 1000, RISE = 7000;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];
    let spawned = 0, targets = 0, popped = 0, misses = 0;
    h(`<section>
      <div class="panel center duv-card" style="padding:14px">
        <div class="duv-ask">פוצצו את כל הבלונים עם האות</div>
        <div class="row center"><span class="duv-target">${target}</span>${voiceOn() ? '<button class="icon-btn" id="sayB" aria-label="השמעה">🔊</button>' : ''}</div>
        <div class="hud" style="margin:8px 0 0"><span>🎈 פוצצת: <b id="pp">0</b></span></div>
      </div>
      <div class="balloon-area" id="area"></div>
    </section>`);
    const area = document.getElementById('area');
    const sb = document.getElementById('sayB');
    if (sb) sb.onclick = () => say(LETTER_NAMES[target] || target, true);
    later(() => say(`פוצצו את הבלונים עם האות ${LETTER_NAMES[target] || target}`, true), 300);
    function spawn() {
      const isT = Math.random() < 0.45 || COUNT - spawned <= 6 - targets; // at least 6 targets per round
      const letter = isT ? target : pick(KID_LETTERS.filter(x => x !== target));
      if (isT) targets++;
      const b = document.createElement('button');
      b.className = 'balloon'; b.textContent = letter;
      b.style.left = (4 + Math.random() * 76) + '%';
      b.style.background = pick(colors);
      b.style.animationDuration = (RISE + Math.random() * 1500) + 'ms';
      b.onclick = () => {
        if (b.dataset.done) return;
        if (letter === target) {
          b.dataset.done = '1'; popped++; document.getElementById('pp').textContent = popped; sfx('good');
          b.style.transform = getComputedStyle(b).transform; b.style.animation = 'none';
          b.classList.add('popped');
          setTimeout(() => b.remove(), 300);
        } else { misses++; sfx('bad'); b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 350); }
      };
      b.addEventListener('animationend', e => { if (e.animationName === 'rise') b.remove(); });
      area.appendChild(b);
      spawned++;
      if (spawned < COUNT) later(spawn, GAP);
      else later(() => { S.stats.duvPopped += popped; duvResult(popped, targets, duvBalloons); }, RISE + 1800);
    }
    later(spawn, 900);
  }

  // ===== Noshnosh's area (האיזור של נושנוש): English for 8th grade =====
  const EN_WORDS = [];
  (window.EN_WORDS_RAW || '').split('\n').forEach(line => {
    const i = line.indexOf('|'); if (i < 0) return;
    const en = line.slice(0, i).trim(), he = line.slice(i + 1).trim();
    if (en && he) EN_WORDS.push({ en, he, base: en.replace(/^to\s+/i, '').toLowerCase() });
  });
  const EN_TENSE = [];
  (window.EN_TENSE_RAW || '').split('\n').forEach(line => {
    const f = line.split('|').map(x => x.trim());
    if (f.length < 5) return;
    EN_TENSE.push({ s: f[0], answers: f[1].split('/').map(x => x.trim()), wrong: f[2].split(';').map(x => x.trim()), t: f[3], why: f[4] });
  });
  const EN_SIGNALS = window.EN_SIGNALS || { S: [], P: [] };
  const ENG_ICON = '🌍';
  const TENSE_NAME = { S: 'Present Simple', P: 'Present Progressive' };
  const TENSE_HE = { S: 'הווה פשוט', P: 'הווה מתמשך' };
  const EN_GAMES = [
    { id: 'engVocab',  emoji: '📝', title: 'אוצר מילים',        sub: 'מה פירוש המילה באנגלית?',          tile: 'tile-blue' },
    { id: 'engSpell',  emoji: '⌨️', title: 'איות',              sub: 'מקלידים את המילה באנגלית',        tile: 'tile-teal' },
    { id: 'engTense',  emoji: '⏱️', title: 'הווה פשוט או מתמשך?', sub: 'Present Simple / Progressive', tile: 'tile-purple' },
    { id: 'engSignal', emoji: '🚦', title: 'מילות זמן',          sub: 'לאיזה זמן שייכת המילה?',          tile: 'tile-orange' },
    { id: 'engRules',  emoji: '📘', title: 'תזכורת כללים',       sub: 'כל מה שצריך לדעת על שני הזמנים',  tile: 'tile-green' },
  ];
  const EN_PRAISE = ['Great job! 🎉', 'Correct! 👏', 'Excellent! 🌟', 'Well done! 🏆', 'Perfect! ✨'];
  const normEn = s => s.toLowerCase().replace(/[’`]/g, "'").replace(/[?.!,]/g, '').replace(/\s+/g, ' ').trim();
  function enVoice() { return (window.speechSynthesis && (speechSynthesis.getVoices().find(v => /^en[-_]US/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/i.test(v.lang)))) || null; }
  function sayEn(text) {
    const v = enVoice(); if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = v.lang; u.rate = 0.9;
    speechSynthesis.speak(u);
  }
  const enSpeakBtn = (id, label) => enVoice() ? `<button class="btn ghost small" id="${id}">🔊 ${label || 'שמעו'}</button>` : '';

  function english() {
    h(`<section>
      <div class="panel eng-hero">
        <div class="eng-mascot">${ENG_ICON}</div>
        <div>
          <h1>האיזור של נושנוש</h1>
          <div>אנגלית לכיתה ח': אוצר מילים, ו-Present Simple מול Present Progressive</div>
        </div>
      </div>
      <div class="game-grid">
        ${EN_GAMES.map(g => `<button class="game-tile ${g.tile}" data-go="${g.id}"><span class="emoji">${g.emoji}</span><span class="title">${g.title}</span><span class="sub">${g.sub}</span></button>`).join('')}
      </div>
    </section>`);
    bindGo();
  }

  function engResult(right, total, again) {
    const stars = right >= total * 0.9 ? 3 : right >= total * 0.6 ? 2 : right > 0 ? 1 : 0;
    addStars(right);
    S.stats.engGames++;
    if (right === total && total >= 10) S.stats.engPerfect++;
    markPlayed(); save();
    sfx(stars >= 2 ? 'win' : 'good'); if (stars >= 2) confetti();
    const msg = right === total ? 'Perfect! מושלם 🤩' : stars === 3 ? 'Excellent! מצוין 🎉' : stars === 2 ? 'Well done! כל הכבוד 👏' : 'Keep practicing! ממשיכים להתאמן 💪';
    h(`<section class="panel center">
      <div class="eng-mascot">${ENG_ICON}</div>
      <h1>${msg}</h1>
      <div class="result-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
      <p style="font-size:20px">הצלחת <b>${right}</b> מתוך ${total} · קיבלת <b>${right}</b> כוכבים</p>
      <div id="review"></div>
      <div class="row center" style="margin-top:12px">
        <button class="btn blue" id="again">🔁 עוד סבב</button>
        <button class="btn ghost" data-go="english">${ENG_ICON} לאיזור של נושנוש</button>
      </div>
    </section>`);
    document.getElementById('again').onclick = again; bindGo();
    checkBadges();
  }
  function engReview(items) { // items: [{en, he}] shown under the result
    const el = document.getElementById('review');
    if (el && items.length) el.innerHTML = `<div class="label" style="text-align:right">לחזור על:</div><ul class="mistakes">${items.map(x => `<li><b class="en">${esc(x.en)}</b> – ${esc(x.he)}</li>`).join('')}</ul>`;
  }

  // 1. vocabulary quiz (both directions)
  let enVocabMode = 'en';
  function engVocab() {
    h(`<section class="panel">
      <h2>📝 אוצר מילים</h2>
      <p>10 שאלות, 3 תשובות לכל שאלה.</p>
      <div class="chips">
        <button class="chip ${enVocabMode === 'en' ? 'on' : ''}" data-m="en"><span class="en">English</span> ← עברית</button>
        <button class="chip ${enVocabMode === 'he' ? 'on' : ''}" data-m="he">עברית ← <span class="en">English</span></button>
      </div>
      <button class="btn blue" id="go">Let's go! 🚀</button>
    </section>`);
    $app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { enVocabMode = b.dataset.m; sfx('tap'); engVocab(); });
    document.getElementById('go').onclick = engVocabPlay;
  }
  function engVocabPlay() {
    const qs = shuffle(EN_WORDS).slice(0, 10), results = [], wrong = [];
    const fromEn = enVocabMode === 'en';
    let i = 0;
    function show() {
      const w = qs[i];
      const opts = shuffle([w, ...shuffle(EN_WORDS.filter(x => x !== w)).slice(0, 2)]);
      h(`<section><div class="panel q-card">
        ${duvDots(results, i, qs.length)}
        <div class="q-ask">${fromEn ? 'מה פירוש המילה?' : 'איך אומרים באנגלית?'}</div>
        <div class="q-word ${fromEn ? 'en' : ''}">${esc(fromEn ? w.en : w.he)}</div>
        ${fromEn ? enSpeakBtn('sayB') : ''}
        <div class="answers">${opts.map((o, k) => `<button class="answer ${fromEn ? '' : 'en'}" data-k="${k}">${esc(fromEn ? o.he : o.en)}</button>`).join('')}</div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      const sb = document.getElementById('sayB'); if (sb) sb.onclick = () => sayEn(w.en);
      if (fromEn) later(() => sayEn(w.en), 250);
      const btns = [...$app.querySelectorAll('.answer')];
      btns.forEach(b => b.onclick = () => {
        btns.forEach(x => x.disabled = true);
        const ok = opts[+b.dataset.k] === w;
        results.push(ok);
        if (ok) { b.classList.add('right'); sfx('good'); document.getElementById('fb').textContent = pick(EN_PRAISE); }
        else { wrong.push(w); b.classList.add('wrong'); btns[opts.indexOf(w)].classList.add('right'); sfx('bad'); document.getElementById('fb').innerHTML = `<span class="en">${esc(w.en)}</span> = ${esc(w.he)}`; }
        if (!fromEn) sayEn(w.en);
        later(() => { i++; i < qs.length ? show() : (engResult(results.filter(Boolean).length, qs.length, engVocabPlay), engReview(wrong)); }, ok ? 1200 : 2400);
      });
    }
    show();
  }

  // 2. spelling: see the Hebrew meaning (and hear the word), type it in English
  function engSpell() {
    const qs = shuffle(EN_WORDS).slice(0, 10), results = [], wrong = [];
    let i = 0;
    function show() {
      const w = qs[i];
      let tries = 0, hints = 0;
      h(`<section><div class="panel q-card">
        ${duvDots(results, i, qs.length)}
        <div class="q-ask">כתבו באנגלית:</div>
        <div class="q-word">${esc(w.he)}</div>
        <div class="row center">${enSpeakBtn('sayB', 'שמעו באנגלית')}<button class="btn ghost small" id="hintB">💡 אות</button></div>
        <input class="search en spell-input" id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here..." dir="ltr">
        <div class="row center" style="margin-top:12px"><button class="btn teal" id="check">בדיקה ✔️</button><button class="btn ghost small" id="skip">דלג ⏭️</button></div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      const input = document.getElementById('ans'), fb = document.getElementById('fb');
      input.focus();
      const sb = document.getElementById('sayB'); if (sb) sb.onclick = () => { sayEn(w.en); input.focus(); };
      const done = (ok) => {
        results.push(ok); if (!ok) wrong.push(w);
        if (ok) S.stats.engSpelled++;
        save();
        input.disabled = true; ['check', 'skip', 'hintB'].forEach(id => { document.getElementById(id).disabled = true; });
        sayEn(w.en);
        later(() => { i++; i < qs.length ? show() : (engResult(results.filter(Boolean).length, qs.length, engSpell), engReview(wrong)); }, ok ? 1300 : 2600);
      };
      const check = () => {
        const v = normEn(input.value);
        if (!v) return;
        const good = [normEn(w.en), w.base, 'to ' + w.base];
        if (good.includes(v)) {
          input.classList.add('ok'); sfx('good');
          fb.textContent = hints || tries ? 'Correct! 👍' : pick(EN_PRAISE);
          done(tries === 0 && hints === 0);
        } else {
          tries++; sfx('bad'); input.classList.remove('bad'); void input.offsetWidth; input.classList.add('bad');
          if (tries >= 2) { fb.innerHTML = `התשובה: <b class="en">${esc(w.en)}</b>`; done(false); }
          else fb.textContent = 'Not quite – נסו שוב 🙂';
        }
      };
      document.getElementById('check').onclick = check;
      input.onkeydown = e => { if (e.key === 'Enter') check(); };
      document.getElementById('skip').onclick = () => { fb.innerHTML = `התשובה: <b class="en">${esc(w.en)}</b>`; sfx('tap'); done(false); };
      document.getElementById('hintB').onclick = () => {
        const target = w.base;
        let k = 0; const cur = input.value.toLowerCase();
        while (k < cur.length && cur[k] === target[k]) k++;
        if (k >= target.length) return;
        hints++; input.value = target.slice(0, k + 1); input.focus(); sfx('tap');
      };
    }
    show();
  }

  // 3. Present Simple vs Present Progressive – complete the sentence
  let enTenseMode = 'choose';
  function engTense() {
    h(`<section class="panel">
      <h2>⏱️ Present Simple או Present Progressive?</h2>
      <p>משלימים את הפועל בסוגריים בזמן הנכון. אחרי כל תשובה מופיע ההסבר למה.</p>
      <div class="chips">
        <button class="chip ${enTenseMode === 'choose' ? 'on' : ''}" data-m="choose">👆 בוחרים מ-3 תשובות</button>
        <button class="chip ${enTenseMode === 'type' ? 'on' : ''}" data-m="type">⌨️ מקלידים לבד (יותר קשה)</button>
      </div>
      <button class="btn purple" id="go">Let's go! 🚀</button>
      <button class="btn ghost small" data-go="engRules" style="margin-inline-start:8px">📘 תזכורת כללים</button>
    </section>`);
    $app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { enTenseMode = b.dataset.m; sfx('tap'); engTense(); });
    document.getElementById('go').onclick = engTensePlay; bindGo();
  }
  function engTensePlay() {
    // a balanced round: 5 Simple + 5 Progressive
    const qs = shuffle([...shuffle(EN_TENSE.filter(q => q.t === 'S')).slice(0, 5), ...shuffle(EN_TENSE.filter(q => q.t === 'P')).slice(0, 5)]);
    const results = [], wrong = [];
    const typing = enTenseMode === 'type';
    let i = 0;
    // before answering the blank keeps its "(verb)" hint; after answering the hint is replaced by the right form
    const blank = (q, fill, cls) => fill
      ? esc(q.s.replace(/___\s*\([^)]*\)/, '@@')).replace('@@', `<span class="blank ${cls || ''}">${esc(fill)}</span>`)
      : esc(q.s).replace('___', `<span class="blank">${'&nbsp;'.repeat(10)}</span>`);
    const filled = q => q.s.replace(/___\s*\([^)]*\)/, q.answers[0]);
    function show() {
      const q = qs[i];
      const opts = shuffle([q.answers[0], ...q.wrong]);
      h(`<section><div class="panel q-card">
        ${duvDots(results, i, qs.length)}
        <div class="q-ask">השלימו בזמן הנכון:</div>
        <div class="sentence en" id="sent">${blank(q)}</div>
        ${typing
          ? `<input class="search en spell-input" id="ans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the verb..." dir="ltr">
             <div class="row center" style="margin-top:12px"><button class="btn purple" id="check">בדיקה ✔️</button></div>`
          : `<div class="answers">${opts.map((o, k) => `<button class="answer en" data-k="${k}">${esc(o)}</button>`).join('')}</div>`}
        <div class="feedback" id="fb"></div>
        <div class="why" id="why" hidden></div>
        <button class="btn purple" id="next" hidden>הבא ⬅️</button>
      </div></section>`);
      const fb = document.getElementById('fb');
      const finish = (ok, chosenBtn) => {
        results.push(ok); if (!ok) wrong.push({ en: filled(q), he: TENSE_HE[q.t] });
        if (ok) S.stats.engTenseRight++;
        save();
        document.getElementById('sent').innerHTML = blank(q, q.answers[0], ok ? 'ok' : 'fix');
        fb.innerHTML = ok ? pick(EN_PRAISE) : 'Not this time 🙂';
        const why = document.getElementById('why');
        why.hidden = false;
        why.innerHTML = `<span class="tense-tag t${q.t}">${TENSE_NAME[q.t]}</span> ${esc(q.why)}`;
        sfx(ok ? 'good' : 'bad');
        const next = document.getElementById('next'); next.hidden = false; next.focus();
        next.onclick = () => { i++; i < qs.length ? show() : (engResult(results.filter(Boolean).length, qs.length, engTensePlay), engReview(wrong)); };
      };
      if (typing) {
        const input = document.getElementById('ans'); input.focus();
        const check = () => {
          const v = normEn(input.value); if (!v) return;
          input.disabled = true; document.getElementById('check').disabled = true;
          const ok = q.answers.some(a => normEn(a) === v);
          input.classList.add(ok ? 'ok' : 'bad');
          finish(ok);
        };
        document.getElementById('check').onclick = check;
        input.onkeydown = e => { if (e.key === 'Enter' && !input.disabled) check(); };
      } else {
        const btns = [...$app.querySelectorAll('.answer')];
        btns.forEach(b => b.onclick = () => {
          btns.forEach(x => x.disabled = true);
          const ok = opts[+b.dataset.k] === q.answers[0];
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) btns[opts.indexOf(q.answers[0])].classList.add('right');
          finish(ok);
        });
      }
    }
    show();
  }

  // 4. time expressions: which tense do they go with?
  function engSignal() {
    const all = [...EN_SIGNALS.S.map(w => ({ w, t: 'S' })), ...EN_SIGNALS.P.map(w => ({ w, t: 'P' }))];
    const qs = shuffle(all).slice(0, 12), results = [], wrong = [];
    let i = 0;
    function show() {
      const q = qs[i];
      h(`<section><div class="panel q-card">
        ${duvDots(results, i, qs.length)}
        <div class="q-ask">עם איזה זמן הולכת מילת הזמן הזאת?</div>
        <div class="q-word en signal">${esc(q.w)}</div>
        <div class="answers two">
          <button class="answer en" data-t="S">Present Simple<small>הווה פשוט – הרגל, עובדה</small></button>
          <button class="answer en" data-t="P">Present Progressive<small>הווה מתמשך – עכשיו, זמני</small></button>
        </div>
        <div class="feedback" id="fb"></div>
      </div></section>`);
      const btns = [...$app.querySelectorAll('.answer')];
      btns.forEach(b => b.onclick = () => {
        btns.forEach(x => x.disabled = true);
        const ok = b.dataset.t === q.t;
        results.push(ok); if (!ok) wrong.push({ en: q.w, he: TENSE_NAME[q.t] });
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) btns.find(x => x.dataset.t === q.t).classList.add('right');
        sfx(ok ? 'good' : 'bad');
        document.getElementById('fb').textContent = ok ? pick(EN_PRAISE) : `"${q.w}" → ${TENSE_NAME[q.t]}`;
        later(() => { i++; i < qs.length ? show() : (engResult(results.filter(Boolean).length, qs.length, engSignal), engReview(wrong)); }, ok ? 900 : 2000);
      });
    }
    show();
  }

  // 5. rules card
  function engRules() {
    const sig = t => EN_SIGNALS[t].map(w => `<span class="chip en static">${esc(w)}</span>`).join('');
    h(`<section>
      <div class="rules-grid">
        <div class="panel rule rS">
          <h2><span class="en">Present Simple</span> – הווה פשוט</h2>
          <div class="label">מתי משתמשים?</div>
          <ul>
            <li>הרגלים ודברים שחוזרים על עצמם <span class="en ex">I play football every Monday.</span></li>
            <li>עובדות ודברים שתמיד נכונים <span class="en ex">Water boils at 100°C.</span></li>
            <li>לוחות זמנים <span class="en ex">The train leaves at 8:15.</span></li>
            <li>פעלי מצב (גם כשיש now!) <span class="en ex">I know the answer now.</span></li>
          </ul>
          <div class="label">איך בונים?</div>
          <ul>
            <li><span class="en">I / you / we / they + <b>play</b></span></li>
            <li><span class="en">he / she / it + <b>plays</b></span> (מוסיפים s)</li>
            <li>שלילה: <span class="en">I <b>don't</b> play · She <b>doesn't</b> play</span></li>
            <li>שאלה: <span class="en"><b>Do</b> you play? · <b>Does</b> he play?</span></li>
          </ul>
          <div class="label">איות עם he / she / it</div>
          <ul>
            <li>אחרי <span class="en">s, sh, ch, x, o</span> מוסיפים <span class="en">es</span>: <span class="en">watch → watches, go → goes</span></li>
            <li>עיצור + <span class="en">y</span> → <span class="en">ies</span>: <span class="en">try → tries, cry → cries</span></li>
          </ul>
          <div class="label">מילות זמן</div>
          <div class="chips">${sig('S')}</div>
        </div>
        <div class="panel rule rP">
          <h2><span class="en">Present Progressive</span> – הווה מתמשך</h2>
          <div class="label">מתי משתמשים?</div>
          <ul>
            <li>משהו שקורה עכשיו, ברגע זה <span class="en ex">Look! It is raining.</span></li>
            <li>מצב זמני בתקופה הזאת <span class="en ex">This week we are decorating the class.</span></li>
          </ul>
          <div class="label">איך בונים?</div>
          <ul>
            <li><span class="en">I <b>am</b> + verb<b>-ing</b></span></li>
            <li><span class="en">he / she / it <b>is</b> + verb<b>-ing</b></span></li>
            <li><span class="en">you / we / they <b>are</b> + verb<b>-ing</b></span></li>
            <li>שלילה: <span class="en">I'm not playing · She <b>isn't</b> playing · They <b>aren't</b> playing</span></li>
            <li>שאלה: <span class="en"><b>Is</b> she playing? · <b>Are</b> you playing?</span></li>
          </ul>
          <div class="label">איות של ing</div>
          <ul>
            <li>מורידים <span class="en">e</span> בסוף: <span class="en">make → making, dance → dancing</span></li>
            <li>עיצור-תנועה-עיצור בהברה מוטעמת → מכפילים: <span class="en">swim → swimming, sit → sitting</span></li>
            <li><span class="en">ie → ying</span>: <span class="en">lie → lying, die → dying</span></li>
          </ul>
          <div class="label">מילות זמן</div>
          <div class="chips">${sig('P')}</div>
        </div>
      </div>
      <div class="panel rule">
        <h2>⚠️ פעלי מצב – בדרך כלל בלי ing</h2>
        <p>פעלים שמתארים מצב, רגש, מחשבה או בעלות ולא פעולה:</p>
        <div class="chips">${['like', 'love', 'hate', 'want', 'need', 'prefer', 'know', 'understand', 'believe', 'remember', 'belong', 'have (= יש)'].map(w => `<span class="chip en static">${w}</span>`).join('')}</div>
        <p class="en" style="text-align:left">✅ I <b>want</b> a pizza now. &nbsp; ❌ I am wanting a pizza now.</p>
        <p>אבל <span class="en">have</span> במובן "לאכול / לעשות" כן בא עם ing: <span class="en">We are having dinner.</span></p>
      </div>
      <div class="row center"><button class="btn purple" data-go="engTense">⏱️ לתרגל עכשיו</button></div>
    </section>`);
    bindGo();
  }

  // ===== Achievements =====
  function badges() {
    const st = S.stats;
    h(`<section>
      <div class="panel">
        <h2>🏆 ההישגים שלי</h2>
        <div class="stats">
          <div class="stat"><b>${S.stars}</b>כוכבים</div>
          <div class="stat"><b>${masteredCount()}</b>מילים שלטתי</div>
          <div class="stat"><b>${st.games}</b>משחקים</div>
          <div class="stat"><b>${st.bestStreak}</b>שיא רצף</div>
          <div class="stat"><b>${dayStreak()}</b>ימים ברצף</div>
        </div>
      </div>
      <div class="badges">${BADGES.map(b => {
        const has = S.badges.includes(b.id);
        const cur = Math.min(b.v(), b.goal);
        const bar = !has && b.goal > 1 ? `<div class="progress small"><div style="width:${Math.round(cur * 100 / b.goal)}%"></div></div><small>${cur}/${b.goal}</small>` : '';
        return `<div class="badge ${has ? '' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small>${bar}</div>`;
      }).join('')}</div>
    </section>`);
  }

  // ===== Settings =====
  function settings() {
    h(`<section class="panel">
      <h2>⚙️ הגדרות</h2>
      <label class="field">איך קוראים לך?<input type="text" id="nm" maxlength="20" value="${esc(S.name)}" placeholder="השם שלי"></label>
      <label class="switch"><input type="checkbox" id="snd" ${S.sound ? 'checked' : ''}> 🔊 צלילים</label>
      <div class="row" style="margin-top:10px">
        <button class="btn green" id="sv">שמירה</button>
        <button class="btn ghost small" id="install" hidden>📲 התקנת האפליקציה</button>
      </div>
      <hr style="margin:22px 0;border:0;border-top:2px dashed #e5e7eb">
      <p class="muted">ההתקדמות נשמרת במכשיר הזה בלבד.</p>
      <button class="btn ghost small" id="reset">🗑️ איפוס כל ההתקדמות</button>
    </section>`);
    document.getElementById('sv').onclick = () => {
      S.name = document.getElementById('nm').value.trim(); S.sound = document.getElementById('snd').checked;
      save(); sfx('good'); toast('נשמר! 👍'); location.hash = '#home';
    };
    document.getElementById('reset').onclick = () => {
      if (!confirm('למחוק את כל הכוכבים, ההתקדמות וההישגים? אי אפשר לבטל את זה.')) return;
      const keep = { name: S.name, sound: S.sound };
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), keep); save(); updateStars(); toast('ההתקדמות אופסה');
    };
    const ib = document.getElementById('install');
    if (deferredInstall) { ib.hidden = false; ib.onclick = async () => { deferredInstall.prompt(); deferredInstall = null; ib.hidden = true; }; }
  }

  // ---------- install (PWA) ----------
  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // test hook
  window.WordGames = { WORDS, state: () => S, tooClose };

  updateStars();
  route();
})();
