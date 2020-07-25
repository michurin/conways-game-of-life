// You can consider this global variables like state of one global singlton.
const gridSizeX = 300;
const gridSizeY = 400;
let grid; // speed up: we won't relocate this memory
let candidates; // speed up: we will focused only on certain palces
const step = 2;
let size = 3; // will be updated from initGrid
const fillDead = '#222';
const fillLife = '#888';
let context2d;

function initGrid() {
  let y;
  grid = Array(gridSizeY);
  candidates = {};
  for (y = 0; y < gridSizeY; y++) {
    grid[y] = new Int8Array(gridSizeX).fill(0);
  }
  const e = document.getElementById('grid');
  const w = gridSizeX * step + 1;
  const h = gridSizeY * step + 1;
  e.width = w;
  e.height = h;
  context2d = e.getContext('2d');
  context2d.fillStyle = fillDead;
  context2d.fillRect(0, 0, e.width, e.height);
  context2d.fillStyle = '#000';
  if (step > 3) {
    for (let x = 0; x <= w; x += step) {
      context2d.fillRect(x, 0, 1, h);
    }
    for (y = 0; y <= h; y += step) {
      context2d.fillRect(0, y, w, 1);
    }
    size = step - 1;
  } else {
    context2d.fillRect(0, 0, 1, h);
    context2d.fillRect(w - 1, 0, 1, h);
    context2d.fillRect(0, 0, w, 1);
    context2d.fillRect(0, h - 1, w, 1);
    size = step;
  }
}

function manualSetOnGrid(x, y, v) {
  // TODO check bounds
  grid[y][x] = v;
  context2d.fillStyle = [fillDead, fillLife][v];
  context2d.fillRect(x * step + 1, y * step + 1, size, size);
  const aa = x === 0 ? 0 : x - 1;
  const ab = x === gridSizeX - 1 ? x : x + 1;
  const ba = y === 0 ? 0 : y - 1;
  const bb = y === gridSizeY - 1 ? y : y + 1;
  for (let b = ba; b <= bb; b++) {
    for (let a = aa; a <= ab; a++) {
      const c = a + 10000 * b;
      candidates[c] = undefined;
    }
  }
}

function stepGrid() {
  let i;
  let x;
  let y;
  // step 1: analyze
  const szx1 = gridSizeX - 1;
  const szy1 = gridSizeY - 1;
  const dieX = []; // parallel arrays of pure numbers are faster then arrays of objects like {x, y}
  const dieY = [];
  const repX = [];
  const repY = [];
  const newCandidates = {};
  Object.keys(candidates).forEach((k) => {
    let a;
    let b;
    const x = k % 10000;
    const y = Math.floor(k / 10000);
    const aa = x === 0 ? 0 : x - 1;
    const ab = x === szx1 ? x : x + 1;
    const ba = y === 0 ? 0 : y - 1;
    const bb = y === szy1 ? y : y + 1;
    const v = grid[y][x];
    let s = -v;
    for (b = ba; b <= bb; b++) {
      for (a = aa; a <= ab; a++) {
        s += grid[b][a];
      }
    }
    let updated = false;
    if (v) {
      if (!(s === 2 || s === 3)) {
        dieX.push(x);
        dieY.push(y);
        updated = true;
      }
    } else if (s === 3) {
      repX.push(x);
      repY.push(y);
      updated = true;
    }
    if (updated) {
      for (b = ba; b <= bb; b++) {
        for (a = aa; a <= ab; a++) {
          const c = a + 10000 * b;
          newCandidates[c] = undefined;
        }
      }
    }
  });
  // step 2: update candidates, grid and canvas
  candidates = newCandidates;
  context2d.fillStyle = fillDead;
  for (i = 0; i < dieX.length; i++) {
    x = dieX[i];
    y = dieY[i];
    grid[y][x] = 0;
    context2d.fillRect(x * step + 1, y * step + 1, size, size);
  }
  context2d.fillStyle = fillLife;
  for (i = 0; i < repX.length; i++) {
    x = repX[i];
    y = repY[i];
    grid[y][x] = 1;
    context2d.fillRect(x * step + 1, y * step + 1, size, size);
  }
}

$(() => {
  initGrid();
  for (let i = 10; i < gridSizeX - 10; i++) {
    for (let j = 10; j < gridSizeY - 10; j++) {
      if (Math.random() < 0.4) {
        manualSetOnGrid(i, j, 1);
      }
    }
  }
  setInterval(stepGrid, 10);
});
