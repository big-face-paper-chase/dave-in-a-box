/* dave-in-a-box — ui.js
 * Wires the editors, preset box, transport and FX to the engine.
 * Channel code hot-reloads as you type (debounced). Errors are
 * shown, not thrown — red boxes are part of the aesthetic.
 */
'use strict';

const engine = new DaveEngine();
const lastGood = { drums: null, bass: null, keys: null };
const CHANNELS = ['drums', 'bass', 'keys'];
const EMPTY_CODE = {
  drums: 'drums({})',
  bass: 'bass(".")',
  keys: 'keys(".")'
};

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function say(msg, isErr) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', !!isErr);
}

/* ---------- live evaluation ---------- */

function validPattern(p) {
  if (!p || typeof p !== 'object') return false;
  if (p.type === 'drums') return p.map && typeof p.map === 'object';
  if (p.type === 'melodic') return Array.isArray(p.notes);
  return false;
}

function evalChannel(ch) {
  const ta = $('code-' + ch);
  const box = ta.closest('.channel');
  const code = ta.value;
  try {
    const factory = new Function('"use strict";\nreturn (\n' + code + '\n);');
    const p = factory();
    if (!validPattern(p)) throw new Error('that returned ' + JSON.stringify(p) + ' — expected drums({...}) or bass("...") / keys("...")');
    engine.setPattern(ch, p);
    lastGood[ch] = p;
    box.classList.remove('bad');
    return true;
  } catch (err) {
    box.classList.add('bad');
    say(ch.toUpperCase() + ': ' + err.message, true);
    return false;
  }
}

function evalAll() {
  let ok = true;
  for (const ch of CHANNELS) ok = evalChannel(ch) && ok;
  if (ok) say('locked in. ' + (engine.playing ? 'still playing — nice.' : 'press PLAY.'));
  return ok;
}

/* ---------- pattern <-> code (for the MUTATE button) ---------- */

function patternToCode(p) {
  if (p.type === 'drums') {
    const lines = Object.keys(p.map).map((k) => '  ' + k + ': "' + p.map[k] + '"');
    return 'drums({\n' + lines.join(',\n') + '\n})';
  }
  const fn = p.kind === 'bass' ? 'bass' : 'keys';
  return fn + '("' + p.notes.join(' ') + '", { wave: "' + p.wave +
    '", cutoff: ' + p.cutoff + ', decay: ' + p.decay + ' })';
}

function mutatePattern(p) {
  if (p.type === 'drums') {
    const map = {};
    for (const k of Object.keys(p.map)) {
      let s = '';
      for (const ch of String(p.map[k])) {
        if (ch === ' ') { s += ' '; continue; }
        const r = Math.random();
        if (r < 0.10) s += (ch === '.' ? (Math.random() < 0.7 ? 'x' : 'X') : '.');
        else s += ch;
      }
      map[k] = s;
    }
    return { type: 'drums', map: map };
  }
  const scale = p.kind === 'bass'
    ? ['c1', 'c2', 'eb2', 'f2', 'g2', 'bb2', 'c3']
    : ['c4', 'eb4', 'f4', 'g4', 'bb4', 'c5', 'd5'];
  const notes = p.notes.map((n) => {
    if (Math.random() < 0.12) {
      return Math.random() < 0.4 ? '.' : scale[(Math.random() * scale.length) | 0];
    }
    return n;
  });
  const out = {};
  for (const k of Object.keys(p)) out[k] = p[k];
  out.notes = notes;
  return out;
}

function mutateAll() {
  let any = false;
  for (const ch of CHANNELS) {
    if (!lastGood[ch]) continue;
    const mp = mutatePattern(lastGood[ch]);
    $('code-' + ch).value = patternToCode(mp);
    any = true;
  }
  if (any) { evalAll(); say('mangled. no refunds.'); }
  else say('nothing to mangle yet — load a preset first.', true);
}

/* ---------- presets ---------- */

function loadPreset(i) {
  const pr = PRESETS[i];
  if (!pr) return;
  $('bpm').value = pr.bpm;
  $('bpmVal').textContent = pr.bpm;
  engine.setBpm(pr.bpm);
  for (const ch of CHANNELS) $('code-' + ch).value = pr.code[ch];
  document.querySelectorAll('.preset-btn').forEach((b, j) => {
    b.classList.toggle('active', j === i);
  });
  evalAll();
  say('loaded "' + pr.name + '" @ ' + pr.bpm + 'bpm. mangle at will.');
}

