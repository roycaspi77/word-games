// Local test harness: runs the real apps-script/Code.gs in the browser on in-memory
// shims of SpreadsheetApp & co. Loaded only when the page is opened with ?mock=1
// from the repo root (http://localhost:8773/docs/index.html?mock=1).
// The fake sheet is kept in localStorage ('mock.sheets'); Mock.reset() clears it.
(function () {
  const STORE = 'mock.sheets';
  let data = JSON.parse(localStorage.getItem(STORE) || '{}'); // name -> rows (arrays)
  const persist = () => localStorage.setItem(STORE, JSON.stringify(data, (k, v) => v));

  function sheet(name) {
    const rows = data[name];
    return {
      getLastRow: () => rows.length,
      getLastColumn: () => rows.reduce((m, r) => Math.max(m, r.length), 0),
      appendRow: r => { rows.push(r.map(v => v instanceof Date ? v.toISOString() : v)); persist(); },
      setFrozenRows: () => {},
      getRange: (r, c, nr, nc) => ({
        getValues: () => rows.slice(r - 1, r - 1 + (nr || 1)).map(row => {
          const out = []; for (let j = 0; j < (nc || 1); j++) out.push(row[c - 1 + j] === undefined ? '' : row[c - 1 + j]); return out;
        }),
        setValue: v => { while (rows.length < r) rows.push([]); rows[r - 1][c - 1] = v instanceof Date ? v.toISOString() : v; persist(); },
      }),
    };
  }
  const ss = {
    getId: () => 'mock',
    getSheetByName: n => data[n] ? sheet(n) : null,
    insertSheet: n => { data[n] = []; persist(); return sheet(n); },
  };
  const shims = {
    SpreadsheetApp: { getActive: () => ss, openById: () => ss },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType() { return this; }, text: s }) },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      formatDate: (d, tz, f) => new Date(d).toISOString().slice(0, 10),
    },
    Session: { getScriptTimeZone: () => 'Asia/Jerusalem' },
    Logger: { log: (...a) => console.log('[Code.gs]', ...a) },
  };

  const xhr = new XMLHttpRequest();
  xhr.open('GET', '../apps-script/Code.gs?t=' + Date.now(), false);
  xhr.send();
  const names = Object.keys(shims);
  const gs = new Function(...names, xhr.responseText + '\nreturn { doPost, setup, readAll_ };')(...names.map(n => shims[n]));

  window.Mock = {
    gs,
    reset() { data = {}; persist(); gs.setup(); return this.links(); },
    links() { return gs.readAll_('Users').map(u => ({ name: u.name, role: u.role, url: location.pathname + '?mock=1&u=' + u.token })); },
    sheet: n => data[n],
  };
  if (!data.Users) gs.setup();

  window.MOCK_API = async (fn, args) => {
    await new Promise(r => setTimeout(r, 120)); // a little network delay
    const out = JSON.parse(gs.doPost({ postData: { contents: JSON.stringify({ fn, args }) } }).text);
    if (!out.ok) throw new Error(out.error);
    return out.data;
  };
})();
