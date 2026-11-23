import {
  ALL_SWEETS,
  BoosterType,
  Cell,
  GravityDir,
  KadhaiRecipeId,
  LevelConfig,
  MatchGroup,
  Pos,
  SpecialType,
  StepResult,
  SweetType,
} from './types';

let cellUid = 1;
const nextCellId = () => `c_${cellUid++}`;

/** Seeded PRNG (Mulberry32) so Daily Challenge boards are identical for everyone on the same date */
export function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getActiveSweets(level: LevelConfig): SweetType[] {
  const count = Math.max(4, Math.min(ALL_SWEETS.length, level.sweetTypesCount ?? 6));
  return ALL_SWEETS.slice(0, count);
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function randomSweet(palette: SweetType[], rng: () => number, exclude: SweetType[] = []): SweetType {
  const candidates = palette.filter((s) => !exclude.includes(s));
  const list = candidates.length > 0 ? candidates : palette;
  return list[Math.floor(rng() * list.length)];
}

/** Creates an initial valid board with zero starting matches and at least one playable move */
export function createBoard(level: LevelConfig, seed?: number): Cell[][] {
  const rng = createRng(seed ?? level.seed);
  const palette = getActiveSweets(level);
  const overrideMap = new Map<string, NonNullable<LevelConfig['layout']>[number]>();
  for (const ov of level.layout ?? []) {
    overrideMap.set(`${ov.r},${ov.c}`, ov);
  }

  const board: Cell[][] = [];
  for (let r = 0; r < level.rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < level.cols; c++) {
      const ov = overrideMap.get(`${r},${c}`);
      const isHole = Boolean(ov?.hole);
      const blocker = ov?.blocker ?? 'none';
      const isCherry = Boolean(ov?.cherry);
      const jelly = (ov?.jelly ?? 0) as 0 | 1 | 2;

      if (isHole || blocker === 'stone') {
        row.push({
          id: nextCellId(),
          row: r,
          col: c,
          sweet: null,
          special: 'none',
          jelly: 0,
          blocker: isHole ? 'none' : 'stone',
          isHole,
        });
        continue;
      }

      if (isCherry) {
        row.push({
          id: nextCellId(),
          row: r,
          col: c,
          sweet: null,
          special: 'none',
          jelly,
          blocker: 'none',
          isCherry: true,
        });
        continue;
      }

      // Avoid initial 3-in-a-row
      const exclude: SweetType[] = [];
      if (c >= 2 && row[c - 1].sweet && row[c - 1].sweet === row[c - 2].sweet) {
        exclude.push(row[c - 1].sweet!);
      }
      if (r >= 2 && board[r - 1][c].sweet && board[r - 1][c].sweet === board[r - 2][c].sweet) {
        exclude.push(board[r - 1][c].sweet!);
      }

      row.push({
        id: nextCellId(),
        row: r,
        col: c,
        sweet: randomSweet(palette, rng, exclude),
        special: 'none',
        jelly,
        blocker,
      });
    }
    board.push(row);
  }

  // Ensure at least one valid move exists at start
  if (!findBestHint(board)) {
    return shuffleBoard(board, level, rng);
  }
  return board;
}

export function isCellMovable(cell: Cell): boolean {
  if (cell.isHole) return false;
  if (cell.blocker === 'stone' || cell.blocker === 'locked') return false;
  if (!cell.sweet && !cell.isCherry) return false;
  return true;
}

export function areAdjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/** Finds all match-3+ groups, merging intersecting L/T shapes into Wrapped, 4-in-row into Striped, 5+ into Rainbow */
export function findMatches(board: Cell[][], swapHint?: [Pos, Pos]): MatchGroup[] {
  const rows = board.length;
  const cols = board[0].length;

  interface Run {
    dir: 'h' | 'v';
    sweet: SweetType;
    cells: Pos[];
  }
  const runs: Run[] = [];

  // Horizontal runs
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const sweet = board[r][c].sweet;
      if (!sweet || board[r][c].isHole || board[r][c].blocker === 'stone' || board[r][c].isCherry || board[r][c].special === 'rainbow') {
        c++;
        continue;
      }
      let end = c + 1;
      while (
        end < cols &&
        board[r][end].sweet === sweet &&
        board[r][end].special !== 'rainbow' &&
        !board[r][end].isCherry
      ) {
        end++;
      }
      if (end - c >= 3) {
        const cells: Pos[] = [];
        for (let k = c; k < end; k++) cells.push({ row: r, col: k });
        runs.push({ dir: 'h', sweet, cells });
      }
      c = end;
    }
  }

  // Vertical runs
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const sweet = board[r][c].sweet;
      if (!sweet || board[r][c].isHole || board[r][c].blocker === 'stone' || board[r][c].isCherry || board[r][c].special === 'rainbow') {
        r++;
        continue;
      }
      let end = r + 1;
      while (
        end < rows &&
        board[end][c].sweet === sweet &&
        board[end][c].special !== 'rainbow' &&
        !board[end][c].isCherry
      ) {
        end++;
      }
      if (end - r >= 3) {
        const cells: Pos[] = [];
        for (let k = r; k < end; k++) cells.push({ row: k, col: c });
        runs.push({ dir: 'v', sweet, cells });
      }
      r = end;
    }
  }

  if (runs.length === 0) return [];

  // Merge overlapping runs of the same sweet type (for L / T / Cross detection)
  const visited = new Array(runs.length).fill(false);
  const groups: MatchGroup[] = [];

  const posKey = (p: Pos) => `${p.row},${p.col}`;

  for (let i = 0; i < runs.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const component = [runs[i]];
    const queue = [runs[i]];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curSet = new Set(cur.cells.map(posKey));
      for (let j = 0; j < runs.length; j++) {
        if (visited[j] || runs[j].sweet !== cur.sweet) continue;
        if (runs[j].cells.some((p) => curSet.has(posKey(p)))) {
          visited[j] = true;
          component.push(runs[j]);
          queue.push(runs[j]);
        }
      }
    }

    const uniqueMap = new Map<string, Pos>();
    let hasH = false;
    let hasV = false;
    let maxRunLen = 0;

    for (const run of component) {
      if (run.dir === 'h') hasH = true;
      if (run.dir === 'v') hasV = true;
      if (run.cells.length > maxRunLen) maxRunLen = run.cells.length;
      for (const p of run.cells) uniqueMap.set(posKey(p), p);
    }

    const cells = Array.from(uniqueMap.values());
    let spawnSpecial: SpecialType | undefined;

    if (maxRunLen >= 5) {
      spawnSpecial = 'rainbow';
    } else if (hasH && hasV && cells.length >= 5) {
      spawnSpecial = 'wrapped';
    } else if (maxRunLen === 4) {
      // Determine stripe direction from swap or run orientation
      if (swapHint) {
        const isHorizontalSwap = swapHint[0].row === swapHint[1].row;
        spawnSpecial = isHorizontalSwap ? 'striped_h' : 'striped_v';
      } else {
        spawnSpecial = component[0].dir === 'h' ? 'striped_v' : 'striped_h';
      }
    }

    let spawnAt: Pos | undefined;
    if (spawnSpecial) {
      if (swapHint) {
        spawnAt = cells.find(
          (p) =>
            (p.row === swapHint[0].row && p.col === swapHint[0].col) ||
            (p.row === swapHint[1].row && p.col === swapHint[1].col)
        );
      }
      if (!spawnAt) {
        spawnAt = cells[Math.floor(cells.length / 2)];
      }
    }

    groups.push({
      cells,
      sweet: component[0].sweet,
      spawnSpecial,
      spawnAt,
    });
  }

  return groups;
}

