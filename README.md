# משחקי מילים

A cheerful Hebrew vocabulary app for kids that you can install on a phone or computer. It's a PWA: a static site on GitHub Pages that also works offline. It has no backend and needs no login.

## What's inside
- **🧠 Memory game**: find the pairs of a word and its meaning (4, 6 or 8 pairs). Word cards are purple and meaning cards are orange. You get stars based on how many turns you take, and your best score is kept.
- **❓ Trivia**: 10 questions with 3 answers each. There are two modes: "what does the word mean?" and "which word fits this meaning?". The wrong answers are meanings or words from the same list, and the app skips any that overlap the right answer. It has a 50/50 hint, streaks, and a list of the words to go over again at the end.
- **🃏 Flash cards**: flip a card, then mark "I knew it" or "not yet".
- **📖 Dictionary**: search, favourites ⭐, "hard words" and "mastered" filters, and read-aloud when the device has a Hebrew voice.
- **🏆 Achievements**: stars, 14 badges, a streak of days in a row, and how many words are mastered. A word counts as mastered after 3 right answers in a row.
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
