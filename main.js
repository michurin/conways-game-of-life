class LGame {
  constructor() {
    // public
    this.width = undefined;
    this.height = undefined;
    // private
    this.values = undefined;
    this.counters = undefined;
    this.neighbors = undefined;
    this.candidates = undefined;
  }

  reset() {
    this.values.fill(0);
    this.counters.fill(0);
    this.candidates = {};
  }

  init() {
    let x;
    let y;
    let a;
    let b;
    let a0;
    let b0;
    let a1;
    let b1;
    let na;
    // setup grid
    const s = this.width * this.height;
    this.values = Array(s);
    this.counters = Array(s);
    this.neighbors = Array(s);
    const sx = this.width - 1;
    const sy = this.height - 1;
    for (y = 0; y < this.height; ++y) {
      for (x = 0; x < this.width; ++x) {
        a0 = x === 0 ? 0 : x - 1;
        a1 = x === sx ? x : x + 1;
        b0 = y === 0 ? 0 : y - 1;
        b1 = y === sy ? y : y + 1;
        na = [];
        for (b = b0; b <= b1; ++b) {
          for (a = a0; a <= a1; ++a) {
            if (!(a === x && b === y)) {
              na.push(a + this.width * b);
            }
          }
        }
        this.neighbors[x + this.width * y] = na;
      }
    }
    this.reset();
  }

  updateElement(i, v, dn) { // unsafe helper for private use only
    let j;
    let x;
    this.values[i] = v;
    this.candidates[i] = undefined;
    const nn = this.neighbors[i];
    for (j = 0; j < nn.length; ++j) {
      x = nn[j];
      this.counters[x] += dn;
      this.candidates[x] = undefined;
    }
  }

  inverse(x, y) {
    const t = x + this.width * y;
    const v = this.values[t] ? 0 : 1;
    this.updateElement(t, v, v === 0 ? -1 : 1);
    return v;
  }

  step() {
    let i;
    let k;
    let v;
    let n;
    // step 1: analyze
    const letOff = [];
    const letOn = [];
    const keys = Object.keys(this.candidates); // simple for faster then forEach(f)
    for (i = 0; i < keys.length; ++i) {
      k = keys[i];
      v = this.values[k];
      n = this.counters[k];
      if (v) {
        if (!(n === 2 || n === 3)) {
          letOff.push(k);
        }
      } else if (n === 3) {
        letOn.push(k);
      }
    }
    // step 2: update candidates, grid, canvas
    this.candidates = {};
    for (i = 0; i < letOff.length; ++i) {
      this.updateElement(letOff[i], 0, -1);
    }
    for (i = 0; i < letOn.length; ++i) {
      this.updateElement(letOn[i], 1, 1);
    }
    return [this.width, letOff, letOn];
  }
}

// ----------------------------------------------------------------------

function fillSimpleMap(m) {
  return (w, h) => {
    let x;
    let y;
    const s = [];
    const mw = m[0].length;
    const mh = m.length;
    const xo = Math.floor((w - mw) / 2);
    const yo = Math.floor((h - mh) / 2);
    for (y = 0; y < mh; ++y) {
      for (x = 0; x < mw; ++x) {
        if (m[y][x]) {
          s.push({ x: x + xo, y: y + yo });
        }
      }
    }
    return s;
  };
}