/** Checks if swapping a and b is legal (either special combo or creates match) */
export function isValidSwap(board: Cell[][], a: Pos, b: Pos): boolean {
  if (!areAdjacent(a, b)) return false;
  const cellA = board[a.row]?.[a.col];
  const cellB = board[b.row]?.[b.col];
  if (!cellA || !cellB) return false;
  if (!isCellMovable(cellA) || !isCellMovable(cellB)) return false;

  // Rainbow + any sweet (or another special) is always valid!
  if (
    (cellA.special === 'rainbow' && (cellB.sweet || cellB.special !== 'none')) ||
    (cellB.special === 'rainbow' && (cellA.sweet || cellA.special !== 'none'))
  ) {
    return true;
  }

  // Special + Special combo is always valid!
  if (cellA.special !== 'none' && cellB.special !== 'none') {
    return true;
  }

  // Simulate swap and check for matches
  const test = cloneBoard(board);
  swapCellContents(test, a, b);
  return findMatches(test, [a, b]).length > 0;
}

export function swapCellContents(board: Cell[][], a: Pos, b: Pos): void {
  const ca = board[a.row][a.col];
  const cb = board[b.row][b.col];
  const tmpSweet = ca.sweet;
  const tmpSpecial = ca.special;
  const tmpCherry = ca.isCherry;
  const tmpId = ca.id;

  ca.sweet = cb.sweet;
  ca.special = cb.special;
  ca.isCherry = cb.isCherry;
  ca.id = cb.id;

  cb.sweet = tmpSweet;
  cb.special = tmpSpecial;
  cb.isCherry = tmpCherry;
  cb.id = tmpId;
}

function emptySweetCount(): Record<SweetType, number> {
  return {
    laddu: 0,
    jalebi: 0,
    gulab_jamun: 0,
    rasgulla: 0,
    barfi: 0,
    mysore_pak: 0,
  };
}

/** Collects all cells affected by clearing a set of coordinates, chaining any triggered specials! */
function expandClearsWithSpecials(
  board: Cell[][],
  initial: Set<string>,
  specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }>
): Set<string> {
  const rows = board.length;
  const cols = board[0].length;
  const toClear = new Set<string>(initial);
  const triggered = new Set<string>();
  const queue = Array.from(initial);

  const enqueue = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const cell = board[r][c];
    if (cell.isHole || cell.isCherry) return;
    const k = `${r},${c}`;
    if (!toClear.has(k)) {
      toClear.add(k);
      queue.push(k);
    }
  };

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (triggered.has(key)) continue;
    const [r, c] = key.split(',').map(Number);
    const cell = board[r][c];
    if (!cell || cell.special === 'none') continue;
    triggered.add(key);

    if (cell.special === 'striped_h') {
      specialBlasts.push({ type: 'striped_h', row: r, col: c });
      for (let col = 0; col < cols; col++) enqueue(r, col);
    } else if (cell.special === 'striped_v') {
      specialBlasts.push({ type: 'striped_v', row: r, col: c });
      for (let row = 0; row < rows; row++) enqueue(row, c);
    } else if (cell.special === 'wrapped') {
      specialBlasts.push({ type: 'wrapped', row: r, col: c });
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) enqueue(r + dr, c + dc);
      }
    } else if (cell.special === 'rainbow') {
      specialBlasts.push({ type: 'rainbow', row: r, col: c });
      // Pick most common sweet to blast
      const counts = emptySweetCount();
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          const s = board[rr][cc].sweet;
          if (s) counts[s]++;
        }
      }
      const best = (Object.keys(counts) as SweetType[]).sort((a, b) => counts[b] - counts[a])[0];
      for (let rr = 0; rr < rows; rr++) {
        for (let cc = 0; cc < cols; cc++) {
          if (board[rr][cc].sweet === best) enqueue(rr, cc);
        }
      }
    }
  }

  return toClear;
}

