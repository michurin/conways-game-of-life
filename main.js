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
    if (x < 0 || x >= this.widht || y < 0 || y >= this.height) {
      return 0; // Hmm.. Value outside the field. There is not good result
    }
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

class Canvas {
  constructor(game, colorMgr) {
    // public
    this.width = 100;
    this.height = 100;
    this.cellStep = 2;
    // private
    this.colorMgr = colorMgr;
    this.cellSize = 2;
    this.bgColor = '#222';
    this.fgColor = '#6f6';
    [this.canvas] = $('#grid');
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
    if (this.cellStep > 7) {
      this.context.fillStyle = '#000';
      for (let i = 1; i < w; ++i) {
        this.context.fillRect(i * this.cellStep, 0, 1, ph);
      }
      for (let i = 1; i < h; ++i) {
        this.context.fillRect(0, i * this.cellStep, pw, 1);
      }
    }
    if (this.cellStep > 4) {
      this.context.fillStyle = '#555';
      for (let i = Math.floor((w % 10) / 2); i < w; i += 10) {
        this.context.fillRect(i * this.cellStep, 1, 1, ph - 2);
      }
      for (let i = Math.floor((h % 10) / 2); i < h; i += 10) {
        this.context.fillRect(1, i * this.cellStep, pw - 2, 1);
      }
    }
    this.context.fillStyle = '#000';
    this.context.fillRect(0, 0, pw, 1);
    this.context.fillRect(0, ph - 1, pw, 1);
    this.context.fillRect(0, 0, 1, ph);
    this.context.fillRect(pw - 1, 0, 1, ph);
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
    const a = Math.floor((x - 1) / this.cellStep); // -1 because borders are drawn on canvas
    const b = Math.floor((y - 1) / this.cellStep);
    const hash = `${a}:${b}`;
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
    const t1 = performance.now();
    const [w, off, on] = this.game.step();
    const t2 = performance.now();
    this.context.fillStyle = this.colorMgr.setGetAndShift() || this.bgColor;
    for (i = 0; i < off.length; ++i) {
      const t = off[i];
      this.context.fillRect((t % w) * this.cellStep + 1, Math.floor(t / w) * this.cellStep + 1, this.cellSize, this.cellSize);
    }
    this.context.fillStyle = this.fgColor;
    for (i = 0; i < on.length; ++i) {
      const t = on[i];
      this.context.fillRect((t % w) * this.cellStep + 1, Math.floor(t / w) * this.cellStep + 1, this.cellSize, this.cellSize);
    }
    const t3 = performance.now();
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
      if (this.game.inverse(v.x, v.y) !== 1) {
        console.warn('Bad example definition? Or area too narrow?');
      }
      this.context.fillRect(v.x * this.cellStep + 1, v.y * this.cellStep + 1, this.cellSize, this.cellSize);
    });
  }
}

class ColorMgr {
  constructor() {
    this.mode = 0;
    this.generation = -1;
    const p = [];
    for (let t = 0; t < 1; t += 0.01) {
      p.push(`rgb(48,${Math.floor(24 * (Math.sin(t * 2 * Math.PI) + 3))},48)`);
    }
    this.shames = [
      [undefined],
      ['#343'],
      p,
    ];
  }

  setMode(m) {
    this.mode = m;
    this.generation = -1;
  }

  setGetAndShift() { // not very good idea to mix getter and mutator, but let's keep this class simple
    const s = this.shames[this.mode];
    this.generation = (this.generation + 1) % s.length;
    return s[this.generation];
  }
}

const schedulers = [
  {
    name: 'native animation',
    title: 'sync with your monitor, usually 60fps (requestAnimationFrame)',
    f: (f) => {
      const s = requestAnimationFrame(f);
      return () => cancelAnimationFrame(s);
    },
  },
  {
    name: 'on idle',
    title: 'requestIdleCallback',
    f: (f) => {
      const s = requestIdleCallback(f);
      return () => cancelIdleCallback(s);
    },
  },
  {
    name: 'sleep 0',
    title: 'setTimeout(f, 0) (throttled in modern browsers)',
    f: (f) => {
      const s = setTimeout(f, 0);
      return () => clearTimeout(s);
    },
  },
  {
    name: 'sleep 0.1s',
    title: 'setTimeout(f, 100)',
    f: (f) => {
      const s = setTimeout(f, 100);
      return () => clearTimeout(s);
    },
  },
  {
    name: 'sleep 1s',
    title: 'setTimeout(f, 1000)',
    f: (f) => {
      const s = setTimeout(f, 1000);
      return () => clearTimeout(s);
    },
  },
];

