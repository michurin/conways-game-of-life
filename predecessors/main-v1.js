// You can consider this global variables like state of one global singlton.
const gridSizeX = 300;
const gridSizeY = 400;
let grid; // speed up: we won't relocate this memory
let candidates; // speed up: we will focused only on certain palces
const step = 2;
let size = 3; // will be updated from initGrid
const fillDead = '#333';
const fillLife = '#888';
let context2d;

function initGrid() {
  let x;
  let y;
  let i;
  let a;
  let b;
  let a0;
  let b0;
  let a1;
  let b1;
  let na;
  // step: setup grid
  const gridSize = gridSizeX * gridSizeY;
  const sx = gridSizeX - 1;
  const sy = gridSizeY - 1;
  grid = Array(gridSize);
  for (y = 0; y < gridSizeY; y++) {
    for (x = 0; x < gridSizeX; x++) {
      i = x + gridSizeX * y;
      grid[i] = {
        // mutables
        v: 0, // value
        n: 0, // neighbors count
        // imutables
        i,
        sx: x, // screen x, y
        sy: y,
        na: undefined, // array of neighbors
      };
    }
  }
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
            na.push(grid[a + gridSizeX * b]);
          }
        }
      }
      grid[x + gridSizeX * y].na = na;
    }
  }
  // step: setup candidates
  candidates = {};
  // step: setup view
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
    for (x = 0; x <= w; x += step) {
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

function updateGridElement(e, v, dn) { // unsafe helper
  e.v = v;
  candidates[e.i] = undefined;
  e.na.forEach((x) => {
    x.n += dn;
    candidates[x.i] = undefined;
  });
}

function manualSetOnGrid(x, y, v) {
  if (x < 0 || x >= gridSizeX || y < 0 || y >= gridSizeY) {
    return;
  }
  const t = grid[x + gridSizeX * y];
  if (v === t.v) {
    return;
  }
  updateGridElement(t, v, v === 0 ? -1 : 1);
  context2d.fillStyle = [fillDead, fillLife][v];
  context2d.fillRect(x * step + 1, y * step + 1, size, size);
}

function stepGrid() {
  let i;
  let t;
  // step 1: analyze
  const letOff = [];
  const letOn = [];
  Object.keys(candidates).forEach((k) => {
    const t = grid[k];
    const { n } = t;
    if (t.v) {
      if (!(n === 2 || n === 3)) {
        letOff.push(t);
      }
    } else if (n === 3) {
      letOn.push(t);
    }
  });
  // step 2: update candidates, grid, canvas
  candidates = {};
  context2d.fillStyle = fillDead;
  for (i = 0; i < letOff.length; i++) {
    t = letOff[i];
    updateGridElement(t, 0, -1);
    context2d.fillRect(t.sx * step + 1, t.sy * step + 1, size, size);
  }
  context2d.fillStyle = fillLife;
  for (i = 0; i < letOn.length; i++) {
    t = letOn[i];
    updateGridElement(t, 1, 1);
    context2d.fillRect(t.sx * step + 1, t.sy * step + 1, size, size);
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