function buildDigitMap(num) { // http://www.radicaleye.com/DRH/digits.html
  const p = {
    0: [[1, 1, 1], [1, 0, 1], [1, 0, 1], [1, 0, 1], [1, 1, 1]],
    1: [[1], [1], [1], [1], [1]],
    2: [[1, 1, 1], [0, 0, 1], [1, 1, 1], [1, 0, 0], [1, 1, 1]],
    3: [[1, 1, 1], [0, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
    4: [[1, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]],
    5: [[1, 1, 1], [1, 0, 0], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
    6: [[1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1], [1, 1, 1]],
    7: [[1, 1, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]],
    8: [[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1]],
    9: [[1, 1, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]],
  };
  let i;
  let j;
  let c;
  const m = [[], [], [], [], []];
  for (i = 0; i < num.length; ++i) {
    c = p[num.charAt(i)];
    for (j = 0; j < 5; ++j) {
      m[j].push.apply(m[j], c[j]);
      if (i + 1 < num.length) {
        m[j].push(0);
      }
    }
  }
  return m;
}

const fillFunctions = [
  ['random', (w, h) => {
    const s = [];
    const di = Math.floor(w / 4);
    const dj = Math.floor(h / 4);
    for (let j = 0; j < h / 2; ++j) {
      for (let i = 0; i < w / 2; ++i) {
        if (Math.random() < 0.4) {
          s.push({ x: i + di, y: j + dj });
        }
      }
    }
    return s;
  }],
  ['benchmark', (w, h) => {
    const s = [];
    for (let j = 1; j < h - 1; j += 4) {
      for (let i = 1; i < w - 1; i += 4) {
        s.push({ x: i, y: j - 1 });
        s.push({ x: i, y: j });
        s.push({ x: i, y: j + 1 });
      }
    }
    return s;
  }],
  ['glider', fillSimpleMap([
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ])],
  ['F', fillSimpleMap([
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ])],
  ['41140732', fillSimpleMap(buildDigitMap('41140732'))],
  ['90', fillSimpleMap(buildDigitMap('90'))],
  ['3207', fillSimpleMap(buildDigitMap('3207'))],
  ['94174', fillSimpleMap(buildDigitMap('94174'))],
  ['185598100297311043114', fillSimpleMap(buildDigitMap('185598100297311043114'))],
  ['1415073111111103975114', fillSimpleMap(buildDigitMap('1415073111111103975114'))],
];

function lifeMap(w, h) {
  const s = [];
  const m = [ // 5x17
    [1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  ];
  const a = Math.floor(w / 23);
  const b = Math.floor(h / 9);
  const cs = a < b ? a : b;
  const cw = cs * 17;
  const ch = cs * 5;
  const cxo = Math.floor((w - cw) / 2);
  const cyo = Math.floor((h - ch) / 2);
  let x;
  let y;
  let i;
  let j;
  let z;
  let p;
  for (y = 0; y < 5; ++y) {
    for (x = 0; x < 17; ++x) {
      if (m[y][x]) {
        for (j = 0; j < cs; ++j) {
          z = y * cs + j;
          p = Math.pow(((z / cs / 5) * 2 - 1), 2) * 0.4 + 0.2;
          for (i = 0; i < cs; ++i) {
            if (Math.random() < p) {
              s.push({ x: cxo + x * cs + i, y: cyo + y * cs + j });
            }
          }
        }
      }
    }
  }
  return s;
}

// ----------------------------------------------------------------------

class Canvas {
  constructor(game) {
    // public
    this.width = 100;
    this.height = 100;
    this.cellStep = 2;
    // private
    this.cellSize = 2;
    this.bdColor = '#000';
    this.bgColor = '#222';
    this.fgColor = '#6f6';
    this.canvas = $('#grid')[0];
    this.context = this.canvas.getContext('2d');
    this.prev = '';
    this.game = game;
  }

  reset() {
    this.game.reset();
    const pw = this.canvas.width;
    const ph = this.canvas.height;
    const w = this.game.width;
    const h = this.game.height;
    this.context.fillStyle = this.bgColor;
    this.context.fillRect(0, 0, pw, ph);
    this.context.fillStyle = this.bdColor;
    this.context.fillRect(0, 0, pw, 1);
    this.context.fillRect(0, ph - 1, pw, 1);
    this.context.fillRect(0, 0, 1, ph);
    this.context.fillRect(pw - 1, 0, 1, ph);
    if (this.cellStep > 7) {
      for (let i = 1; i < w; ++i) {
        this.context.fillRect(i * this.cellStep, 0, 1, ph);
      }
      for (let j = 1; j < h; ++j) {
        this.context.fillRect(0, j * this.cellStep, pw, 1);
      }
    }
  }

  update() {
    let extra = 2;
    this.cellSize = this.cellStep;
    if (this.cellStep > 2) {
      extra = 1;
      this.cellSize = this.cellStep - 1;
    }
    const w = Math.floor((this.width - extra) / this.cellStep);
    const h = Math.floor((this.height - extra) / this.cellStep);
    //
    this.game.width = w;
    this.game.height = h;
    this.game.init();
    //
    const pw = w * this.cellStep + extra;
    const ph = h * this.cellStep + extra;
    this.canvas.width = pw;
    this.canvas.height = ph;
    this.context = this.canvas.getContext('2d');
    this.reset();
  }

  touch(x, y) {
    const a = Math.floor(x / this.cellStep);
    const b = Math.floor(y / this.cellStep);
    const hash = a + ':' + b;
    if (hash === this.prev) {
      return;
    }
    this.prev = hash;
    const v = this.game.inverse(a, b);
    this.context.fillStyle = [this.bgColor, this.fgColor][v];
    this.context.fillRect(a * this.cellStep + 1, b * this.cellStep + 1, this.cellSize, this.cellSize);
  }

  touchReset() {
    this.prev = '';
  }

  step() {
    let i;
    const t1 = new Date();
    const [w, off, on] = this.game.step();
    const t2 = new Date();
    this.context.fillStyle = this.bgColor;
    for (i = 0; i < off.length; ++i) {
      const t = off[i];
      this.context.fillRect((t % w) * this.cellStep + 1, Math.floor(t / w) * this.cellStep + 1, this.cellSize, this.cellSize);
    }
    this.context.fillStyle = this.fgColor;
    for (i = 0; i < on.length; ++i) {
      const t = on[i];
      this.context.fillRect((t % w) * this.cellStep + 1, Math.floor(t / w) * this.cellStep + 1, this.cellSize, this.cellSize);
    }
    const t3 = new Date();
    return {
      updated: off.length + on.length,
      calcTime: t2 - t1,
      drawTime: t3 - t2,
    };
  }

  fill(f) {
    this.reset();
    this.context.fillStyle = this.fgColor;
    f(this.game.width, this.game.height).forEach((v) => {
      this.game.inverse(v.x, v.y);
      this.context.fillRect(v.x * this.cellStep + 1, v.y * this.cellStep + 1, this.cellSize, this.cellSize);
    });
  }
}

class Runner {
  constructor(canvas) {
    this.canvas = canvas;
    this.timerId = undefined;
    // public
    this.statFrames = 0;
    this.statUpdated = 0;
    this.statCalcTime = 0;
    this.statDrawTime = 0;
  }

  step() {
    const res = this.canvas.step();
    this.statFrames += 1;
    this.statUpdated += res.updated;
    this.statCalcTime += res.calcTime;
    this.statDrawTime += res.drawTime;
    // TODO account stat
    if (res.updated > 0) {
      this.timerId = requestAnimationFrame(() => { this.step(); });
    }
  }

  run() {
    this.stop();
    this.step();
  }

  stop() {
    cancelAnimationFrame(this.timerId);
  }
}

$(() => {
  const g = new Canvas(new LGame());
  g.height = $(window).height() * 0.7;
  g.width = $(window).width() - 15; // scroll
  g.cellStep = 2;
  g.update();
  g.fill(lifeMap);
  const r = new Runner(g);

  setInterval(() => {
    $('#stat').text('FPS: ' + r.statFrames + ' T: ' + (r.statCalcTime / r.statFrames) + ' / ' + (r.statDrawTime / r.statFrames) + 'ms');
    r.statFrames = 0;
    r.statUpdated = 0; // TODO show updated
    r.statCalcTime = 0;
    r.statDrawTime = 0;
  }, 1000);

  $('#grid').on({
    mousedown: (e) => {
      r.stop();
      g.touch(e.pageX, e.pageY, false);
    },
    mouseup: () => {
      g.touchReset();
    },
    mousemove: (e) => {
      if (e.buttons > 0) {
        r.stop();
        g.touch(e.pageX, e.pageY, true);
      }
    },
  });

  $('#ctl_start').click(() => { r.run(); });
  $('#ctl_stop').click(() => { r.stop(); });
  $('#ctl_step').click(() => { r.stop(); g.step(); });
  $('#ctl_clear').click(() => { r.stop(); g.reset(); });

  $('[data-size-x]').each((n, v) => {
    const e = $(v);
    const fx = parseFloat(e.data('size-x'));
    const fy = parseFloat(e.data('size-y'));
    e.click(() => {
      r.stop();
      g.height = $(window).height() * fy;
      g.width = $(window).width() * fx - 15; // scroll
      g.update();
    });
  });
  $('[data-cell-size]').each((n, v) => {
    const e = $(v);
    const s = parseInt(e.data('cell-size'), 10);
    e.click(() => {
      r.stop();
      g.cellStep = s;
      g.update();
    });
  });
  $('#ctl_p_life').click(() => { r.stop(); g.fill(lifeMap); });
  const ee = [];
  for (let i = 0; i < fillFunctions.length; ++i) {
    const p = fillFunctions[i];
    const e = $('<button>').text(p[0]).click(() => {
      r.stop();
      g.fill(p[1]);
    });
    ee.push(' ', e);
  }
  $('#ctl_p_life').after(ee);
});