/** Resolves special + special or rainbow + sweet swap immediately */
export function resolveSpecialSwap(
  boardInput: Cell[][],
  a: Pos,
  b: Pos,
  comboMultiplier: number
): StepResult | null {
  const board = cloneBoard(boardInput);
  const ca = board[a.row][a.col];
  const cb = board[b.row][b.col];

  const isRainbowA = ca.special === 'rainbow';
  const isRainbowB = cb.special === 'rainbow';
  const isBothSpecial = ca.special !== 'none' && cb.special !== 'none';

  if (!isRainbowA && !isRainbowB && !isBothSpecial) return null;

  const rows = board.length;
  const cols = board[0].length;
  const initial = new Set<string>([`${a.row},${a.col}`, `${b.row},${b.col}`]);
  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [
    { type: 'combo', row: b.row, col: b.col },
  ];

  // Clear their own special flags so expand doesn't double-trigger default behavior
  const specA = ca.special;
  const specB = cb.special;
  const sweetA = ca.sweet;
  const sweetB = cb.sweet;
  ca.special = 'none';
  cb.special = 'none';

  if (specA === 'rainbow' && specB === 'rainbow') {
    // Clear the ENTIRE board!
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!board[r][c].isHole && !board[r][c].isCherry) {
          initial.add(`${r},${c}`);
        }
      }
    }
  } else if (specA === 'rainbow' || specB === 'rainbow') {
    const targetSweet = specA === 'rainbow' ? sweetB : sweetA;
    const otherSpecial = specA === 'rainbow' ? specB : specA;
    if (targetSweet) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (board[r][c].sweet === targetSweet) {
            if (otherSpecial === 'striped_h' || otherSpecial === 'striped_v') {
              board[r][c].special = (r + c) % 2 === 0 ? 'striped_h' : 'striped_v';
            } else if (otherSpecial === 'wrapped') {
              board[r][c].special = 'wrapped';
            }
            initial.add(`${r},${c}`);
          }
        }
      }
    }
  } else {
    const isStripedA = specA === 'striped_h' || specA === 'striped_v';
    const isStripedB = specB === 'striped_h' || specB === 'striped_v';
    const isWrappedA = specA === 'wrapped';
    const isWrappedB = specB === 'wrapped';

    if (isStripedA && isStripedB) {
      // Cross blast: full row & full col centered at b
      for (let c = 0; c < cols; c++) initial.add(`${b.row},${c}`);
      for (let r = 0; r < rows; r++) initial.add(`${r},${b.col}`);
    } else if ((isStripedA && isWrappedB) || (isWrappedA && isStripedB)) {
      // Giant 3-row + 3-col cross blast!
      for (let dr = -1; dr <= 1; dr++) {
        const rr = b.row + dr;
        if (rr >= 0 && rr < rows) {
          for (let c = 0; c < cols; c++) initial.add(`${rr},${c}`);
        }
      }
      for (let dc = -1; dc <= 1; dc++) {
        const cc = b.col + dc;
        if (cc >= 0 && cc < cols) {
          for (let r = 0; r < rows; r++) initial.add(`${r},${cc}`);
        }
      }
    } else if (isWrappedA && isWrappedB) {
      // Mega 5x5 explosion!
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = b.row + dr;
          const cc = b.col + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
            initial.add(`${rr},${cc}`);
          }
        }
      }
    }
  }

  const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
  return applyClearsToBoard(board, expanded, [], specialBlasts, comboMultiplier, 25);
}

/** Resolves all current match groups on the board (used after normal swap and during cascades) */
export function resolveCurrentMatches(
  boardInput: Cell[][],
  comboMultiplier: number,
  swapHint?: [Pos, Pos]
): StepResult | null {
  const board = cloneBoard(boardInput);
  const groups = findMatches(board, swapHint);
  if (groups.length === 0) return null;

  const initial = new Set<string>();
  const spawns: Array<{ pos: Pos; sweet: SweetType; special: SpecialType }> = [];

  for (const g of groups) {
    for (const p of g.cells) {
      initial.add(`${p.row},${p.col}`);
    }
    if (g.spawnSpecial && g.spawnAt) {
      spawns.push({ pos: g.spawnAt, sweet: g.sweet, special: g.spawnSpecial });
    }
  }

  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [];
  const expanded = expandClearsWithSpecials(board, initial, specialBlasts);

  return applyClearsToBoard(board, expanded, spawns, specialBlasts, comboMultiplier, 0);
}

function applyClearsToBoard(
  board: Cell[][],
  clearKeys: Set<string>,
  spawns: Array<{ pos: Pos; sweet: SweetType; special: SpecialType }>,
  specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }>,
  comboMultiplier: number,
  bonusBossDamage: number
): StepResult {
  const rows = board.length;
  const cols = board[0].length;
  const clearedPositions: Pos[] = [];
  const clearedSweets = emptySweetCount();
  let jellyCleared = 0;

  const spawnKeyMap = new Map<string, { sweet: SweetType; special: SpecialType }>();
  for (const sp of spawns) {
    spawnKeyMap.set(`${sp.pos.row},${sp.pos.col}`, { sweet: sp.sweet, special: sp.special });
  }

  // Adjacent ice & locked damage from matched cells
  const adjacentIceHit = new Set<string>();
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const key of clearKeys) {
    const [r, c] = key.split(',').map(Number);
    const cell = board[r]?.[c];
    if (!cell || cell.isHole || cell.isCherry) continue;

    // Stone is indestructible except when hit by special blasts? Let's allow special blasts to crack stone!
    if (cell.blocker === 'stone') {
      if (specialBlasts.length > 0) {
        cell.blocker = 'none';
        clearedPositions.push({ row: r, col: c });
      }
      continue;
    }

    // Locked sweet unlocks first instead of vanishing immediately
    if (cell.blocker === 'locked') {
      cell.blocker = 'none';
      clearedPositions.push({ row: r, col: c });
      continue;
    }

    // Ice melts on match/blast
    if (cell.blocker === 'ice') {
      cell.blocker = 'none';
    }

    // Jelly loses 1 layer
    if (cell.jelly > 0) {
      cell.jelly = (cell.jelly - 1) as 0 | 1 | 2;
      if (cell.jelly === 0) jellyCleared++;
    }

    if (cell.sweet) {
      clearedSweets[cell.sweet]++;
    }

    clearedPositions.push({ row: r, col: c });

    // Damage adjacent ice blocks
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (board[nr][nc].blocker === 'ice' && !clearKeys.has(`${nr},${nc}`)) {
          adjacentIceHit.add(`${nr},${nc}`);
        }
      }
    }

    const spawn = spawnKeyMap.get(key);
    if (spawn) {
      cell.sweet = spawn.special === 'rainbow' ? spawn.sweet : spawn.sweet;
      cell.special = spawn.special;
      cell.id = nextCellId();
    } else {
      cell.sweet = null;
      cell.special = 'none';
    }
  }

  for (const iceKey of adjacentIceHit) {
    const [r, c] = iceKey.split(',').map(Number);
    board[r][c].blocker = 'none';
  }

  const basePoints = clearedPositions.length * 60 + specialBlasts.length * 180 + spawns.length * 120;
  const pointsGained = Math.round(basePoints * comboMultiplier);
  const bossDamage =
    Math.round((clearedPositions.length * 4 + specialBlasts.length * 16 + bonusBossDamage) * Math.min(2.5, 1 + (comboMultiplier - 1) * 0.4));

  return {
    board,
    clearedPositions,
    clearedSweets,
    jellyCleared,
    cherriesDropped: 0,
    bossDamage,
    specialsCreated: spawns.length,
    specialBlasts,
    pointsGained,
  };
}

