/**
 * A QR encoder, because the waiting card needs one and this project has no
 * runtime dependencies and no build step.
 *
 * Byte mode, error correction level M, versions 1–10 — an invite URL is about
 * eighty characters and version 10 holds 271 bytes, so there is headroom and
 * no reason to carry the tables for the other thirty versions. Anything longer
 * returns `null` and the card simply does not draw a code.
 *
 * Pure: no DOM, no network. `qrMatrix` returns a square array of booleans and
 * the caller decides how to draw it.
 */

// Total codewords per version, and the level-M block layout. ISO/IEC 18004
// Table 9: [error-correction codewords per block, group-1 blocks, group-2 blocks].
const CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const LEVEL_M = [
  [10, 1, 0], [16, 1, 0], [26, 1, 0], [18, 2, 0], [24, 2, 0],
  [16, 4, 0], [18, 4, 0], [22, 2, 2], [22, 3, 2], [26, 4, 1],
];
// Row/column centres of the alignment patterns, per version.
const ALIGNMENT = [
  [], [6, 18], [6, 22], [6, 26], [6, 30],
  [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

/** GF(256) with the QR generator polynomial x^8 + x^4 + x^3 + x^2 + 1. */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let index = 0, value = 1; index < 255; index += 1) {
  EXP[index] = value;
  LOG[value] = index;
  value = (value << 1) ^ (value & 0x80 ? 0x11d : 0);
}
for (let index = 255; index < 512; index += 1) EXP[index] = EXP[index - 255];

const multiply = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/**
 * The generator polynomial for `count` error-correction codewords, returned
 * highest power first — which is the order the division below indexes it in.
 * Built ascending because multiplying by (x + a^i) is clearer that way.
 */
function generator(count) {
  let poly = [1];
  for (let index = 0; index < count; index += 1) {
    const next = new Array(poly.length + 1).fill(0);
    for (let term = 0; term < poly.length; term += 1) {
      next[term] ^= multiply(poly[term], EXP[index]);
      next[term + 1] ^= poly[term];
    }
    poly = next;
  }
  return poly.reverse();
}

function remainder(data, count) {
  const poly = generator(count);
  const result = new Array(count).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let index = 0; index < count; index += 1) result[index] ^= multiply(poly[index + 1], factor);
  }
  return result;
}

/** The QR version that fits `length` bytes at level M, or 0 if none of 1–10 do. */
export function fittingVersion(length) {
  for (let version = 1; version <= 10; version += 1) {
    const [ecPerBlock, group1, group2] = LEVEL_M[version - 1];
    const dataCodewords = CODEWORDS[version - 1] - ecPerBlock * (group1 + group2);
    const header = 4 + (version < 10 ? 8 : 16);
    if (length * 8 + header <= dataCodewords * 8) return version;
  }
  return 0;
}

/** The interleaved data+error-correction codewords. Exported for the tests. */
export function codewordStream(bytes, version) {
  const bits = [];
  const push = (value, width) => {
    for (let index = width - 1; index >= 0; index -= 1) bits.push((value >> index) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);

  const [ecPerBlock, group1, group2] = LEVEL_M[version - 1];
  const dataCodewords = CODEWORDS[version - 1] - ecPerBlock * (group1 + group2);
  const capacity = dataCodewords * 8;
  for (let index = 0; index < 4 && bits.length < capacity; index += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let index = 0; codewords.length < dataCodewords; index += 1) codewords.push(index % 2 ? 0x11 : 0xec);

  // Split into blocks, then interleave data and then error correction, which
  // is what makes a burst of damage land across blocks instead of inside one.
  const shortLength = Math.floor(dataCodewords / (group1 + group2));
  const blocks = [];
  let cursor = 0;
  for (let index = 0; index < group1 + group2; index += 1) {
    const length = shortLength + (index < group1 ? 0 : 1);
    blocks.push(codewords.slice(cursor, cursor + length));
    cursor += length;
  }
  const parity = blocks.map((block) => remainder(block, ecPerBlock));

  const stream = [];
  for (let index = 0; index < shortLength + 1; index += 1) {
    for (const block of blocks) if (index < block.length) stream.push(block[index]);
  }
  for (let index = 0; index < ecPerBlock; index += 1) {
    for (const block of parity) stream.push(block[index]);
  }
  return stream;
}

const MASKS = [
  (row, column) => (row + column) % 2 === 0,
  (row) => row % 2 === 0,
  (row, column) => column % 3 === 0,
  (row, column) => (row + column) % 3 === 0,
  (row, column) => (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0,
  (row, column) => (row * column) % 2 + (row * column) % 3 === 0,
  (row, column) => ((row * column) % 2 + (row * column) % 3) % 2 === 0,
  (row, column) => ((row + column) % 2 + (row * column) % 3) % 2 === 0,
];

function blankMatrix(size) {
  return { modules: Array.from({ length: size }, () => new Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array(size).fill(false)) };
}

function placeFinder(grid, row, column) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const r = row + y, c = column + x;
      if (r < 0 || c < 0 || r >= grid.modules.length || c >= grid.modules.length) continue;
      const edge = Math.max(Math.abs(y - 3), Math.abs(x - 3));
      grid.modules[r][c] = y >= 0 && y <= 6 && x >= 0 && x <= 6 && edge !== 2;
      grid.reserved[r][c] = true;
    }
  }
}

