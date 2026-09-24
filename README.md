# 📻 DAVE-IN-A-BOX

A live-coding DJ toy in the spirit of **DJ Dave** — pre-built code blocks you trigger and mangle live. No DAW, no samples, no talent required. Everything is synthesized in your browser with the Web Audio API.

## Run it

No build step. Either:

- **Open `index.html`** in any modern browser, or
- **Use GitHub Pages** — it's a static site, enable Pages on this repo and you're live.

Press **▶ PLAY**. Then break things.

## How it works

Three channels — **DRUMS**, **BASS**, **KEYS** — each one holds a single expression in a tiny pattern DSL. Edit the code and it **hot-reloads as you type** (debounced, ~600ms). Red box = syntax error. Fix it, keep dancing.

**The Box** (buttons 1–8) holds eight pre-built scenes. Firing one loads its code into the editors and sets the tempo — so you can see exactly what changed, then mangle it. That's the whole sport, and it's exactly the DJ Dave workflow: blocks of code prepared ahead of time, performed live.

**Chaos controls:** 🎲 MUTATE randomly rewires every channel, 📯 AIRHORN is self-explanatory, 🚨 DUB SIREN induces panic. MUFFLE is a master lowpass filter, SPACE ECHO is a dub delay, SWING is swing.

## The DSL cheat sheet

```js
// DRUMS — one character per 16th note. x = hit, X = ACCENT, . = rest
drums({
  kick:  "x...x...x...x...",
  snare: "....x.......x...",
  chat:  "x.xxx.xxx.xxxxx."
})
// drum names: kick snare clap chat ohat perc

// BASS / KEYS — one token per 16th note. note names or . for rest
bass("c2 . c2 eb2 . g1 . .", { wave: "sawtooth", cutoff: 700, decay: 0.3 })
// waves: sawtooth square triangle sine
```

Strings can be any length — 16 steps is one bar, 32 is two, go wild. Keyboard: `space` play/stop, `1–8` presets, `a` airhorn, `s` siren, `cmd/ctrl+enter` force-reload a channel.

## The presets

| # | Name | Vibe |
|---|------|------|
| 1 | BOOM BAP '94 | dusty, head-nod certified |
| 2 | FOUR ON THE FLOOR (SORRY) | the most predictable banger ever |
| 3 | AMEN BREAKFAST | the most sampled 6 seconds in history, roughly |
| 4 | ACID RAIN | wear a raincoat. a metaphorical one. |
| 5 | DUB SIREN PANIC | half-time dread |
| 6 | HALFTIME DOOM | feels like 70, hits like a fridge |
| 7 | DISCO EGG | fried. sunny side up. |
| 8 | EMPTY ROOM | silence. the coward's preset. build your own. |

## Roadmap (if the bug bites)

- Export/record your set (MediaRecorder is sitting right there)
- Ableton Link / MIDI clock sync for playing with real DJ gear
- Sample loading — drop your own loops in as blocks
- When you outgrow the box: [Strudel](https://strudel.cc) is the real instrument this toy is a gateway drug to

Built for Chase. 🫎