/** Applies 4-directional gravity ('down' | 'right' | 'up' | 'left'), drops cherries at gravity edge, and refills */
export function applyGravityAndRefill(
  boardInput: Cell[][],
  level: LevelConfig,
  rng: () => number = Math.random,
  gravity: GravityDir = 'down'
): { board: Cell[][]; cherriesDropped: number } {
  const board = cloneBoard(boardInput);
  const rows = board.length;
  const cols = board[0].length;
  const palette = getActiveSweets(level);

  // Reset animation flags
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board[r][c].justDropped = false;
      board[r][c].justMatched = false;
    }
  }

  // Helper to process a single 1D lane ordered from destination edge -> source edge
  const compactLane = (coords: Pos[]) => {
    for (let i = 0; i < coords.length; i++) {
      const target = board[coords[i].row][coords[i].col];
      if (target.isHole || target.blocker === 'stone' || target.blocker === 'locked') continue;
      if (target.sweet !== null || target.isCherry) continue;

      let srcIdx = i + 1;
      while (srcIdx < coords.length) {
        const src = board[coords[srcIdx].row][coords[srcIdx].col];
        if (src.isHole || src.blocker === 'stone' || src.blocker === 'locked') {
          srcIdx = -1;
          break;
        }
        if (src.sweet !== null || src.isCherry) {
          break;
        }
        srcIdx++;
      }

      if (srcIdx >= 0 && srcIdx < coords.length) {
        const src = board[coords[srcIdx].row][coords[srcIdx].col];
        target.sweet = src.sweet;
        target.special = src.special;
        target.isCherry = src.isCherry;
        target.id = src.id;
        target.justDropped = true;

        src.sweet = null;
        src.special = 'none';
        src.isCherry = false;
      }
    }

    // Refill any remaining empty playable cells in the lane
    for (let i = coords.length - 1; i >= 0; i--) {
      const cell = board[coords[i].row][coords[i].col];
      if (cell.isHole || cell.blocker === 'stone') continue;
      if (cell.sweet === null && !cell.isCherry) {
        cell.sweet = randomSweet(palette, rng);
        cell.special = 'none';
        cell.id = nextCellId();
        cell.justDropped = true;
      }
    }
  };

  let cherriesDropped = 0;

  if (gravity === 'down' || gravity === 'up') {
    for (let c = 0; c < cols; c++) {
      const lane: Pos[] = [];
      if (gravity === 'down') {
        for (let r = rows - 1; r >= 0; r--) lane.push({ row: r, col: c });
      } else {
        for (let r = 0; r < rows; r++) lane.push({ row: r, col: c });
      }
      compactLane(lane);

      // Check cherry at gravity exit edge
      const exitCoord = lane.find((p) => !board[p.row][p.col].isHole && board[p.row][p.col].blocker !== 'stone');
      if (exitCoord && board[exitCoord.row][exitCoord.col].isCherry) {
        const ec = board[exitCoord.row][exitCoord.col];
        ec.isCherry = false;
        ec.sweet = randomSweet(palette, rng);
        ec.id = nextCellId();
        ec.justDropped = true;
        cherriesDropped++;
      }
    }
  } else {
    for (let r = 0; r < rows; r++) {
      const lane: Pos[] = [];
      if (gravity === 'right') {
        for (let c = cols - 1; c >= 0; c--) lane.push({ row: r, col: c });
      } else {
        for (let c = 0; c < cols; c++) lane.push({ row: r, col: c });
      }
      compactLane(lane);

      const exitCoord = lane.find((p) => !board[p.row][p.col].isHole && board[p.row][p.col].blocker !== 'stone');
      if (exitCoord && board[exitCoord.row][exitCoord.col].isCherry) {
        const ec = board[exitCoord.row][exitCoord.col];
        ec.isCherry = false;
        ec.sweet = randomSweet(palette, rng);
        ec.id = nextCellId();
        ec.justDropped = true;
        cherriesDropped++;
      }
    }
  }

  return { board, cherriesDropped };
}

/** Rotates gravity 90 degrees clockwise (+1) or counter-clockwise (-1) */
export function rotateGravityDir(current: GravityDir, delta: 1 | -1): GravityDir {
  const order: GravityDir[] = ['down', 'left', 'up', 'right'];
  const idx = order.indexOf(current);
  return order[(idx + delta + order.length) % order.length];
}

/** Finds the highest-value valid move for the 5-second idle hint glow */
export function findBestHint(board: Cell[][]): [Pos, Pos] | null {
  const rows = board.length;
  const cols = board[0].length;
  let bestMove: [Pos, Pos] | null = null;
  let bestScore = -1;

  const evaluate = (a: Pos, b: Pos) => {
    if (!isValidSwap(board, a, b)) return;
    const ca = board[a.row][a.col];
    const cb = board[b.row][b.col];
    let score = 3;
    if (ca.special !== 'none' && cb.special !== 'none') {
      score = 100;
    } else if (ca.special === 'rainbow' || cb.special === 'rainbow') {
      score = 80;
    } else {
      const test = cloneBoard(board);
      swapCellContents(test, a, b);
      const matches = findMatches(test, [a, b]);
      score = matches.reduce((sum, g) => sum + g.cells.length * (g.spawnSpecial ? 3 : 1), 0);
    }
    if (score > bestScore) {
      bestScore = score;
      bestMove = [a, b];
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) evaluate({ row: r, col: c }, { row: r, col: c + 1 });
      if (r + 1 < rows) evaluate({ row: r, col: c }, { row: r + 1, col: c });
    }
  }

  return bestMove;
}