class Runner {
  constructor(canvas) {
    this.canvas = canvas;
    this.canceler = undefined;
    // public
    this.statFrames = 0;
    this.statUpdated = 0;
    this.statCalcTime = 0;
    this.statDrawTime = 0;
    this.scheduler = schedulers[0].f;
  }

  step() { // private
    const res = this.canvas.step();
    this.statFrames += 1;
    this.statUpdated += res.updated;
    this.statCalcTime += res.calcTime;
    this.statDrawTime += res.drawTime;
    if (res.updated > 0) {
      this.canceler = this.scheduler(() => { this.step(); });
    }
  }

  run() {
    this.stop();
    this.step();
  }

  stop() {
    if (this.canceler) {
      this.canceler();
      this.canceler = undefined;
    }
  }
}

$(() => {
  const cmgr = new ColorMgr();
  const g = new Canvas(new LGame(), cmgr);
  g.height = $(window).height() * 0.7;
  g.width = $(window).width() - 15; // scroll bar (hack)
  g.cellStep = 2;
  g.update();
  g.fill(lifeMap);
  const r = new Runner(g);
  (() => { // tricky cancelable delayed run
    const s = setTimeout(() => {
      r.run();
    }, 2000);
    r.canceler = () => clearTimeout(s); // oh. Set private attribute
  })();

  setInterval(() => {
    // TODO: just setInterval is oversimplifications: we have to align measurement interval to drawing intervals
    $('#stat').html( // TODO: layout and legend, divisions by zero
      // eslint-disable-next-line max-len
      `FPS: ${r.statFrames} CPU (calc/draw/idle): ${r.statCalcTime.toFixed(2)} / ${r.statDrawTime.toFixed(2)} / ${Math.max(0, Math.min(1000, (1000 - r.statCalcTime - r.statDrawTime))).toFixed(2)}ms/s <div style="display: inline-block; background-color: #777; width: 100px; height: 10px; position: relative"><div style="position: absolute; top: 0; left: ${Math.floor(r.statCalcTime / 10)}px; width: ${Math.floor(r.statDrawTime / 10)}px; height: 10px; background-color: #000;"></div></div> AvgTime (calc/draw): ${((r.statCalcTime / r.statFrames) || 0).toFixed(2)} / ${((r.statDrawTime / r.statFrames) || 0).toFixed(2)}ms/frame UPS: ${r.statUpdated} TPU: ${((1000 * (r.statCalcTime / r.statUpdated)) || 0).toFixed(3)}&micro;s`
    );
    r.statFrames = 0;
    r.statUpdated = 0;
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

  $('[data-tail-mode]').each((_, v) => {
    const e = $(v);
    const m = parseInt(e.data('tail-mode'), 10);
    e.click(() => {
      cmgr.setMode(m);
    });
  });
  $('[data-size-x]').each((_, v) => {
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
  $('[data-cell-size]').each((_, v) => {
    const e = $(v);
    const s = parseInt(e.data('cell-size'), 10);
    e.click(() => {
      r.stop();
      g.cellStep = s;
      g.update();
    });
  });
  $('#ctl_p_life').click(() => { r.stop(); g.fill(lifeMap); });

  (() => {
    const ee = [];
    fillFunctions.forEach((p) => {
      const e = $('<button>').text(p[0]).click(() => {
        r.stop();
        g.fill(p[1]);
      });
      ee.push(' ', e);
    });
    $('#ctl_p_life').after(ee);
  })();

  (() => {
    const ee = [];
    schedulers.forEach((t) => {
      ee.push(' ', $('<button>').text(t.name).prop('title', t.title).click(() => {
        r.scheduler = t.f;
      }));
    });
    $('#section-delay').after(ee);
  })();

  (() => {
    const hotKeys = {};
    $('[data-hot-key]').each((_, v) => {
      const e = $(v);
      const c = e.data('hot-key');
      e.prop('title', `(${c.toUpperCase()})`);
      const k = c.toLowerCase();
      if (c[k]) {
        throw new Error(`Hot key binding conflict on ${k}`);
      }
      hotKeys[c.toLowerCase()] = e;
    });
    $(window).keypress((ev) => {
      const e = hotKeys[String.fromCharCode(ev.which).toLowerCase()];
      if (e) {
        e.click();
      }
    });
  })();

  window.onbeforeunload = () => 'Are you sure you want to navigate away?';
});
