/**
 * משחקי מילים — Google Apps Script backend, bound to a Google Sheet.
 *
 * What it does
 *   - Progress: after every finished game the app sends one row (who, area, game,
 *     score, stars). Admins see everyone's progress; a player sees their own.
 *   - Stars: the star balance lives here, so stars can move between players.
 *     balance = stars earned in games + stars received − stars sent.
 *     A player can send stars from their own balance; an admin can also give
 *     stars as a gift without a balance.
 *
 * Sheets (created / upgraded by setup()):
 *   Users  – token, name, role (admin / player), created_at, link
 *   Events – one row per finished game, star transfer or gift.
 *            type: game | import | send | receive | gift
 *
 * Access: this script is only a JSON API. The screens are the static page on
 * GitHub Pages (APP_URL). Each person opens a personal link APP_URL?u=<token>;
 * treat each link like a password.
 *
 * Upgrading: paste this file, run setup() (safe to run again), then
 * Deploy → Manage deployments → ✏️ Edit the existing deployment → New version.
 */

const APP_NAME = 'משחקי מילים';
const APP_URL = 'https://roycaspi77.github.io/word-games/';
const VERSION = 1;
const MAX_TRANSFER = 500;

const HEADERS = {
  Users: ['token', 'name', 'role', 'created_at', 'link'],
  Events: ['id', 'time', 'token', 'name', 'type', 'area', 'game', 'right', 'total', 'stars', 'other', 'note'],
};

// The people created by the first setup(). Rename them in the Users sheet any time
// (the token is what matters); add a row with a new token for another player.
const FIRST_USERS = [
  ['אבא', 'admin'], ['אמא', 'admin'],
  ['לולי', 'player'], ['דובדוב', 'player'], ['נושנוש', 'player'], ['יובלולו', 'player'],
];

// ---------- setup ----------
function setup() {
  const ss = spreadsheet_();
  Object.keys(HEADERS).forEach(name => {
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS[name]);
      sh.setFrozenRows(1);
    } else {
      // add any missing columns at the end (upgrades)
      const have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
      HEADERS[name].filter(h => have.indexOf(h) < 0).forEach(h => sh.getRange(1, sh.getLastColumn() + 1).setValue(h));
    }
  });
  const users = sheet_('Users');
  if (users.getLastRow() === 1) {
    FIRST_USERS.forEach(([name, role]) => {
      const token = newToken_();
      users.appendRow([token, name, role, now_(), APP_URL + '?u=' + token]);
    });
  }
  // fill in missing links
  const rows = readAll_('Users');
  rows.forEach((u, i) => {
    if (u.token && !u.link) users.getRange(i + 2, HEADERS.Users.indexOf('link') + 1).setValue(APP_URL + '?u=' + u.token);
  });
  readAll_('Users').forEach(u => Logger.log(u.name + ' (' + u.role + '): ' + u.link));
}

// ---------- web app ----------
const API = { hello, sync, transfer, progress };

function doPost(e) {
  let result;
  try {
    const request = JSON.parse(e.postData.contents);
    const fn = API.hasOwnProperty(request.fn) ? API[request.fn] : null;
    if (!fn) throw new Error('Unknown action.');
    result = { ok: true, data: fn.apply(null, request.args || []) };
  } catch (err) {
    result = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: APP_NAME, version: VERSION }))
    .setMimeType(ContentService.MimeType.JSON);
}

// who am I, my balance, and who I can send stars to
function hello(token) {
  const me = auth_(token);
  const events = readAll_('Events');
  return {
    me: { name: me.name, role: me.role },
    balance: balance_(events, me.token),
    hasEvents: events.some(e => e.token === me.token),
    people: readAll_('Users').filter(u => u.token && u.token !== me.token).map(u => ({ id: u.token.slice(0, 6), name: u.name })),
    version: VERSION,
  };
}

// store finished games (each has a client-made id, so sending twice is harmless)
function sync(token, items) {
  const me = auth_(token);
  return locked_(() => {
    const events = readAll_('Events');
    const seen = {};
    events.forEach(e => { seen[e.id] = true; });
    const sh = sheet_('Events');
    (items || []).slice(0, 200).forEach(it => {
      const id = String(it.id || '').slice(0, 40);
      if (!id || seen[id]) return;
      const type = it.type === 'import' ? 'import' : 'game';
      if (type === 'import' && events.some(e => e.token === me.token)) return; // import only into an empty history
      const stars = Math.max(0, Math.min(type === 'import' ? 100000 : 200, Math.round(Number(it.stars) || 0)));
      const row = [id, it.time ? new Date(it.time) : new Date(), me.token, me.name, type,
        str_(it.area, 20), str_(it.game, 40), num_(it.right), num_(it.total), stars, '', str_(it.note, 300)];
      sh.appendRow(row);
      seen[id] = true;
      events.push(rowObj_(HEADERS.Events, row));
    });
    return { balance: balance_(events, me.token) };
  });
}