/** Auto-shuffles movable sweets when no moves remain, preserving blockers/jelly/cherries */
export function shuffleBoard(
  boardInput: Cell[][],
  level: LevelConfig,
  rng: () => number = Math.random
): Cell[][] {
  const board = cloneBoard(boardInput);
  const movablePositions: Pos[] = [];
  const items: Array<{ sweet: SweetType; special: SpecialType }> = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (isCellMovable(cell) && cell.sweet && !cell.isCherry) {
        movablePositions.push({ row: r, col: c });
        items.push({ sweet: cell.sweet, special: cell.special });
      }
    }
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    // Fisher-Yates shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    for (let i = 0; i < movablePositions.length; i++) {
      const p = movablePositions[i];
      board[p.row][p.col].sweet = items[i].sweet;
      board[p.row][p.col].special = items[i].special;
      board[p.row][p.col].justDropped = true;
    }
    if (findMatches(board).length === 0 && findBestHint(board) !== null) {
      return board;
    }
  }

  // Fallback: force a guaranteed matchable pattern on first 4 movable sweets
  const palette = getActiveSweets(level);
  if (movablePositions.length >= 4) {
    const s = palette[0];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length - 2; c++) {
        if (
          isCellMovable(board[r][c]) &&
          isCellMovable(board[r][c + 1]) &&
          isCellMovable(board[r][c + 2]) &&
          r + 1 < board.length &&
          isCellMovable(board[r + 1][c + 2])
        ) {
          board[r][c].sweet = s;
          board[r][c + 1].sweet = s;
          board[r + 1][c + 2].sweet = s;
          board[r][c + 2].sweet = palette[1];
          return board;
        }
      }
    }
  }

  return board;
}

/** Applies a targeted or board-wide booster */
export function applyBoosterEffect(
  boardInput: Cell[][],
  booster: BoosterType,
  level: LevelConfig,
  target?: Pos
): StepResult {
  const board = cloneBoard(boardInput);
  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [];

  if (booster === 'shuffle') {
    const shuffled = shuffleBoard(board, level);
    return {
      board: shuffled,
      clearedPositions: [],
      clearedSweets: emptySweetCount(),
      jellyCleared: 0,
      cherriesDropped: 0,
      bossDamage: 0,
      specialsCreated: 0,
      specialBlasts: [],
      pointsGained: 0,
    };
  }

  if (booster === 'hammer' && target) {
    const cell = board[target.row]?.[target.col];
    if (cell && !cell.isHole && !cell.isCherry) {
      specialBlasts.push({ type: 'combo', row: target.row, col: target.col });
      if (cell.blocker === 'stone') {
        cell.blocker = 'none';
        return {
          board,
          clearedPositions: [target],
          clearedSweets: emptySweetCount(),
          jellyCleared: 0,
          cherriesDropped: 0,
          bossDamage: 35,
          specialsCreated: 0,
          specialBlasts,
          pointsGained: 150,
        };
      }
      const initial = new Set<string>([`${target.row},${target.col}`]);
      const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
      return applyClearsToBoard(board, expanded, [], specialBlasts, 1.2, 20);
    }
  }

  if (booster === 'color_bomb') {
    // Blast all sweets matching the target cell (or most common sweet on board)
    let targetSweet: SweetType | null = target ? board[target.row]?.[target.col]?.sweet ?? null : null;
    if (!targetSweet) {
      const counts = emptySweetCount();
      for (const row of board) {
        for (const c of row) {
          if (c.sweet) counts[c.sweet]++;
        }
      }
      targetSweet = (Object.keys(counts) as SweetType[]).sort((a, b) => counts[b] - counts[a])[0];
    }
    const initial = new Set<string>();
    const blastPos = target ?? { row: Math.floor(board.length / 2), col: Math.floor(board[0].length / 2) };
    specialBlasts.push({ type: 'rainbow', row: blastPos.row, col: blastPos.col });
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (board[r][c].sweet === targetSweet) {
          initial.add(`${r},${c}`);
        }
      }
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    return applyClearsToBoard(board, expanded, [], specialBlasts, 1.5, 45);
  }

  return {
    board,
    clearedPositions: [],
    clearedSweets: emptySweetCount(),
    jellyCleared: 0,
    cherriesDropped: 0,
    bossDamage: 0,
    specialsCreated: 0,
    specialBlasts: [],
    pointsGained: 0,
  };
}

/** Counts remaining jelly cells on board */
export function countRemainingJelly(board: Cell[][]): number {
  let count = 0;
  for (const row of board) {
    for (const c of row) {
      if (c.jelly > 0) count++;
    }
  }
  return count;
}

