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
    stats: { games: 0, memoryGames: 0, triviaGames: 0, flashSeen: 0, correct: 0, bestStreak: 0, perfectTrivia: 0, memoryBest: {} },
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
  function say(text) {
    const v = heVoice(); if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(strip(text)); u.voice = v; u.lang = v.lang; u.rate = 0.9;
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
  const BADGES = [
    { id: 'first',   e: '🎈', t: 'התחלה טובה',    d: 'שיחקת משחק ראשון',           test: () => S.stats.games >= 1 },
    { id: 'mem1',    e: '🧠', t: 'זיכרון של פיל',  d: 'סיימת משחק זיכרון',           test: () => S.stats.memoryGames >= 1 },
    { id: 'memPro',  e: '🐘', t: 'אלוף הזיכרון',   d: 'סיימת זיכרון קשה (8 זוגות)',  test: () => !!S.stats.memoryBest[8] },
    { id: 'triv1',   e: '❓', t: 'יודע תשובות',    d: 'סיימת סבב טריוויה',           test: () => S.stats.triviaGames >= 1 },
    { id: 'perfect', e: '💯', t: 'מושלם!',          d: '10 מתוך 10 בטריוויה',         test: () => S.stats.perfectTrivia >= 1 },
    { id: 'streak5', e: '🔥', t: 'על הגל',          d: '5 תשובות נכונות ברצף',        test: () => S.stats.bestStreak >= 5 },
    { id: 'streak15',e: '🚀', t: 'בלתי ניתן לעצירה', d: '15 תשובות נכונות ברצף',      test: () => S.stats.bestStreak >= 15 },
    { id: 'words25', e: '📗', t: 'אספן מילים',     d: 'שלטת ב-25 מילים',             test: () => masteredCount() >= 25 },
    { id: 'words100',e: '📚', t: 'תולעת ספרים',    d: 'שלטת ב-100 מילים',            test: () => masteredCount() >= 100 },
    { id: 'wordsAll',e: '👑', t: 'מלך המילים',      d: 'שלטת בכל המילים!',            test: () => masteredCount() >= WORDS.length },
    { id: 'days3',   e: '📅', t: 'מתמיד',           d: 'שיחקת 3 ימים ברצף',           test: () => dayStreak() >= 3 },
    { id: 'days7',   e: '🏅', t: 'שבוע של מילים',   d: 'שיחקת 7 ימים ברצף',           test: () => dayStreak() >= 7 },
    { id: 'stars100',e: '🌟', t: 'מאה כוכבים',      d: 'אספת 100 כוכבים',             test: () => S.stars >= 100 },
    { id: 'flash',   e: '🃏', t: 'לומד חרוץ',       d: 'עברת על 30 כרטיסיות',         test: () => S.stats.flashSeen >= 30 },
  ];
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
    { id: 'flash',  emoji: '🃏', title: 'כרטיסיות',      sub: 'לומדים מילים חדשות',        tile: 'tile-orange' },
  ];

  // ---------- screens ----------
  const SCREENS = { home, memory, trivia, flash, words, badges, settings };
  function route() {
    const name = (location.hash || '#home').slice(1).split('?')[0];
    const fn = SCREENS[name] || home;
    stopTimers();
    document.getElementById('backBtn').hidden = fn === home;
    fn();
    scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  document.getElementById('backBtn').onclick = () => { location.hash = '#home'; };

  let timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function every(fn, ms) { timers.push(setInterval(fn, ms)); }
  function stopTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

  function home() {
    const w = WORDS[Math.abs(hash(today())) % WORDS.length];
    const mc = masteredCount(), pct = Math.round(mc * 100 / WORDS.length);
    const ds = dayStreak();
    const greet = S.name ? `שלום ${esc(S.name)}!` : 'שלום!';
    h(`<section>
      <div class="panel hello">
        <div class="owl">🦉</div>
        <div style="flex:1">
          <h1>${greet}</h1>
          <div class="muted">שלטת ב-<b>${mc}</b> מתוך ${WORDS.length} מילים${ds ? ` · <span class="streak">🔥 ${ds} ימים ברצף</span>` : ''}</div>
          <div class="progress"><div style="width:${Math.max(pct, mc ? 2 : 0)}%"></div></div>
        </div>
      </div>
      <div class="game-grid">
        ${GAMES.map(g => `<button class="game-tile ${g.tile}" data-go="${g.id}"><span class="emoji">${g.emoji}</span><span class="title">${g.title}</span><span class="sub">${g.sub}</span></button>`).join('')}
        <button class="game-tile tile-teal" data-go="words"><span class="emoji">📖</span><span class="title">המילון שלי</span><span class="sub">חיפוש, מועדפים ומילים קשות</span></button>
        <button class="game-tile tile-blue" data-go="badges"><span class="emoji">🏆</span><span class="title">הישגים</span><span class="sub">${S.badges.length} מתוך ${BADGES.length} תגים</span></button>
      </div>
      <div class="panel wotd" style="margin-top:18px">
        <div class="label">✨ המילה של היום</div>
        <div class="row"><span class="term">${esc(w.term)}</span>${heVoice() ? `<button class="icon-btn" id="sayW" aria-label="השמעה">🔊</button>` : ''}</div>
        <div style="font-size:19px;margin-top:4px">${esc(w.def)}</div>
      </div>
      <div class="row center"><button class="btn ghost small" data-go="settings">⚙️ הגדרות</button></div>
    </section>`);
    bindGo();
    const sb = document.getElementById('sayW'); if (sb) sb.onclick = () => say(w.term);
  }
  function hash(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }
  function bindGo() { $app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { sfx('tap'); location.hash = '#' + b.dataset.go; }); }

  // ===== Memory game =====
  let memPairs = 6;
  function memory() {
    h(`<section class="panel">
      <h2>🧠 משחק הזיכרון</h2>
      <p>הפכו שני קלפים בכל תור. מצאו את <b>המילה</b> ואת <b>הפירוש</b> שלה!</p>
      <div class="label">כמה זוגות?</div>
      <div class="chips">
        ${[[4, '😊 קל – 4'], [6, '😎 בינוני – 6'], [8, '🤯 קשה – 8']].map(([n, l]) => `<button class="chip ${memPairs === n ? 'on' : ''}" data-n="${n}">${l}</button>`).join('')}
      </div>
      ${poolPicker(4)}
      <button class="btn" id="go">יאללה, מתחילים! 🎉</button>
    </section>`);
    $app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { memPairs = +b.dataset.n; sfx('tap'); memory(); });
    bindPoolPicker(memory);
    document.getElementById('go').onclick = () => { if (ensurePool(4)) memoryPlay(); };
  }

  function memoryPlay() {
    const src = poolWords();
    let chosen = choose(src, memPairs, w => w.def.length <= 48);
    if (chosen.length < memPairs) chosen = choose(src, memPairs); // small pools: allow long definitions
    const n = chosen.length;
    const cards = shuffle(chosen.flatMap(w => [{ w, kind: 'term' }, { w, kind: 'def' }]));
    let open = [], matched = 0, moves = 0, secs = 0, lock = false;
    h(`<section>
      <div class="hud"><span>🔄 תורות: <b id="mv">0</b></span><span>✅ זוגות: <b id="pr">0</b>/${n}</span><span>⏱️ <b id="tm">0:00</b></span></div>
      <div class="legend"><span><i style="background:#ede9fe"></i>מילה</span><span><i style="background:#ffedd5"></i>פירוש</span></div>
      <div class="mem-grid ${n >= 8 ? 'many' : ''}" id="grid">
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
    const stars = moves <= n + 2 ? 3 : moves <= n * 2 ? 2 : 1;
    const earned = stars * 2 + n;
    addStars(earned);
    S.stats.memoryGames++;
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
      <ul class="mistakes" style="text-align:right">${chosen.map(w => `<li style="background:#f0fdf4"><b>${esc(w.term)}</b> – ${esc(w.def)}</li>`).join('')}</ul>
      <div class="row center" style="margin-top:14px">
        <button class="btn" id="again">🔁 עוד פעם</button>
        <button class="btn ghost" data-go="home">🏠 לדף הבית</button>
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
          <button class="btn ghost" data-go="home">🏠 לדף הבית</button>
        </div>
      </section>`);
      document.getElementById('again').onclick = triviaPlay; bindGo();
      checkBadges();
    }
    show();
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
        return `<div class="badge ${has ? '' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`;
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
