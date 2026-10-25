# skipstone

A small 3D stone-skipping game. Help Pip the pebble skip across five lakes to reach the Moon Shore.

## How to play

- **Desktop:** press Space or Enter, or click.
- **Phone:** tap anywhere.

Tap when the shrinking outer ring meets the inner ring around the landing spot. The window runs on both sides of the landing, so a tap just after the stone touches the water still counts.

- **Perfect** (inner ring turns gold): the longest, highest hop, and it builds your streak.
- **Good:** a medium hop. It always clears rocks and logs and never lands in a whirlpool.
- **Almost / Too early:** a short, low hop that hits obstacles. Tapping well before the rings meet counts as Too early.

You have three hearts. After losing one, the next two hops are always clear. Every 8 perfect hops in a row win a heart back.

## The five lakes

Each lake is faster than the last and has a tighter timing window, and each adds one new challenge:

1. **Dawn Pond:** small rocks.
2. **Reed Creek:** floating logs.
3. **Lily Marsh:** whirlpools. Do not land in them.
4. **Misty Mirror:** low bridges. A Perfect hop is too tall and bonks, so duck under with a softer Good or Almost hop. Obstacles sometimes come in pairs.
5. **Moon Lake:** frequent pairs of mixed obstacles at top speed.

Progress is saved, so you continue from the last lake you reached.

## Files

- `skipstone.html`: the game page (scene, input, story, YouTube Playables integration).
- `rules.js`: gameplay numbers and maths (lake settings, hop length and height, timing grades, obstacle placement and collisions). The page loads it as `window.SkipRules`; the tests `require` it.
- `vendor/three.min.js`: three.js r128 (the official minified build), loaded locally. If it is missing, the page falls back to the cdnjs copy for local development.
- `tests/rules.test.js`: checks hop geometry against every obstacle on every lake.

## Running locally

Serve the folder with any static server, for example `npx serve .`, then open `skipstone.html`.

## Tests

```
npm test
```

This runs `node --test tests/rules.test.js` (Node 18 or newer, no dependencies). It checks, for every lake and obstacle type at both ends of the placement jitter, that Good and Perfect hops clear rocks and logs and avoid whirlpools, that weak hops fail, that Perfect hops bonk on bridges while softer hops pass under, and that difficulty rises from lake to lake.

## Packaging for YouTube Playables

Playables cannot make external requests (other than the Playables SDK) and start from `index.html`.

1. Make sure `vendor/three.min.js` (three.js r128) is present.
2. Build a zip with these files at its root:
   - `skipstone.html`, **renamed to `index.html`** inside the zip (keep `skipstone.html` in the repo),
   - `rules.js`,
   - `vendor/three.min.js`.

   For example:
   ```
   mkdir -p build/vendor
   cp skipstone.html build/index.html
   cp rules.js build/
   cp vendor/three.min.js build/vendor/
   (cd build && zip -r ../skipstone-playables.zip .)
   ```
3. Do not include `tests/`, `package.json` or `README.md`.

Inside YouTube the game loads `https://www.youtube.com/game_api/v1`, signals `firstFrameReady` and `gameReady`, freezes on pause, follows YouTube's audio setting (sound plays only if both YouTube and the in-game button allow it), saves progress with `saveData`/`loadData`, and sends the number of lakes cleared as the score. Outside YouTube it falls back to `localStorage`.