/** Sugar Rush bonus: drops a free special onto a random normal sweet when player fills fever meter */
export function spawnSugarRushSpecial(boardInput: Cell[][]): { board: Cell[][]; pos: Pos | null } {
  const board = cloneBoard(boardInput);
  const candidates: Pos[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (cell.sweet && cell.special === 'none' && cell.blocker === 'none' && !cell.isCherry) {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) return { board, pos: null };
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const specials: SpecialType[] = ['striped_h', 'striped_v', 'wrapped'];
  board[chosen.row][chosen.col].special = specials[Math.floor(Math.random() * specials.length)];
  return { board, pos: chosen };
}

/**
 * Avengers Momentum (Win Streak): automatically deploys free starting special relics onto the board!
 * - Streak 1: 1 Repulsor Beam (striped)
 * - Streak 2: 1 Repulsor Beam + 1 Quantum Nova (wrapped)
 * - Streak 3+: 1 Repulsor Beam + 1 Quantum Nova + 1 Infinity Singularity (rainbow)
 */
export function applyWinStreakBonuses(
  boardInput: Cell[][],
  winStreak: number,
  rng: () => number = Math.random
): { board: Cell[][]; spawned: Array<{ pos: Pos; special: SpecialType }> } {
  const board = cloneBoard(boardInput);
  if (winStreak <= 0) return { board, spawned: [] };

  const specialsToDrop: SpecialType[] =
    winStreak >= 3
      ? ['striped_h', 'wrapped', 'rainbow']
      : winStreak === 2
      ? ['striped_v', 'wrapped']
      : [rng() > 0.5 ? 'striped_h' : 'striped_v'];

  const candidates: Pos[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (cell.sweet && cell.special === 'none' && cell.blocker === 'none' && !cell.isCherry && !cell.isHole) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  const spawned: Array<{ pos: Pos; special: SpecialType }> = [];
  const used = new Set<string>();

  for (const spec of specialsToDrop) {
    const avail = candidates.filter((p) => !used.has(`${p.row},${p.col}`));
    if (avail.length === 0) break;
    const chosen = avail[Math.floor(rng() * avail.length)];
    used.add(`${chosen.row},${chosen.col}`);
    board[chosen.row][chosen.col].special = spec;
    board[chosen.row][chosen.col].id = nextCellId();
    spawned.push({ pos: chosen, special: spec });
  }

  return { board, spawned };
}

/**
 * Unleashes a brewed Brass Kadhai Alchemy fusion dish directly onto the puzzle board!
 */
export function applyKadhaiRecipeEffect(
  boardInput: Cell[][],
  recipeId: KadhaiRecipeId,
  rng: () => number = Math.random
): { step: StepResult; bonusMoves: number; spawnedRainbowAt?: Pos } {
  const board = cloneBoard(boardInput);
  const rows = board.length;
  const cols = board[0].length;
  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [];

  const normalCandidates: Pos[] = [];
  const blockerCandidates: Pos[] = [];
  const jellyCandidates: Pos[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isHole || cell.blocker === 'stone' || cell.isCherry) continue;
      if (cell.blocker === 'ice' || cell.blocker === 'locked') {
        blockerCandidates.push({ row: r, col: c });
      }
      if (cell.jelly > 0) {
        jellyCandidates.push({ row: r, col: c });
      }
      if (cell.sweet && cell.special === 'none' && cell.blocker === 'none') {
        normalCandidates.push({ row: r, col: c });
      }
    }
  }

  const pickRandom = <T,>(arr: T[], count: number): T[] => {
    const copy = [...arr];
    const picked: T[] = [];
    while (copy.length > 0 && picked.length < count) {
      const idx = Math.floor(rng() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  };

  if (recipeId === 'supernova') {
    // Forges a Rainbow Rasgulla Color Bomb on the board + blasts a gleaming cross + awards +2 Moves!
    const chosen = pickRandom(normalCandidates, 1)[0] ?? { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
    if (board[chosen.row][chosen.col].sweet) {
      board[chosen.row][chosen.col].special = 'rainbow';
      board[chosen.row][chosen.col].id = nextCellId();
    }
    const initial = new Set<string>();
    const ring: Array<[number, number]> = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of ring) {
      const nr = chosen.row + dr;
      const nc = chosen.col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].isHole && !board[nr][nc].isCherry) {
        initial.add(`${nr},${nc}`);
      }
    }
    specialBlasts.push({ type: 'rainbow', row: chosen.row, col: chosen.col });
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    expanded.delete(`${chosen.row},${chosen.col}`); // Preserve the newly forged Rainbow Bomb!
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.6, 40);
    return { step, bonusMoves: 2, spawnedRainbowAt: chosen };
  }

  if (recipeId === 'kesar_trio') {
    // Upgrades 3 sweets into Striped Specials & detonates them in a golden saffron wave!
    const chosen = pickRandom(normalCandidates, 3);
    const initial = new Set<string>();
    chosen.forEach((p, idx) => {
      board[p.row][p.col].special = idx % 2 === 0 ? 'striped_h' : 'striped_v';
      initial.add(`${p.row},${p.col}`);
    });
    if (initial.size === 0) {
      initial.add(`${Math.floor(rows / 2)},${Math.floor(cols / 2)}`);
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.5, 45);
    return { step, bonusMoves: 0 };
  }

  if (recipeId === 'rabri_melt') {
    // Melts up to 4 Ice/Locked blockers and strips 1 layer from up to 4 Jelly tiles, or clears 6 sweets if clean board
    const initial = new Set<string>();
    for (const p of pickRandom(blockerCandidates, 4)) {
      initial.add(`${p.row},${p.col}`);
      specialBlasts.push({ type: 'combo', row: p.row, col: p.col });
    }
    for (const p of pickRandom(jellyCandidates, 4)) {
      initial.add(`${p.row},${p.col}`);
    }
    if (initial.size < 6) {
      for (const p of pickRandom(normalCandidates, 6 - initial.size)) {
        initial.add(`${p.row},${p.col}`);
      }
    }
    if (specialBlasts.length === 0) {
      specialBlasts.push({ type: 'wrapped', row: Math.floor(rows / 2), col: Math.floor(cols / 2) });
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.45, 35);
    return { step, bonusMoves: 0 };
  }

  // 'masala_tadka' — Sizzling 3×3 explosion centered at the densest playable patch!
  const centerR = Math.max(1, Math.min(rows - 2, Math.floor(rows / 2) + (Math.floor(rng() * 3) - 1)));
  const centerC = Math.max(1, Math.min(cols - 2, Math.floor(cols / 2) + (Math.floor(rng() * 3) - 1)));
  const initial = new Set<string>();
  specialBlasts.push({ type: 'wrapped', row: centerR, col: centerC });
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = centerR + dr;
      const cc = centerC + dc;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && !board[rr][cc].isHole && !board[rr][cc].isCherry) {
        initial.add(`${rr},${cc}`);
      }
    }
  }
  const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
  const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.5, 55);
  return { step, bonusMoves: 0 };
}

export interface HeroUltimateResult {
  step: StepResult;
  bonusMoves: number;
  bonusTimeSec: number;
  bannerTitle: string;
  bannerSub: string;
  beamLines: Array<{ dir: 'h' | 'v'; index: number; color: string }>;
  shockPoints: Array<{ pos: Pos; color: string }>;
}

/**
 * Fires the active Avenger's signature Ultimate Superpower onto the board!
 */
