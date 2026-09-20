import test from 'node:test';
import assert from 'node:assert/strict';
import { codewordStream, fittingVersion, qrMatrix } from '../src/qr.js';

const draw = (matrix) => matrix.map((row) => row.map((cell) => cell ? '#' : '.').join('')).join('\n');

/**
 * The two golden matrices at the bottom were checked module-for-module against
 * an independent encoder (python `qrcode`, level M, byte mode) while this one
 * was written. That comparison found three real bugs, none of them visible by
 * looking at the output: a Reed–Solomon generator built in ascending order and
 * indexed as if descending; format information written least significant bit
 * first; and alignment patterns whose centre sits on the timing row being
 * skipped, which from version 7 shifts every data module placed after them.
 *
 * What is NOT verified here, or anywhere in this repo: that a real camera
 * reads one. Nothing in this sandbox has one.
 */
const INVITE = 'https://schness.com/game.html?game=00000000-0000-4000-8000-000000000001&mode=online';

test('a one-byte payload encodes to the matrix an independent encoder produces', () => {
  assert.equal(draw(qrMatrix('a')), GOLDEN_A);
});

test('a real invite url encodes to the matrix an independent encoder produces', () => {
  assert.equal(draw(qrMatrix(INVITE)), GOLDEN_INVITE);
});

test('the version is the smallest that holds the payload at level M', () => {
  // Boundaries of versions 1–10 in byte mode: one byte past each is the next
  // version up. A capacity table out by one produces a code that drops
  // whatever overflowed, and nothing about it looks wrong.
  for (const [length, version] of [[1, 1], [14, 1], [15, 2], [26, 2], [27, 3],
    [42, 3], [43, 4], [62, 4], [63, 5], [84, 5], [85, 6], [106, 6], [107, 7],
    [122, 7], [123, 8], [152, 8], [153, 9], [180, 9], [181, 10], [213, 10]]) {
    assert.equal(fittingVersion(length), version, `${length} bytes`);
  }
  assert.equal(fittingVersion(214), 0, 'anything past version 10 has no code');
  assert.equal(qrMatrix('x'.repeat(214)), null);
});

test('the codeword stream is every block, data first then error correction', () => {
  // Version 8 at level M is two blocks of 38 data codewords and two of 39,
  // with 22 error-correction codewords each: 154 + 88 = 242.
  const bytes = [...new TextEncoder().encode('x'.repeat(150))];
  assert.equal(fittingVersion(bytes.length), 8);
  assert.equal(codewordStream(bytes, 8).length, 242);
});

test('the function patterns are where a reader looks for them', () => {
  const matrix = qrMatrix(INVITE);
  const size = matrix.length;
  assert.equal(size, 37, 'an invite url is a version 5 code');
  for (const [top, left] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const ring = Math.max(Math.abs(row - 3), Math.abs(column - 3));
        assert.equal(matrix[top + row][left + column], ring !== 2, `finder at ${top},${left}`);
      }
    }
  }
  for (let index = 8; index < size - 8; index += 1) {
    assert.equal(matrix[6][index], index % 2 === 0, `horizontal timing at ${index}`);
    assert.equal(matrix[index][6], index % 2 === 0, `vertical timing at ${index}`);
  }
  assert.equal(matrix[size - 8][8], true, 'the module that is always dark');
});

test('both copies of the format information say level M and the same mask', () => {
  const matrix = qrMatrix(INVITE);
  const size = matrix.length;
  const read = (cells) => cells.reduce((value, [row, column]) =>
    (value << 1) | (matrix[row][column] ? 1 : 0), 0) ^ 0b101010000010010;
  const first = read([...Array(6).keys()].map((index) => [8, index])
    .concat([[8, 7], [8, 8], [7, 8]], [...Array(6).keys()].map((index) => [5 - index, 8])));
  const second = read([...Array(7).keys()].map((index) => [size - 1 - index, 8])
    .concat([...Array(8).keys()].map((index) => [8, size - 8 + index])));
  assert.equal(first, second, 'the two copies of the format information disagree');
  assert.equal((first >> 13) & 0b11, 0b00, 'error correction level M');
  assert.ok(((first >> 10) & 0b111) < 8, 'the mask is one of the eight');
});

const GOLDEN_A = `#######..#.##.#######
#.....#.#.##..#.....#
#.###.#.##.#..#.###.#
#.###.#.#.##..#.###.#
#.###.#..#..#.#.###.#
#.....#...##..#.....#
#######.#.#.#.#######
........##...........
#.....#.#.##.##..###.
#..##......###.###..#
..#.###..##.#.##.....
.#.#.#.##..#####.#.#.
##.#..####.##########
........##..#.....#.#
#######..###.#..####.
#.....#...#...#...###
#.###.#..###.#..###..
#.###.#..#.#####.#...
#.###.#..#.###.###.##
#.....#...######.#...
#######.#.#.#..#..##.`;

const GOLDEN_INVITE = `#######.#.###..###..#...#.#.#.#######
#.....#..#.####.#.#.###..##...#.....#
#.###.#.#..#####.#.#.########.#.###.#
#.###.#..#..#...##...##..##...#.###.#
#.###.#..#....###....##.#.#.#.#.###.#
#.....#.####..##..#.#...#.#.#.#.....#
#######.#.#.#.#.#.#.#.#.#.#.#.#######
..................#.#...#.##.........
#.#...##.#.######...#.##..##...#..#.#
#...#...###.#.#.##.#####..##.##....##
###..###..##..#.##.######.#########.#
..#..#..##..#.###.#.#.....#..##......
.#.#####..##......###..##..#..#.....#
.#.##..#...##.##.####.###..##.##.#.##
#...#.#####....##..#.###.###.##..####
#.####..#..#.##...#.....#..#...###.#.
#..#..######..###..##.#...##.##......
##..##...###.#.....##.##.###.##....##
#..#..##.....###.###.#.##..########.#
.####..##.#.#.#.#..##.....#..###.....
#....####.#....#..#.#..##..#..##...#.
..#......#..##.#.####..##..##.#.....#
#.....###....#.##..#.###.###.##..####
####.#.#.###..#....##.......#..###...
##.#.####.#.##.##..##.##..##.##....##
.#.#.#.###...####..#####.###..#.....#
##.##.#..#...#.#####.#.###.###..###.#
..#.......#..#.##...#.#...#....##..##
##.##.###...#.....#.#..##.#.#####..##
........#####.##.####..##...#...#..##
#######.#..#.#####.#.###.##.#.#.#..##
#.....#..#.#..#....##.###..##...#....
#.###.#..#...#.##...#.##..#######..##
#.###.#..#.##.###..###.#.##.##..#..#.
#.###.#.#...####.#####.##....#.####.#
#.....#..#.###.....##.....#####.#....
#######.#..##.#...##..###..##.##.#..#`;
