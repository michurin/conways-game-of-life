// helpers to decode examples
// has to be loaded before examples.js

function fillSimpleMap(p, m) {
  return (w, h) => {
    let x;
    let y;
    const o = [];
    const mw = m[0].length; // map width
    const mh = m.length; // map height
    const rx = w - mw; // room x
    const ry = h - mh; // room y
    const rs = rx < ry ? rx : ry; // room square
    const sx = Math.floor((rx - rs) / 2); // square corner x
    const sy = Math.floor((ry - rs) / 2); // square corner y
    let xo = Math.floor(rx / 2); // default: center
    let yo = Math.floor(ry / 2);
    if (p.top !== undefined) {
      yo = p.top;
      if (p.sq) {
        yo += sy;
      }
    }
    if (p.bottom !== undefined) {
      yo = ry - p.bottom;
      if (p.sq) {
        yo -= sy;
      }
    }
    if (p.left !== undefined) {
      xo = p.left;
      if (p.sq) {
        xo += sx;
      }
    }
    if (p.right !== undefined) {
      xo = rx - p.right;
      if (p.sq) {
        xo -= sx;
      }
    }
    for (y = 0; y < mh; ++y) {
      for (x = 0; x < mw; ++x) {
        if (m[y][x]) {
          o.push({ x: x + xo, y: y + yo });
        }
      }
    }
    return o;
  };
}

function rleDecode(e) {
  let x = '';
  e.split(/\n/).forEach((l) => {
    const v = l.trim();
    if (!(v === '' || v.includes('#') || v.includes('='))) {
      x += v;
    }
  });
  let n = 1;
  const p = [];
  x.match(/(\d+|\D)/gi).forEach((c) => {
    const d = parseInt(c, 10);
    if (d) {
      n = d;
    } else {
      for (let i = 0; i < n; ++i) {
        p.push(c);
      }
      n = 1;
    }
  });
  let q = [];
  const r = [];
  p.forEach((c) => {
    if (c === 'o') {
      q.push(1);
    } else if (c === 'b') {
      q.push(0);
    } else {
      r.push(q);
      q = [];
    }
  });
  let w = 0;
  r.forEach((a) => {
    w = w > a.length ? w : a.length;
  });
  r.forEach((a) => {
    while (a.length < w) {
      a.push(0);
    }
  });
  return r;
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
      m[j].push(...c[j]);
      if (i + 1 < num.length) {
        m[j].push(0);
      }
    }
  }
  return m;
}

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