export function applyHeroUltimate(
  boardInput: Cell[][],
  heroId: string,
  level: LevelConfig,
  rng: () => number = Math.random
): HeroUltimateResult {
  const board = cloneBoard(boardInput);
  const rows = board.length;
  const cols = board[0].length;
  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [];
  const beamLines: Array<{ dir: 'h' | 'v'; index: number; color: string }> = [];
  const shockPoints: Array<{ pos: Pos; color: string }> = [];

  const priorityTargets: Pos[] = [];
  const normalCandidates: Pos[] = [];
  const goalSweets = new Set<SweetType>(
    level.goals.filter((g) => g.type === 'collect' && g.sweet).map((g) => g.sweet!)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isHole || cell.isCherry) continue;
      if (cell.blocker === 'stone' || cell.blocker === 'locked' || cell.blocker === 'ice' || cell.jelly > 0) {
        priorityTargets.push({ row: r, col: c });
      } else if (cell.sweet && goalSweets.has(cell.sweet)) {
        priorityTargets.push({ row: r, col: c });
      }
      if (cell.sweet && cell.special === 'none' && cell.blocker === 'none') {
        normalCandidates.push({ row: r, col: c });
      }
    }
  }

  const pickRandom = <T,>(arr: T[], count: number): T[] => {
    const copy = [...arr];
    const out: T[] = [];
    while (copy.length > 0 && out.length < count) {
      const idx = Math.floor(rng() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

  // 1. Captain Nova — Vibranium Ricochet (smashes 6 priority targets/blockers + heavy boss hit)
  if (heroId === 'captain_nova') {
    const picked = pickRandom(priorityTargets, 6);
    if (picked.length < 6) {
      const used = new Set(picked.map((p) => `${p.row},${p.col}`));
      const extra = pickRandom(
        normalCandidates.filter((p) => !used.has(`${p.row},${p.col}`)),
        6 - picked.length
      );
      picked.push(...extra);
    }
    const initial = new Set<string>();
    for (const p of picked) {
      initial.add(`${p.row},${p.col}`);
      specialBlasts.push({ type: 'combo', row: p.row, col: p.col });
      shockPoints.push({ pos: p, color: '#22D3EE' });
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.6, 60);
    return {
      step,
      bonusMoves: 0,
      bonusTimeSec: 0,
      bannerTitle: 'VIBRANIUM RICOCHET!',
      bannerSub: '6 Priority Targets Shattered!',
      beamLines,
      shockPoints,
    };
  }

  // 2. Scarlet Bolt — Mach-9 Plasma Blur (blasts 1 row + 1 col + deploys free Repulsor Beam)
  if (heroId === 'scarlet_bolt') {
    const targetRow = Math.max(1, Math.min(rows - 2, Math.floor(rng() * rows)));
    const targetCol = Math.max(1, Math.min(cols - 2, Math.floor(rng() * cols)));
    const initial = new Set<string>();
    for (let c = 0; c < cols; c++) {
      if (!board[targetRow][c].isHole && !board[targetRow][c].isCherry) {
        initial.add(`${targetRow},${c}`);
      }
    }
    for (let r = 0; r < rows; r++) {
      if (!board[r][targetCol].isHole && !board[r][targetCol].isCherry) {
        initial.add(`${r},${targetCol}`);
      }
    }
    beamLines.push({ dir: 'h', index: targetRow, color: '#FB7185' });
    beamLines.push({ dir: 'v', index: targetCol, color: '#FBBF24' });
    specialBlasts.push({ type: 'striped_h', row: targetRow, col: targetCol });
    specialBlasts.push({ type: 'striped_v', row: targetRow, col: targetCol });

    // Place a free Repulsor Beam safely outside the blasted cross
    const safePool = normalCandidates.filter((p) => p.row !== targetRow && p.col !== targetCol);
    const spawnSpot = pickRandom(safePool, 1)[0];
    if (spawnSpot) {
      board[spawnSpot.row][spawnSpot.col].special = rng() > 0.5 ? 'striped_h' : 'striped_v';
      board[spawnSpot.row][spawnSpot.col].id = nextCellId();
      shockPoints.push({ pos: spawnSpot, color: '#FB7185' });
    }

    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    if (spawnSpot) expanded.delete(`${spawnSpot.row},${spawnSpot.col}`);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.55, 50);
    return {
      step,
      bonusMoves: 0,
      bonusTimeSec: 0,
      bannerTitle: 'MACH-9 PLASMA BLUR!',
      bannerSub: '2 Lanes Cleared + Free Repulsor Beam!',
      beamLines,
      shockPoints,
    };
  }

  // 3. Deep Trident — Orbital Stormbreaker (3 lightning columns + 2 Quantum Novas)
  if (heroId === 'deep_trident') {
    const colIndices = pickRandom(
      Array.from({ length: cols }, (_, i) => i),
      Math.min(3, cols)
    );
    const colSet = new Set(colIndices);
    const initial = new Set<string>();
    for (const colIdx of colIndices) {
      beamLines.push({ dir: 'v', index: colIdx, color: '#38BDF8' });
      specialBlasts.push({ type: 'striped_v', row: Math.floor(rows / 2), col: colIdx });
      for (let r = 0; r < rows; r++) {
        if (!board[r][colIdx].isHole && !board[r][colIdx].isCherry) {
          initial.add(`${r},${colIdx}`);
        }
      }
    }
    const safePool = normalCandidates.filter((p) => !colSet.has(p.col));
    const novas = pickRandom(safePool, 2);
    for (const sp of novas) {
      board[sp.row][sp.col].special = 'wrapped';
      board[sp.row][sp.col].id = nextCellId();
      shockPoints.push({ pos: sp, color: '#38BDF8' });
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    for (const sp of novas) expanded.delete(`${sp.row},${sp.col}`);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.6, 55);
    return {
      step,
      bonusMoves: 0,
      bonusTimeSec: 0,
      bannerTitle: 'ORBITAL STORMBREAKER!',
      bannerSub: '3 Lightning Strikes + 2 Quantum Novas!',
      beamLines,
      shockPoints,
    };
  }

  // 4. Mystic Prism — Time Stone Rewind (+3 Turns or +12s Blitz + shatters 5 priority targets)
  if (heroId === 'mystic_prism') {
    const picked = pickRandom(priorityTargets, 5);
    if (picked.length < 5) {
      const used = new Set(picked.map((p) => `${p.row},${p.col}`));
      picked.push(
        ...pickRandom(
          normalCandidates.filter((p) => !used.has(`${p.row},${p.col}`)),
          5 - picked.length
        )
      );
    }
    const initial = new Set<string>();
    for (const p of picked) {
      initial.add(`${p.row},${p.col}`);
      specialBlasts.push({ type: 'wrapped', row: p.row, col: p.col });
      shockPoints.push({ pos: p, color: '#E879F9' });
    }
    const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
    const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.5, 45);
    return {
      step,
      bonusMoves: level.isBlitz ? 0 : 3,
      bonusTimeSec: level.isBlitz || level.timeLimitSec ? 12 : 0,
      bannerTitle: 'TIME STONE REWIND!',
      bannerSub: level.isBlitz ? '+12 Seconds & 5 Targets Cleared!' : '+3 Turns & 5 Targets Cleared!',
      beamLines,
      shockPoints,
    };
  }

  // 5. Iron Titan — Mark-85 Unibeam (3x3 core + cross laser + free Infinity Singularity Orb!)
  const cr = Math.floor(rows / 2);
  const cc = Math.floor(cols / 2);
  const initial = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = cr + dr;
      const cc2 = cc + dc;
      if (rr >= 0 && rr < rows && cc2 >= 0 && cc2 < cols && !board[rr][cc2].isHole && !board[rr][cc2].isCherry) {
        initial.add(`${rr},${cc2}`);
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    if (!board[cr][c].isHole && !board[cr][c].isCherry) initial.add(`${cr},${c}`);
  }
  for (let r = 0; r < rows; r++) {
    if (!board[r][cc].isHole && !board[r][cc].isCherry) initial.add(`${r},${cc}`);
  }
  beamLines.push({ dir: 'h', index: cr, color: '#FBBF24' });
  beamLines.push({ dir: 'v', index: cc, color: '#34D399' });
  shockPoints.push({ pos: { row: cr, col: cc }, color: '#FBBF24' });
  specialBlasts.push({ type: 'rainbow', row: cr, col: cc });

  const orbSpot =
    board[cr][cc].sweet && !board[cr][cc].isHole && !board[cr][cc].isCherry
      ? { row: cr, col: cc }
      : pickRandom(normalCandidates, 1)[0];
  if (orbSpot && board[orbSpot.row][orbSpot.col].sweet) {
    board[orbSpot.row][orbSpot.col].special = 'rainbow';
    board[orbSpot.row][orbSpot.col].id = nextCellId();
  }
  const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
  if (orbSpot) expanded.delete(`${orbSpot.row},${orbSpot.col}`);
  const step = applyClearsToBoard(board, expanded, [], specialBlasts, 1.75, 70);
  return {
    step,
    bonusMoves: 0,
    bonusTimeSec: 0,
    bannerTitle: 'MARK-85 UNIBEAM!',
    bannerSub: 'Core Blast + Infinity Orb Forged!',
    beamLines,
    shockPoints,
  };
}

