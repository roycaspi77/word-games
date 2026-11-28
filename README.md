# משחקי מילים

A cheerful Hebrew vocabulary app for kids that you can install on a phone or computer. It's a PWA: a static site on GitHub Pages that also works offline. It has no backend and needs no login.

## What's inside
The home screen has three areas plus achievements:
- **🍭 Luli's area (האיזור של לולי)**: Hebrew vocabulary for 6th grade, with the memory game, trivia, word search, flash cards, dictionary and word of the day below.
- **🍒 Duvduv's area (האיזור של דובדוב)**: Hebrew for 1st grade.
- **🌍 האיזור של נושנוש**: English for 8th grade.

- **🧠 Memory game**: find the pairs of a word and its meaning (easy 8, medium 32, hard 64 pairs). Word cards are purple and meaning cards are orange. You get stars based on how many turns you take, and your best score is kept.
- **❓ Trivia**: 10 questions with 3 answers each. There are two modes: "what does the word mean?" and "which word fits this meaning?". The wrong answers are meanings or words from the same list, and the app skips any that overlap the right answer. It has a 50/50 hint, streaks, and a list of the words to go over again at the end.
- **🔎 Word search (תפזורת)**: the words are hidden in a letter grid and their meanings are listed below it as a bank. Drag from the first letter to the last, or tap the first and then the last. Words are hidden across, down, diagonally and backwards on every level. Easy is 8×8 with 5 words, medium is 10×10 with 7, and hard is 12×12 with 10. A hint flashes a word's first letter.
- **🃏 Flash cards**: flip a card, then mark "I knew it" or "not yet".
- **🍒 Duvduv's area (האיזור של דובדוב)**: Hebrew games for 1st graders, built on 78 picture words with niqqud (`docs/kids-words.js`):
  - *באיזו אות מתחילה?*: see a picture (and hear the word) and pick its first letter out of 3.
  - *קוראים ובוחרים*: read a word with niqqud and pick its picture out of 3.
  - *בונים מילה*: tap the letters (each keeps its niqqud) in order to build the word under the picture. It has a hint button.
  - *האות החסרה* (the hardest one): a letter is missing from the middle or end of the word, and the wrong options are look-alike or sound-alike letters (ב/כ/פ, ד/ר, ה/ח/א, ו/ז, ס/ש, ט/ת...).
  - *כותבים מילה*: see a picture and write the whole word on the on-screen letter bar (with the final letters) or a keyboard. Wrong letters are marked, with a tip for final letters (בסוף מילה כותבים ם). It has a letter hint and 3 tries.
  - *הצליל הראשון*: niqqud practice. Choose the word's first sound (letter + vowel, e.g. בָּ / בִּ / בּוּ). The 1st-grade program focuses on letter knowledge and reading words with niqqud.
  - *חרוזים*: which picture rhymes with the word? It uses 12 rhyme groups (`KIDS_RHYMES`), and the wrong options never rhyme.
  - *מי אני?*: read a short riddle with niqqud ("אֲנִי שׂוֹחֶה בַּיָּם") and pick the picture. There are 18 riddles (`KIDS_RIDDLES`); riddles that could fit each other (sky, water, sweets) are never offered together.
  - *מילים באנגלית*: first English words in 4 categories (colors, family, animals, fruit and vegetables). Learning cards with sound and a Hebrew-letter pronunciation, then a "listen and choose the picture" game.
  - It reads words and letter names aloud when the device has a Hebrew voice.
- **🌍 האיזור של נושנוש**: English for 8th grade, with its data in `docs/english-data.js`:
  - *אוצר מילים*: English → Hebrew or Hebrew → English, 3 options, using the 29 vocabulary words.
  - *איות*: see the Hebrew meaning (and hear the word) and type it in English. It has letter hints and 2 tries.
  - *הווה פשוט או מתמשך?*: complete 10 sentences (5 of each tense) by choosing or typing. Each answer shows why.
  - *מילות זמן*: decide whether a time expression goes with Present Simple or Present Progressive.
  - *תזכורת כללים*: a rules card covering when to use each tense, how to build it, spelling rules, time words and stative verbs.
