// You can consider this global variables like state of one global singleton.

// setup
let gridSizeX;
let gridSizeY;
let step;
let size;
let context2d;

// state
let gridValues; // speed up: we won't relocate this memory
let gridCounters;
let gridNeighbors;
let candidates; // speed up: we will focused only on certain places

// constants
const fillDead = '#333';
const fillLife = '#8f8';

function reset() {
  let x;
  let y;
  gridValues.fill(0);
  gridCounters.fill(0);
  candidates = {};
  const w = context2d.canvas.clientWidth;
  const h = context2d.canvas.clientHeight;
  context2d.fillStyle = fillDead;
  context2d.fillRect(0, 0, w, h);
  context2d.fillStyle = '#000';
  if (step >= 10) {
    for (x = 0; x <= w; x += step) {
      context2d.fillRect(x, 0, 1, h);
    }
    for (y = 0; y <= h; y += step) {
      context2d.fillRect(0, y, w, 1);
    }
  } else {
    context2d.fillRect(0, 0, 1, h);
    context2d.fillRect(w - 1, 0, 1, h);
    context2d.fillRect(0, 0, w, 1);
    context2d.fillRect(0, h - 1, w, 1);
  }
}

function initGrid() { // have to be private?
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
  const gridSize = gridSizeX * gridSizeY;
  gridValues = Array(gridSize);
  gridCounters = Array(gridSize);
  gridNeighbors = Array(gridSize);
  const sx = gridSizeX - 1;
  const sy = gridSizeY - 1;
  for (y = 0; y < gridSizeY; y++) {
    for (x = 0; x < gridSizeX; x++) {
      a0 = x === 0 ? 0 : x - 1;
      a1 = x === sx ? x : x + 1;
      b0 = y === 0 ? 0 : y - 1;
      b1 = y === sy ? y : y + 1;
      na = [];
      for (b = b0; b <= b1; b++) {
        for (a = a0; a <= a1; a++) {
          if (!(a === x && b === y)) {
            na.push(a + gridSizeX * b);
          }
        }
      }
      gridNeighbors[x + gridSizeX * y] = na;
    }
  }
  reset();
}

function setupGrid(w, h, s) {
  step = s;
  gridSizeX = w;
  gridSizeY = h;
  let cw = gridSizeX * step + 1;
  let ch = gridSizeY * step + 1;
  if (step >= 3) {
    size = s - 1;
  } else {
    size = s;
    cw += 1;
    ch += 1;
  }
  const e = document.getElementById('grid');
  e.width = cw;
  e.height = ch;
  context2d = e.getContext('2d');
  initGrid();
}

function updateGridElement(i, v, dn) { // unsafe helper for private use only
  let j;
  let x;
  gridValues[i] = v;
  candidates[i] = undefined;
  const nn = gridNeighbors[i];
  for (j = 0; j < nn.length; j++) {
    x = nn[j];
    gridCounters[x] += dn;
    candidates[x] = undefined;
  }
}

function manualSetOnGrid(x, y, vOpt) {
  if (x < 0 || x >= gridSizeX || y < 0 || y >= gridSizeY) {
    return;
  }
  const t = x + gridSizeX * y;
  const invert = gridValues[t] ? 0 : 1;
  const v = vOpt === undefined ? invert : vOpt;
  if (v === gridValues[t]) {
    return;
  }
  updateGridElement(t, v, v === 0 ? -1 : 1);
  context2d.fillStyle = [fillDead, fillLife][v];
  context2d.fillRect(x * step + 1, y * step + 1, size, size);
}

function stepGrid() {
  let i;
  let k;
  let v;
  let n;
  let t;
  // step 1: analyze
  const letOff = [];
  const letOn = [];
  const keys = Object.keys(candidates); // simple for faster then forEach(f)
  for (i = 0; i < keys.length; i++) {
    k = keys[i];
    v = gridValues[k];
    n = gridCounters[k];
    if (v) {
      if (!(n === 2 || n === 3)) {
        letOff.push(k);
      }
    } else if (n === 3) {
      letOn.push(k);
    }
  }
  // step 2: update candidates, grid, canvas
  candidates = {};
  context2d.fillStyle = fillDead;
  for (i = 0; i < letOff.length; i++) {
    t = letOff[i];
    updateGridElement(t, 0, -1);
    context2d.fillRect((t % gridSizeX) * step + 1, Math.floor(t / gridSizeX) * step + 1, size, size);
  }
  context2d.fillStyle = fillLife;
  for (i = 0; i < letOn.length; i++) {
    t = letOn[i];
    updateGridElement(t, 1, 1);
    context2d.fillRect((t % gridSizeX) * step + 1, Math.floor(t / gridSizeX) * step + 1, size, size);
  }
  return letOff.length > 0 || letOn.length > 0;
}

function fillGrid(f) {
  reset();
  return f(gridSizeX, gridSizeY, (x, y) => manualSetOnGrid(x, y, 1));
}

// ----------------------------------------------------------------------

