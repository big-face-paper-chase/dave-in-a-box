/* dave-in-a-box — presets.js
 * The box: pre-built code blocks. Firing one loads its code into the
 * editors (and sets the tempo), so you can see exactly what changed
 * and start mangling it. That's the whole sport.
 */
'use strict';

const PRESETS = [
  {
    name: "BOOM BAP '94",
    key: '1',
    bpm: 92,
    blurb: 'dusty. head-nod certified.',
    code: {
      drums: `drums({
  kick:  "x.....x...x.....",
  snare: "....x.......x...",
  chat:  "x.x.x.xxx.x.x.x."
})`,
      bass: `bass("c2 . . . eb2 . . g1 . . . . . . . .",
  { cutoff: 600, decay: 0.3 })`,
      keys: `keys("eb4 . g4 . bb4 . . d5 . . . . . . .",
  { wave: "triangle", cutoff: 2400, decay: 0.35 })`
    }
  },
  {
    name: 'FOUR ON THE FLOOR (SORRY)',
    key: '2',
    bpm: 124,
    blurb: 'the most predictable banger ever.',
    code: {
      drums: `drums({
  kick:  "x...x...x...x...",
  clap:  "....x.......x...",
  ohat:  "....o.......o...",
  chat:  "..x...x...x...x."
})`,
      bass: `bass("c2 . c2 . c2 . c2 . g1 . g1 . bb1 . bb1 .",
  { cutoff: 900, decay: 0.18 })`,
      keys: `keys(". eb3 . g3 . bb3 . g3 . eb3 . g3 . bb3 . d4",
  { wave: "square", cutoff: 1800, decay: 0.2 })`
    }
  },
  {
    name: 'AMEN BREAKFAST',
    key: '3',
    bpm: 172,
    blurb: 'the most sampled 6 seconds in history, roughly.',
    code: {
      drums: `drums({
  kick:  "x..x...x.x......",
  snare: "....x..x....x.X.",
  chat:  "xxxxxxxxxxxxxxxx",
  perc:  "..x...x...x...x."
})`,
      bass: `bass("c1 . c1 . . c1 . . eb1 . . . . . . .",
  { cutoff: 500, decay: 0.25 })`,
      keys: `keys(". . . . . . . . . . . . . . . .",
  { wave: "triangle" })`
    }
  },
  {
    name: 'ACID RAIN',
    key: '4',
    bpm: 132,
    blurb: 'wear a raincoat. a metaphorical one.',
    code: {
      drums: `drums({
  kick:  "x...x...x...x...",
  ohat:  "..o...o...o...o.",
  clap:  "....x.......x...",
  perc:  "......x.......x."
})`,
      bass: `bass("c2 c2 c3 c2 c2 eb2 c2 bb1 c2 c2 c3 c2 d3 c2 bb1 g1",
  { wave: "sawtooth", cutoff: 1100, decay: 0.14, peak: 0.34 })`,
      keys: `keys("eb5 . . . . . . . . . . . g5 . . .",
  { wave: "sine", cutoff: 3000, decay: 0.5, send: 1.5 })`
    }
  },
  {
    name: 'DUB SIREN PANIC',
    key: '5',
    bpm: 140,
    blurb: 'half-time dread. press the siren. you know you want to.',
    code: {
      drums: `drums({
  kick:  "x......x........",
  snare: "........x.......",
  chat:  "..x...x...x...x.",
  perc:  "....x.......x..."
})`,
      bass: `bass("c2 . . . . . . . g1 . . . . . . .",
  { cutoff: 550, decay: 0.4, peak: 0.5 })`,
      keys: `keys(".. eb3 .. g3 .. bb3 .. g3",
  { wave: "triangle", cutoff: 2000, decay: 0.3, send: 1.4 })`
    }
  },
  {
    name: 'HALFTIME DOOM',
    key: '6',
    bpm: 140,
    blurb: 'feels like 70. hits like a fridge.',
    code: {
      drums: `drums({
  kick:  "x..........x....",
  snare: "......x.........",
  chat:  "x.x.x.x.x.x.x.x.",
  ohat:  "..............o."
})`,
      bass: `bass("c1 . . . . . . . . . . . . . . .",
  { wave: "sawtooth", cutoff: 400, decay: 0.9, peak: 0.5 })`,
      keys: `keys("eb2 . . . . . . . bb2 . . . . . . .",
  { wave: "sine", cutoff: 1200, decay: 0.8, send: 1.2 })`
    }
  },
  {
    name: 'DISCO EGG',
    key: '7',
    bpm: 115,
    blurb: 'fried. sunny side up. four on the floor adjacent.',
    code: {
      drums: `drums({
  kick:  "x...x...x...x.x.",
  clap:  "....x.......x...",
  ohat:  "..o...o...o...o.",
  chat:  "x.xxx.xxx.xxx.xx"
})`,
      bass: `bass("c2 c3 c2 c3 eb2 eb3 eb2 eb3 g2 g3 g2 g3 bb2 bb3 bb2 bb3",
  { cutoff: 1000, decay: 0.16 })`,
      keys: `keys("eb4 g4 bb4 g4 eb4 g4 bb4 c5 eb4 g4 bb4 d5 c5 bb4 g4 eb4",
  { wave: "triangle", cutoff: 2600, decay: 0.2 })`
    }
  },
  {
    name: 'EMPTY ROOM',
    key: '8',
    bpm: 100,
    blurb: 'silence. the coward\'s preset. build your own.',
    code: {
      drums: `drums({
  // your drums here. x = hit, X = ACCENT, . = rest
  // kick:  "x...x...x...x...",
})`,
      bass: `bass(".",
  { cutoff: 700 })`,
      keys: `keys(".",
  { wave: "triangle" })`
    }
  }
];