- **🏀 האיזור של יובלולו**: English for 10th grade, built on the Israeli Ministry of Education curriculum, with its data in `docs/tenth-data.js` and all texts original:
  - *אוצר מילים*: 46 words from Band III (Core 1) List A. Two modes: the meaning, or completing a sentence in context.
  - *דקדוק*: 42 items over Present Perfect/Past Simple, Passive, Conditionals, Reported Speech, Relative Clauses and Modals. Each answer has a Hebrew explanation.
  - *הבנת הנקרא*: 3 passages in the Module C format (article, human-interest, review) with 7 questions each: multiple choice, referents, sentence completion and a find-the-word question. The relevant paragraph is highlighted after each answer.
  - *כתיבה*: 6 Module C tasks (opinion, description, informal letter, 70–90 words). A live checklist based on the Bagrut rubric, phrase buttons, saved drafts, plus a linking-words quiz.
  - *הבנת הנשמע*: 4 clips in the oral exam's listening format (COBE), read aloud with a slow option and a transcript at the end, plus dictation with word-by-word marking.
- **📖 Dictionary**: search, favourites ⭐, "hard words" and "mastered" filters, and read-aloud when the device has a Hebrew voice.
- **🏆 Achievements**: stars, 40 badges with progress bars, a streak of days in a row, and how many words are mastered. A word counts as mastered after 3 right answers in a row.
- **Word of the day** on the home screen, plus settings for the child's name and sound.
- Every game can be played on all the words, new words only, hard words, favourites, or one letter.
- Questions favour words the child hasn't learned yet and words they got wrong.

Progress is saved on each device (localStorage).

## Progress and stars (optional backend)
With the backend, each person opens a personal link (`…/word-games/?u=<token>`).
- **Progress:** every finished game is sent as one row (who, area, game, score, stars). Parents see everyone on the 📊 screen; a kid sees only their own.
- **Stars:** the star balance lives on the server, so stars can be sent between people (tap the ⭐ counter). Parents can also give stars as a gift without having them.
- **Offline:** games wait on the device and are sent when it's online again.
- **Shared devices:** each player has separate progress on the device, and Settings can switch between players who opened their link there.

Without a backend (`docs/config.js` empty), the app works as before, with progress on each device only.

### One-time setup
1. Create a Google Sheet (for example "משחקי מילים – התקדמות") → Extensions → Apps Script.
2. Paste `apps-script/Code.gs` and save. Run `setup` once and allow access. It creates the Users and Events sheets, with a personal link for each person in the Users sheet.
3. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone. Copy the `/exec` URL.
4. Put the URL in `docs/config.js` (`window.WORD_GAMES_API = '…/exec'`) and push.
5. Send each kid their own link from the Users sheet. You can rename people or add rows in the Users sheet; a new row needs a new random token.

To upgrade the backend later: paste the new `Code.gs`, run `setup`, then Deploy → Manage deployments → ✏️ Edit the existing deployment → New version. That keeps the same URL.

### Local testing
`python -m http.server 8773` from this folder, then open `http://localhost:8773/docs/index.html?mock=1`. `.dev/mock.js` runs the real `Code.gs` in the browser on a fake Sheet. In the console, `Mock.links()` lists the personal links and `Mock.reset()` starts over.

## Files
- `docs/words.js`: the word list, one `word | meaning` per line. Add or fix words here.
- `docs/app.js`: the screens and games. To add a game, add it to `GAMES` and write a screen function in `SCREENS`.
- `docs/styles.css`, `docs/index.html`, `docs/manifest.webmanifest`, `docs/sw.js`, `docs/icons/`

## Publishing (GitHub Pages)
1. Create a repository on GitHub, for example `word-games`.
2. Upload everything in this folder.
3. Settings → Pages → Branch `main`, folder `/docs` → Save.
4. The app will be at `https://<user>.github.io/word-games/`.

## Installing
- **Android (Chrome)**: open the link → ⋮ menu → "Install app" / "Add to Home screen".
- **iPhone (Safari)**: Share → "Add to Home Screen".
- **Computer (Chrome/Edge)**: the install icon in the address bar, or Settings in the app → "Install app".

## Updates
After changing a file, raise `VERSION` in `docs/sw.js`, for example to `wordgames-v2`, so installed copies pick up the change.

## Running locally
`python -m http.server 8772 --directory docs`, then open http://localhost:8772