function fillSimpleMap(m) {
  return (w, h, s) => {
    let x;
    let y;
    const mw = m[0].length;
    const mh = m.length;
    const xo = Math.floor((w - mw) / 2);
    const yo = Math.floor((h - mh) / 2);
    for (y = 0; y < mh; y++) {
      for (x = 0; x < mw; x++) {
        if (m[y][x]) {
          s(x + xo, y + yo, 1);
        }
      }
    }
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
  for (i = 0; i < num.length; i++) {
    c = p[num.charAt(i)];
    for (j = 0; j < 5; j++) {
      m[j].push.apply(m[j], c[j]);
      if (i + 1 < num.length) {
        m[j].push(0);
      }
    }
  }
  return m;
}

const fillFunctions = [
  ['random', function random(w, h, s) {
    const di = Math.floor(w / 4);
    const dj = Math.floor(h / 4);
    for (let j = 0; j < h / 2; j++) {
      for (let i = 0; i < w / 2; i++) {
        if (Math.random() < 0.4) {
          s(i + di, j + dj);
        }
      }
    }
  }],
  ['glider', fillSimpleMap([
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ])],
  ['41140732', fillSimpleMap(buildDigitMap('41140732'))],
  ['90', fillSimpleMap(buildDigitMap('90'))],
  ['3207', fillSimpleMap(buildDigitMap('3207'))],
  ['94174', fillSimpleMap(buildDigitMap('94174'))],
  ['185598100297311043114', fillSimpleMap(buildDigitMap('185598100297311043114'))],
  ['1415073111111103975114', fillSimpleMap(buildDigitMap('1415073111111103975114'))],
];

function lifeMap(w, h, s) {
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
  for (y = 0; y < 5; y++) {
    for (x = 0; x < 17; x++) {
      if (m[y][x]) {
        for (j = 0; j < cs; j++) {
          z = y * cs + j;
          p = ((z / cs / 5) * 2 - 1) ** 2 * 0.4 + 0.2;
          for (i = 0; i < cs; i++) {
            if (Math.random() < p) {
              s(cxo + x * cs + i, cyo + y * cs + j, 1);
            }
          }
        }
      }
    }
  }
}

// ----------------------------------------------------------------------

$(() => {
  // TODO make an object for ctl?
  let timerId;
  let pixelWidth;
  let pixelHeight;
  let pixelStep;
  let hold = false;
  function go() {
    let c = true;
    if (!hold) {
      c = stepGrid();
    }
    if (c) {
      timerId = setTimeout(go, 0);
    } else {
      timerId = undefined;
    }
  }
  function stop() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  }
  function updateGeometry() {
    stop();
    setupGrid(Math.floor((pixelWidth - 2) / pixelStep) - 1, Math.floor((pixelHeight - 2) / pixelStep) - 1, pixelStep);
  }
  function mkResizer(fw, fh) {
    return function tmp() {
      pixelWidth = ($(window).width() - 15) * fw; // Hack to eliminate vertical scroll width
      pixelHeight = $(window).height() * fh;
      updateGeometry();
    };
  }
  function mkCellReizer(s) {
    return function tmp() {
      pixelStep = s;
      updateGeometry();
    };
  }
  function fill(m) {
    stop();
    fillGrid(m);
  }
  $('#ctl_start').click(() => {
    hold = false;
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    go();
  });
  $('#ctl_stop').click(stop);
  $('#ctl_step').click(stepGrid);
  $('#ctl_p_clear').click(() => { fill(() => {}); });

  $('#ctl_fld_small').click(mkResizer(1, 0.7));
  $('#ctl_fld_full_screen').click(mkResizer(1, 1));
  $('#ctl_fld_double_screen').click(mkResizer(2, 2));

  $('#ctl_p_life').click(() => { fill(lifeMap); });
  const ee = [];
  for (let i = 0; i < fillFunctions.length; i++) {
    const p = fillFunctions[i];
    const e = $('<button>').text(p[0]).click(() => { fill(p[1]); });
    ee.push(' ', e);
  }
  $('#ctl_p_life').after(ee);

  $('#ctl_cell_1').click(mkCellReizer(1));
  $('#ctl_cell_2').click(mkCellReizer(2));
  $('#ctl_cell_3').click(mkCellReizer(3));
  $('#ctl_cell_5').click(mkCellReizer(5));
  $('#ctl_cell_7').click(mkCellReizer(7));
  $('#ctl_cell_10').click(mkCellReizer(10));
  $('#ctl_cell_15').click(mkCellReizer(15));

  $('#grid').mousemove((e) => {
    if (hold) {
      manualSetOnGrid(Math.floor((e.pageX - 1) / pixelStep), Math.floor((e.pageY - 1) / pixelStep), 1);
    }
  }).mousedown(() => { hold = true; })
    .mouseup(() => { hold = false; })
    .mouseout(() => { hold = false; })
    .mouseleave(() => { hold = false; })
    .click((e) => {
      manualSetOnGrid(Math.floor((e.pageX - 1) / pixelStep), Math.floor((e.pageY - 1) / pixelStep));
    });

  pixelStep = 2;
  mkResizer(1, 0.7)();
  fillGrid(lifeMap);
  timerId = setTimeout(go, 1200);
});
