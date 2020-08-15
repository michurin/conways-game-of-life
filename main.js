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

// ----------------------------------------------------------------------

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
  ['glider', fillSimpleMap({ top: 0, left: 0, sq: true }, [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ])],
  ['F', fillSimpleMap({}, [
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ])],
  ['pre-pulsar shuttle 29 v3', fillSimpleMap({}, rleDecode(`
#n pre-pulsar shuttle 29 v3
#c a period 29 shuttle oscillator in which four pre-pulsars are hassled.
#c www.conwaylife.com/wiki/index.php?title=pre-pulsar_shuttle_29
x = 39, y = 39, rule = b3/s23
16b2o3b2o16b$15bo2bobo2bo15b$11b2o3b2o3b2o3b2o11b$11bo15bo11b$8b2obo
15bob2o8b$7bobob2o13b2obobo7b$7bobo19bobo7b$5b2o2bo19bo2b2o5b$4bo4b2o
17b2o4bo4b$4b5o6b3o3b3o6b5o4b$8bo6bobo3bobo6bo8b$2b4o9b3o3b3o9b4o2b$2b
o2bo27bo2bo2b3$bo7b3o15b3o7bob$obo6bobo15bobo6bobo$obo6b3o15b3o6bobo$b
o35bob2$bo35bob$obo6b3o15b3o6bobo$obo6bobo15bobo6bobo$bo7b3o15b3o7bob
3$2bo2bo27bo2bo2b$2b4o9b3o3b3o9b4o2b$8bo6bobo3bobo6bo8b$4b5o6b3o3b3o6b
5o4b$4bo4b2o17b2o4bo4b$5b2o2bo19bo2b2o5b$7bobo19bobo7b$7bobob2o13b2obo
bo7b$8b2obo15bob2o8b$11bo15bo11b$11b2o3b2o3b2o3b2o11b$15bo2bobo2bo15b$
16b2o3b2o!
`))],
  ['Pre-pulsar shuttle 58', fillSimpleMap({}, rleDecode(`
#N Pre-pulsar shuttle 58
#O Tanner Jacobi
#C Period-58 oscillator with a 50% smaller population
#C than the previous Snark-based record.
#C www.conwaylife.com/wiki/Pre-pulsar_shuttle_58
x = 25, y = 27, rule = B3/S23
2b2obo13bob2o$2bob2o13b2obo2$3b3o13b3o$2bo2bo13bo2bo$2b2o17b2o2$2b4o
13b4o$2bo2bo13bo2bo$3bo5bo5bo5bo$3o5b3o3b3o5b3o$o23bo4$o23bo$3o19b3o$
3bo17bo$2bo2bo13bo2bo$2b4o13b4o2$2b2o17b2o$2bo2bo13bo2bo$3b3o13b3o2$2b
ob2o13b2obo$2b2obo13bob2o!
`))],
  ['P15 pre-pulsar spaceship', fillSimpleMap({ bottom: 2 }, rleDecode(`
#N P15 pre-pulsar spaceship
#O Noam Elkies
#C A period-15 c/5 orthogonal spaceship
x = 61, y = 43, rule = b3/s23
3b3o10b3o23b3o10b3o3b$4bobo8bobo25bobo8bobo4b$6bo8bo29bo8bo6b$bob5o6b
5obo19bob5o6b5obob$bob2o3b2o2b2o3b2obo19bob2o3b2o2b2o3b2obob$2o5b3o2b
3o5b2o17b2o5b3o2b3o5b2o$5b2ob2o2b2ob2o27b2ob2o2b2ob2o5b2$4bo12bo25bo
12bo4b$5b3o6b3o27b3o6b3o5b$4b4o6b4o25b4o6b4o4b$3b2o12b2o23b2o12b2o3b$
4bo12bo25bo12bo4b$2b3o12b3o21b3o12b3o2b$2bo16bo21bo16bo2b$5bo10bo27bo
10bo5b$3bobo10bobo23bobo10bobo3b$2bo3b2o6b2o3bo21bo3b2o6b2o3bo2b$3bo5b
o2bo5bo23bo5bo2bo5bo3b$9bo2bo35bo2bo9b$bob2o4bo2bo4b2obo19bob2o4bo2bo
4b2obob$bo3b3obo2bob3o3bo19bo3b3obo2bob3o3bob$2bo6bo2bo6bo21bo6bo2bo6b
o2b$bo2b2o3bo2bo3b2o2bo19bo2b2o3bo2bo3b2o2bob$bo2b2obobo2bobob2o2bo19b
o2b2obobo2bobob2o2bob$5bo2bo4bo2bo27bo2bo4bo2bo5b$6bobo4bobo29bobo4bob
o6b$27bo5bo27b$4b2obob4obob2o9bo5bo9b2obob4obob2o4b$10b2o14bobo3bobo
14b2o10b$2bob2o10b2obo7bo5bo7bob2o10b2obo2b$2o2bo3b2o2b2o3bo2b2o5bo5bo
5b2o2bo3b2o2b2o3bo2b2o$b2obo12bob2o19b2obo12bob2ob$3b2obo8bob2o23b2obo
8bob2o3b$4bo2bo6bo2bo25bo2bo6bo2bo4b$b2o2bo2bo4bo2bo2b2o4b2o7b2o4b2o2b
o2bo4bo2bo2b2ob$bo5b2o4b2o5bo5bobo3bobo5bo5b2o4b2o5bob$b3o3bo6bo3b3o6b
o5bo6b3o3bo6bo3b3ob$3b4o8b4o23b4o8b4o3b$4bo2bo6bo2bo25bo2bo6bo2bo4b$4b
o12bo25bo12bo4b$4bob2o6b2obo25bob2o6b2obo4b$5bo10bo27bo10bo!`))],
  ['line-puffer', fillSimpleMap({ bottom: 50 }, rleDecode(`
#n line-puffer
#o tim coe
#c a c/2 orthogonal line-puffer of width 76
x = 156, y = 32, rule = b3/s23
34b3o27b3o13b3o27b3o43b$33bo3bo25bo3bo11bo3bo25bo3bo42b$32b2o4bo11bo
11bo4b2o9b2o4bo11bo11bo4b2o41b$31bobob2ob2o3b4ob2ob2ob4o3b2ob2obobo7bo
bob2ob2o3b4ob2ob2ob4o3b2ob2obobo40b$30b2obo4bob2ob4o7b4ob2obo4bob2o5b
2obo4bob2ob4o7b4ob2obo4bob2o39b$29bo4bo3bo4bo2b2obobob2o2bo4bo3bo4bo3b
o4bo3bo4bo2b2obobob2o2bo4bo3bo4bo38b$6bo17bo16bo4bo7bo4bo27bo4bo7bo4bo
25bo17bo6b$5b3o15b3o3b2o7b2o6bo7bo6b2o7b2o3b2o7b2o6bo7bo6b2o7b2o12b3o
15b3o5b$3b2ob3o13b3ob2o100b2ob3o13b3ob2o3b$4bo2bob2o4bo4b2obo2bo18b2o
7b2o35b2o7b2o27bo2bob2o4bo4b2obo2bo4b$b2obo4bobob2ob2obobo4bob2o17bo5b
o39bo5bo26b2obo4bobob2ob2obobo4bob2ob$b2obobo2bobo7bobo2bobob2o15bo2bo
3bo2bo35bo2bo3bo2bo24b2obobo2bobo7bobo2bobob2ob$bo8b3obobob3o8bo16bo2b
obo2bo37bo2bobo2bo25bo8b3obobob3o8bob$2o7b2o9b2o7b3obo15bobo43bobo24bo
b3o7b2o9b2o7b2o$33b2o12bobobobo39bobobobo21b2o33b$31b2obo11b2obobob2o
37b2obobob2o20bob2o31b$34b2o9bo3bobo3bo35bo3bobo3bo18b2o34b$33bo88bo
33b$35b3o7b2ob2ob2ob2o35b2ob2ob2ob2o16b3o35b$7b3o15b3o9b2o78b2o9b3o15b
3o7b$6bo3bo13bo3bo9bo7bo3bo3bo37bo3bo3bo16bo9bo3bo13bo3bo6b$5b2o4bo11b
o4b2o8b2o6bo3bo3bo7b3o9b3o9b3o3bo3bo3bo4b3o8b2o8b2o4bo11bo4b2o5b$4bobo
b2ob2o3b3o3b2ob2obobo8bo21bo3bo7bo3bo7bo3bo14bo3bo7bo8bobob2ob2o3b3o3b
2ob2obobo4b$3b2obo4bob2ob3ob2obo4bob2o6bobo5b2o5b2o5b2o3b2o5b2o3b2o5b
2o3b2o5b2o5b2o3b2o5bobo6b2obo4bob2ob3ob2obo4bob2o3b$2bo4bo3bo4bobo4bo
3bo4bo6b3o3b4o3b4o3b2obobob2o3b2obobob2o3b2obobob2o3b4o3b2obobob2o3b3o
6bo4bo3bo4bobo4bo3bo4bo2b$14bo5bo20b2ob2o2b2ob2o2b2ob2ob2ob2ob2ob2ob2o
b2ob2ob2ob2ob2ob2ob2o2b2ob2ob2ob2ob2ob2o20bo5bo14b$2b2o7b2o9b2o7b2ob3o
5bobo4bobo4bobo3bobo3bobo3bobo3bobo3bobo3bobo4bobo3bobo3bobo5b3ob2o7b
2o9b2o7b2o2b$36bo82bo36b$34bo6b2ob2o2b2ob2o2b2ob2ob2ob2ob2ob2ob2ob2ob
2ob2ob2ob2ob2ob2o2b2ob2ob2ob2ob2ob2o6bo34b$34bob2o80b2obo34b$39b78o39b
$38bo78bo!
`))],
  ['light speed oscillator 3', fillSimpleMap({}, rleDecode(`
#n light speed oscillator 3
#o josh ball
#c a period 5 extensible oscillator.
#c www.conwaylife.com/wiki/light_speed_oscillator_3
x = 73, y = 73, rule = b3/s23
61bo11b$59b3o11b$56bobo3b2o9b$54b3ob4o2bob2o5b$53bo7bob2obo6b$52bob5ob
o2bo2bo2bo3b$14b2o36b2o3bob2o2bobob3o3b$14b2o34b2o3bo8bobo6b$49bobob2o
bo8bo2b2o3b$14b4o3b2o26bo2bobobo5bo3b3obo2b$14bo3bo2bo28bobo2b2o4bobo
6bo2b$17bobobo29bo2b2o6bo5b2ob2o$17b3obobo22b2o6b3o9b2obobob$19bob2obo
21bobo5b2o10bo2bobob$6b2ob2o7bo5bo23bo2b2o14bob2o2b$6b2obo7b2ob5ob2o
17bo2b5o13b2o5b$9bo16b2o17b3o4bo7bob3o2bob2o2b$9bob2o2bo4bob3o5bo2bo2b
o2bo2bo5bo2bo7b4o2bobobo3b$10bobob2o3bo5b23obo9b3ob2o2bobo3b$11b3o4bo
6bo25bo12bobobo4b$15bobo4bo3bo2b3o2b3o2b3o2b5o2b2o3b3o3b2o2b2o5b$9b5ob
o6bo3b2o3b2o3b2o3b2o4bo4b2obob2o2bo2b2o7b$9bo3bobobo2b2o2b3o2b3o2b3o2b
3o2b5o8bo4bo2bo7b$12bo2bobo6bo29bo2bo5b2o8b$13b3obo4b2ob23o2bobo2bob3o
13b$18b2o2bobo2bo2bo2bo2bo2bo2bo2bo2bob3obobo3bo12b$15b2obob3obo23bobo
bobobo2b2o12b$15b2obo2bo2b2o21b2obobobob2o15b$18bo5bo23bobobobo18b$18b
obobobo23bo5bo18b$17b2obobob2o21b2o2bo2b2o17b$18bob3obo23bob3obo18b$
18bo2bo2bo23bobobobo18b$17b2o5b2o21b2obobob2o17b$18bobobobo23bo5bo18b$
18bobobobo23bo2bo2bo18b$17b2ob3ob2o21b2ob3ob2o17b$18bo2bo2bo23bobobobo
18b$18bo5bo23bobobobo18b$17b2obobob2o21b2o5b2o17b$18bobobobo23bo2bo2bo
18b$18bob3obo23bob3obo18b$17b2o2bo2b2o21b2obobob2o17b$18bo5bo23bobobob
o18b$18bobobobo23bo5bo18b$15b2obobobob2o21b2o2bo2bob2o15b$12b2o2bobobo
bobo23bob3obob2o15b$12bo3bobob3obo2bo2bo2bo2bo2bo2bo2bo2bobo2b2o18b$
13b3obo2bobo2b23ob2o4bob3o13b$8b2o5bo2bo29bo6bobo2bo12b$7bo2bo4bo8b5o
2b3o2b3o2b3o2b3o2b2o2bobobo3bo9b$7b2o2bo2b2obob2o4bo4b2o3b2o3b2o3b2o3b
o6bob5o9b$5b2o2b2o3b3o3b2o2b5o2b3o2b3o2b3o2bo3bo4bobo15b$4bobobo12bo
25bo6bo4b3o11b$3bobo2b2ob3o9bob23o5bo3b2obobo10b$3bobobo2b4o7bo2bo5bo
2bo2bo2bo2bo5b3obo4bo2b2obo9b$2b2obo2b3obo7bo4b3o17b2o16bo9b$5b2o13b5o
2bo17b2ob5ob2o7bob2o6b$2b2obo14b2o2bo23bo5bo7b2ob2o6b$bobo2bo10b2o5bob
o21bob2obo19b$bobob2o9b3o6b2o22bobob3o17b$2ob2o5bo6b2o2bo29bobobo17b$
2bo6bobo4b2o2bobo28bo2bo3bo14b$2bob3o3bo5bobobo2bo26b2o3b4o14b$3b2o2bo
8bob2obobo49b$6bobo8bo3b2o34b2o14b$3b3obobo2b2obo3b2o36b2o14b$3bo2bo2b
o2bob5obo52b$6bob2obo7bo53b$5b2obo2b4ob3o54b$9b2o3bobo56b$11b3o59b$11b
o!
`))],
  ['block-laying switch engine', fillSimpleMap({ right: 46, bottom: 40, sq: true }, rleDecode('6bo$4boboo$4bobo$4bo$2bo$obo!'))],
  ['block-laying switch engine 2', fillSimpleMap({ right: 30, bottom: 20, sq: true }, rleDecode('3obo$o$3boo$boobo$obobo!'))],
  ['block-laying switch engine 3', fillSimpleMap({}, rleDecode('8ob5o3b3o6b7ob5o!'))],
  ['41140732', fillSimpleMap({ bottom: 48, right: 4, sq: true }, buildDigitMap('41140732'))],
  ['90', fillSimpleMap({ bottom: 5, right: 3, sq: true }, buildDigitMap('90'))],
  ['3207', fillSimpleMap({ top: 7 }, buildDigitMap('3207'))],
  ['94174', fillSimpleMap({ right: 3 }, buildDigitMap('94174'))],
  ['185598100297311043114', fillSimpleMap({ bottom: 11 }, buildDigitMap('185598100297311043114'))],
  ['1415073111111103975114', fillSimpleMap({}, buildDigitMap('1415073111111103975114'))],
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
    $('#stat').html( // TODO: layout and legend
      `FPS: ${r.statFrames
      } CPU (calc/draw/idle): ${r.statCalcTime.toFixed(2)} / ${
        r.statDrawTime.toFixed(2)} / ${
        Math.max(0, Math.min(1000, (1000 - r.statCalcTime - r.statDrawTime))).toFixed(2)
      }ms/s <div style="display: inline-block; background-color: #777; width: 100px; height: 10px; position: relative"><div style="position: absolute; top: 0; left: ${
        Math.floor(r.statCalcTime / 10)}px; width: ${
        Math.floor(r.statDrawTime / 10)}px; height: 10px; background-color: #000;"></div></div> AvgTime (calc/draw): ${
        ((r.statCalcTime / r.statFrames) || 0).toFixed(2)} / ${
        ((r.statDrawTime / r.statFrames) || 0).toFixed(2)}ms/frame UPS: ${r.statUpdated} TPU: ${((1000 * (r.statCalcTime / r.statUpdated)) || 0).toFixed(3)}&micro;s`
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

  $('[data-tail-mode]').each((n, v) => {
    const e = $(v);
    const m = parseInt(e.data('tail-mode'), 10);
    e.click(() => {
      cmgr.setMode(m);
    });
  });
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
    $('[data-hot-key]').each((n, v) => {
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