function placeFunctionPatterns(grid, version) {
  const size = grid.modules.length;
  placeFinder(grid, 0, 0);
  placeFinder(grid, 0, size - 7);
  placeFinder(grid, size - 7, 0);
  for (let index = 8; index < size - 8; index += 1) {
    const dark = index % 2 === 0;
    grid.modules[6][index] = dark;
    grid.reserved[6][index] = true;
    grid.modules[index][6] = dark;
    grid.reserved[index][6] = true;
  }
  const centres = ALIGNMENT[version - 1];
  const last = centres[centres.length - 1];
  for (const row of centres) {
    for (const column of centres) {
      // Only the three that would land on a finder are skipped. Skipping every
      // centre that is already reserved also drops the ones sitting on the
      // timing pattern, which are real — and from version 7 that silently
      // shifts every data module after them.
      if ((row === 6 && column === 6) || (row === 6 && column === last)
        || (row === last && column === 6)) continue;
      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          grid.modules[row + y][column + x] = Math.max(Math.abs(y), Math.abs(x)) !== 1;
          grid.reserved[row + y][column + x] = true;
        }
      }
    }
  }
  // The one module that is always dark, and the format-information strips.
  grid.modules[size - 8][8] = true;
  grid.reserved[size - 8][8] = true;
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) { grid.reserved[8][index] = true; grid.reserved[index][8] = true; }
  }
  for (let index = 0; index < 8; index += 1) {
    grid.reserved[8][size - 1 - index] = true;
    if (index < 7) grid.reserved[size - 1 - index][8] = true;
  }
}

function placeData(grid, stream) {
  const size = grid.modules.length;
  let bit = 0;
  const next = () => {
    const value = bit < stream.length * 8 && ((stream[bit >> 3] >> (7 - (bit & 7))) & 1) === 1;
    bit += 1;
    return value;
  };
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right -= 1;
    for (let step = 0; step < size; step += 1) {
      const upward = ((size - 1 - right) >> 1) % 2 === 0;
      const row = upward ? size - 1 - step : step;
      for (const column of [right, right - 1]) {
        if (grid.reserved[row][column]) continue;
        grid.modules[row][column] = next();
      }
    }
  }
}

function formatBits(mask) {
  // Level M is 00. BCH(15,5) with the QR generator, then the fixed XOR mask.
  let value = (0b00 << 3) | mask;
  let encoded = value << 10;
  for (let index = 4; index >= 0; index -= 1) {
    if ((encoded >> (10 + index)) & 1) encoded ^= 0b10100110111 << index;
  }
  return (((value << 10) | encoded) ^ 0b101010000010010);
}

/**
 * Both copies of the format information, written most significant bit first
 * along the position list — which is the half of this that is easy to get
 * backwards, and produces a code that is perfectly valid except that no reader
 * believes its error-correction level.
 */