/**
 * THE INFINITY SNAP:
 * Disintegrates 50% of the entire board into golden cosmic dust (prioritizing Doom Shields,
 * Cryo Ice, Titanium Locks, Stones & Mission Targets), deals +120 Boss Damage, and awards 2× Score!
 */
export function applyInfinitySnap(
  boardInput: Cell[][],
  level: LevelConfig,
  rng: () => number = Math.random
): { step: StepResult; dustedPositions: Pos[] } {
  const board = cloneBoard(boardInput);
  const rows = board.length;
  const cols = board[0].length;
  const specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }> = [];

  const highPriority: Pos[] = [];
  const regularPool: Pos[] = [];
  const goalSweets = new Set<SweetType>(
    level.goals.filter((g) => g.type === 'collect' && g.sweet).map((g) => g.sweet!)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isHole || cell.isCherry) continue;
      if (cell.blocker !== 'none' || cell.jelly > 0 || (cell.sweet && goalSweets.has(cell.sweet))) {
        highPriority.push({ row: r, col: c });
      } else if (cell.sweet) {
        regularPool.push({ row: r, col: c });
      }
    }
  }

  const totalPlayable = highPriority.length + regularPool.length;
  const snapTargetCount = Math.max(8, Math.ceil(totalPlayable * 0.5));

  const shuffleInPlace = <T,>(arr: T[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  shuffleInPlace(highPriority);
  shuffleInPlace(regularPool);

  const selected = [...highPriority, ...regularPool].slice(0, snapTargetCount);
  const initial = new Set<string>();
  for (const p of selected) {
    initial.add(`${p.row},${p.col}`);
  }
  specialBlasts.push({ type: 'rainbow', row: Math.floor(rows / 2), col: Math.floor(cols / 2) });

  const expanded = expandClearsWithSpecials(board, initial, specialBlasts);
  const step = applyClearsToBoard(board, expanded, [], specialBlasts, 2.0, 120);
  return { step, dustedPositions: selected };
}

/**
 * LIVE BOSS COUNTERATTACK:
 * Villain sabotages up to 2 clean normal cells with Cryo Ice or Doomsday Energy Shields.
 */
export function applyBossCounterattack(
  boardInput: Cell[][],
  rng: () => number = Math.random
): { board: Cell[][]; corrupted: Pos[]; kind: 'ice' | 'shield' } {
  const board = cloneBoard(boardInput);
  const candidates: Pos[] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (
        !cell.isHole &&
        !cell.isCherry &&
        cell.sweet &&
        cell.special === 'none' &&
        cell.blocker === 'none' &&
        cell.jelly === 0
      ) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  const kind: 'ice' | 'shield' = rng() > 0.45 ? 'ice' : 'shield';
  const corrupted: Pos[] = [];
  const count = Math.min(2, candidates.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * candidates.length);
    const p = candidates.splice(idx, 1)[0];
    if (kind === 'ice') {
      board[p.row][p.col].blocker = 'ice';
    } else {
      board[p.row][p.col].jelly = 1;
    }
    corrupted.push(p);
  }

  return { board, corrupted, kind };
}