function buildPresetGrid() {
  const grid = $('presetGrid');
  PRESETS.forEach((pr, i) => {
    const b = document.createElement('button');
    b.className = 'preset-btn';
    b.innerHTML = '<span class="pkey">' + pr.key + '</span>' +
      '<span class="pname">' + pr.name + '</span>' +
      '<span class="pblurb">' + pr.blurb + '</span>';
    b.addEventListener('click', () => loadPreset(i));
    grid.appendChild(b);
  });
}

/* ---------- transport & fx ---------- */

function togglePlay() {
  const btn = $('playBtn');
  if (engine.playing) {
    engine.stop();
    btn.textContent = '▶ PLAY';
    btn.classList.remove('playing');
    say('stopped. the silence is deafening.');
  } else {
    if (!evalAll()) { say('fix the red box first, then we ride.', true); return; }
    engine.play();
    btn.textContent = '■ STOP';
    btn.classList.add('playing');
    say('playing @ ' + engine.bpm + 'bpm. touch nothing. or touch everything.');
  }
}

/* ---------- step dots ---------- */

function buildDots() {
  const wrap = $('stepDots');
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i % 4 === 0 ? ' beat' : '');
    wrap.appendChild(d);
  }
}

function tickDots() {
  const dots = $('stepDots').children;
  const cur = engine.playing ? engine.step % 16 : -1;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('on', i === cur);
  }
  requestAnimationFrame(tickDots);
}

/* ---------- wiring ---------- */

function wire() {
  buildPresetGrid();
  buildDots();

  // editors: hot-reload (debounced) + tab support + cmd/ctrl+enter
  const deb = {};
  for (const ch of CHANNELS) {
    const ta = $('code-' + ch);
    ta.addEventListener('input', () => {
      clearTimeout(deb[ch]);
      deb[ch] = setTimeout(() => {
        if (evalChannel(ch)) say(ch.toUpperCase() + ' updated live. chef\'s kiss.');
      }, 600);
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (evalChannel(ch)) say(ch.toUpperCase() + ' reloaded.');
      }
    });
  }

  $('playBtn').addEventListener('click', (e) => { togglePlay(); e.currentTarget.blur(); });

  $('bpm').addEventListener('input', (e) => {
    engine.setBpm(+e.target.value);
    $('bpmVal').textContent = e.target.value;
  });

  $('cutoff').addEventListener('input', (e) => {
    const v = +e.target.value;
    engine.setCutoff(v);
    $('cutoffVal').textContent = v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : v;
  });

  $('delayAmt').addEventListener('input', (e) => {
    engine.setDelayAmt(+e.target.value / 100);
    $('delayVal').textContent = e.target.value + '%';
  });

  $('swing').addEventListener('input', (e) => {
    engine.setSwing(+e.target.value / 100);
    $('swingVal').textContent = e.target.value + '%';
  });

  document.querySelectorAll('.mute-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const ch = b.dataset.ch;
      const muted = !engine.muted[ch];
      engine.setMuted(ch, muted);
      b.classList.toggle('muted', muted);
      b.textContent = muted ? 'UNMUTE' : 'MUTE';
    });
  });

  document.querySelectorAll('.clear-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const ch = b.dataset.ch;
      $('code-' + ch).value = EMPTY_CODE[ch];
      evalChannel(ch);
      say(ch.toUpperCase() + ' emptied. a blank canvas. terrifying.');
    });
  });

  $('mutateBtn').addEventListener('click', mutateAll);
  $('airhornBtn').addEventListener('click', () => { engine.airhorn(); say('📯. no further questions.'); });
  $('sirenBtn').addEventListener('click', () => { engine.siren(); say('🚨 panic achieved.'); });

  // keyboard: space = play/stop, 1-8 = presets, a = airhorn, s = siren
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.key >= '1' && e.key <= '8') loadPreset(+e.key - 1);
    else if (e.key === 'a') engine.airhorn();
    else if (e.key === 's') engine.siren();
  });

  tickDots();
  loadPreset(0);
}

document.addEventListener('DOMContentLoaded', wire);