function placeFormat(grid, mask) {
  const size = grid.modules.length;
  const bits = formatBits(mask);
  const at = (index) => ((bits >> (14 - index)) & 1) === 1;
  const first = [...Array(6).keys()].map((index) => [8, index])
    .concat([[8, 7], [8, 8], [7, 8]], [...Array(6).keys()].map((index) => [5 - index, 8]));
  // Seven in the column, then eight along the row. The dark module at
  // (size - 8, 8) sits immediately above that column and is not part of this.
  const second = [...Array(7).keys()].map((index) => [size - 1 - index, 8])
    .concat([...Array(8).keys()].map((index) => [8, size - 8 + index]));
  first.concat(second).forEach(([row, column], index) => {
    grid.modules[row][column] = at(index % 15);
  });
}

function versionBits(version) {
  let encoded = version << 12;
  for (let index = 5; index >= 0; index -= 1) {
    if ((encoded >> (12 + index)) & 1) encoded ^= 0b1111100100101 << index;
  }
  return (version << 12) | encoded;
}

function placeVersion(grid, version) {
  if (version < 7) return;
  const size = grid.modules.length;
  const bits = versionBits(version);
  for (let index = 0; index < 18; index += 1) {
    const dark = ((bits >> index) & 1) === 1;
    const row = Math.floor(index / 3);
    const column = index % 3;
    grid.modules[row][size - 11 + column] = dark;
    grid.reserved[row][size - 11 + column] = true;
    grid.modules[size - 11 + column][row] = dark;
    grid.reserved[size - 11 + column][row] = true;
  }
}

/** The ISO penalty score, which is what decides the mask. */
function penalty(modules) {
  const size = modules.length;
  let score = 0;
  const run = (get) => {
    for (let a = 0; a < size; a += 1) {
      let length = 1;
      for (let b = 1; b < size; b += 1) {
        if (get(a, b) === get(a, b - 1)) length += 1;
        else { if (length >= 5) score += length - 2; length = 1; }
      }
      if (length >= 5) score += length - 2;
    }
  };
  run((a, b) => modules[a][b]);
  run((a, b) => modules[b][a]);
  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) {
      const value = modules[row][column];
      if (value === modules[row][column + 1] && value === modules[row + 1][column]
        && value === modules[row + 1][column + 1]) score += 3;
    }
  }
  const pattern = [true, false, true, true, true, false, true];
  const light = [false, false, false, false];
  const matches = (get, a, start, sequence) =>
    sequence.every((value, offset) => get(a, start + offset) === value);
  for (const get of [(a, b) => modules[a][b], (a, b) => modules[b][a]]) {
    for (let a = 0; a < size; a += 1) {
      for (let start = 0; start <= size - 7; start += 1) {
        if (!matches(get, a, start, pattern)) continue;
        const before = start >= 4 && matches(get, a, start - 4, light);
        const after = start + 11 <= size && matches(get, a, start + 7, light);
        if (before || after) score += 40;
      }
    }
  }
  const dark = modules.flat().filter(Boolean).length;
  score += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return score;
}

/**
 * The module matrix for `text`, or `null` if it does not fit in versions 1–10.
 * No quiet zone: the caller adds it, because how much margin a code needs
 * depends on what it is drawn on.
 */
export function qrMatrix(text, { mask: forced = null } = {}) {
  const bytes = [...new TextEncoder().encode(String(text))];
  const version = fittingVersion(bytes.length);
  if (!version) return null;
  const stream = codewordStream(bytes, version);
  const size = version * 4 + 17;

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    if (forced !== null && mask !== forced) continue;
    const grid = blankMatrix(size);
    placeFunctionPatterns(grid, version);
    placeVersion(grid, version);
    placeData(grid, stream);
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        if (!grid.reserved[row][column] && MASKS[mask](row, column)) {
          grid.modules[row][column] = !grid.modules[row][column];
        }
      }
    }
    placeFormat(grid, mask);
    const score = penalty(grid.modules);
    if (!best || score < best.score) best = { score, modules: grid.modules };
  }
  return best.modules;
}
