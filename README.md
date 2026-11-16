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
  - It reads words and letter names aloud when the device has a Hebrew voice.
- **🌍 האיזור של נושנוש**: English for 8th grade, with its data in `docs/english-data.js`:
  - *אוצר מילים*: English → Hebrew or Hebrew → English, 3 options, using the 29 vocabulary words.
  - *איות*: see the Hebrew meaning (and hear the word) and type it in English. It has letter hints and 2 tries.
  - *הווה פשוט או מתמשך?*: complete 10 sentences (5 of each tense) by choosing or typing. Each answer shows why.
  - *מילות זמן*: decide whether a time expression goes with Present Simple or Present Progressive.
  - *תזכורת כללים*: a rules card covering when to use each tense, how to build it, spelling rules, time words and stative verbs.
- **📖 Dictionary**: search, favourites ⭐, "hard words" and "mastered" filters, and read-aloud when the device has a Hebrew voice.
- **🏆 Achievements**: stars, 40 badges with progress bars, a streak of days in a row, and how many words are mastered. A word counts as mastered after 3 right answers in a row.
- **Word of the day** on the home screen, plus settings for the child's name and sound.
- Every game can be played on all the words, new words only, hard words, favourites, or one letter.
- Questions favour words the child hasn't learned yet and words they got wrong.

Progress is saved on each device (localStorage).

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