// send stars to another person (admins may give stars they don't have: a gift)
function transfer(token, toId, amount, note, id) {
  const me = auth_(token);
  amount = Math.round(Number(amount));
  if (!(amount >= 1 && amount <= MAX_TRANSFER)) throw new Error('אפשר לשלוח בין 1 ל-' + MAX_TRANSFER + ' כוכבים.');
  const to = readAll_('Users').filter(u => u.token && u.token.slice(0, 6) === String(toId))[0];
  if (!to) throw new Error('לא מצאתי למי לשלוח.');
  if (to.token === me.token) throw new Error('אי אפשר לשלוח לעצמך.');
  return locked_(() => {
    const events = readAll_('Events');
    const tid = str_(id, 40) || Utilities.getUuid();
    if (events.some(e => e.id === tid + ':out')) return { balance: balance_(events, me.token), duplicate: true };
    const admin = me.role === 'admin';
    const mine = balance_(events, me.token);
    const gift = admin && mine < amount;
    if (!gift && mine < amount) throw new Error('אין לך מספיק כוכבים (יש לך ' + mine + ').');
    const sh = sheet_('Events');
    const t = new Date();
    const text = str_(note, 200);
    if (!gift) sh.appendRow([tid + ':out', t, me.token, me.name, 'send', '', '', '', '', -amount, to.name, text]);
    sh.appendRow([tid + ':in', t, to.token, to.name, gift ? 'gift' : 'receive', '', '', '', '', amount, me.name, text]);
    return { balance: gift ? mine : mine - amount, gift };
  });
}

// progress: admins see everyone, a player sees only themself
function progress(token) {
  const me = auth_(token);
  const users = readAll_('Users').filter(u => u.token);
  const events = readAll_('Events');
  const list = me.role === 'admin' ? users : users.filter(u => u.token === me.token);
  const weekAgo = Date.now() - 7 * 864e5;
  return {
    admin: me.role === 'admin',
    people: list.map(u => {
      const mine = events.filter(e => e.token === u.token);
      const games = mine.filter(e => e.type === 'game');
      const areas = {};
      games.forEach(g => {
        const a = areas[g.area] || (areas[g.area] = { games: 0, right: 0, total: 0, week: 0, last: 0 });
        a.games++;
        a.right += Number(g.right) || 0;
        a.total += Number(g.total) || 0;
        const t = new Date(g.time).getTime();
        if (t >= weekAgo) a.week++;
        a.last = Math.max(a.last, t);
      });
      const days = {};
      games.forEach(g => { days[Utilities.formatDate(new Date(g.time), Session.getScriptTimeZone(), 'yyyy-MM-dd')] = true; });
      return {
        name: u.name,
        role: u.role,
        balance: balance_(events, u.token),
        games: games.length,
        week: games.filter(g => new Date(g.time).getTime() >= weekAgo).length,
        days: Object.keys(days).length,
        last: games.length ? Math.max.apply(null, games.map(g => new Date(g.time).getTime())) : 0,
        areas: areas,
        recent: mine.slice(-25).reverse().map(e => ({
          time: new Date(e.time).getTime(), type: e.type, area: e.area, game: e.game,
          right: e.right, total: e.total, stars: Number(e.stars) || 0, other: e.other, note: e.note,
        })),
      };
    }),
  };
}

// ---------- helpers ----------
function balance_(events, token) {
  return events.filter(e => e.token === token).reduce((s, e) => s + (Number(e.stars) || 0), 0);
}

function auth_(token) {
  const t = String(token || '');
  const u = t && readAll_('Users').filter(x => x.token === t)[0];
  if (!u) throw new Error('Unknown link.');
  return u;
}

let spreadsheetCache_ = null;
function spreadsheet_() {
  return spreadsheetCache_ || (spreadsheetCache_ = SpreadsheetApp.openById(SpreadsheetApp.getActive().getId()));
}
function sheet_(name) { return spreadsheet_().getSheetByName(name); }

function readAll_(name) {
  const sh = sheet_(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  const head = values.shift();
  return values.map(r => rowObj_(head, r));
}
function rowObj_(head, row) { const o = {}; head.forEach((h, i) => { o[h] = row[i]; }); return o; }

function locked_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function newToken_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 16); }
function now_() { return new Date(); }
function str_(v, max) { return String(v == null ? '' : v).slice(0, max); }
function num_(v) { const n = Number(v); return isFinite(n) ? Math.round(n) : ''; }
