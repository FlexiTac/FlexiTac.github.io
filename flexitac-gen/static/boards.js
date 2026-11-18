// The FlexiTac hardware's own order files, offered beside the generator's (the user's request of 2026-11-17: "把
// instruction里面的fpc gerber也都放到这边可以直接download；另外 所有的card加上一条：ordering and fabrication：放上instruction
// link；reading board download ... 小于32x16的sensor用32x16的board，小于32x32大于16的，用32x32的board"): the FlexiTac
// fabrication guide, the original pad's two FPC Gerber ZIPs (static/vendor/flexitac-v2/, the showcase's window) and the
// two reading boards' bundles (static/vendor/flexitac-reader/: each its Gerber ZIP, BOM and pick-and-place), all CC
// BY-NC 4.0 material of Columbia University (each folder's NOTICE.md; tools/flexitac_downloads.py pins the bytes).
// The Library (web/library.js: every sensor's window and the showcase's) and the generator (web/app.js: step 3) read
// window.FlexiTacBoards; the rule names a sensor's board from its rows and columns alone (no per-sensor data), the
// sensor's tails staying one pin per line (the user's answer to the plan, "tail C": the page only names the board).
// Gen's step 3 names the board of the design's tails (tailsBoard): its lines' when each tail is one pin per line, the
// board with those connectors when the tails were sized to a reader's (the review of 2026-11-17).
"use strict";

(() => {
  const READER = "static/vendor/flexitac-reader/";
  const FPC = "static/vendor/flexitac-v2/";
  // The two boards (the guide's "Reading Board 32x16", "This one is enough for reading above sensor", and "Reading
  // Board 32x32", "Develop purpose"): the bundle's name and its bytes (tools/flexitac_downloads.py BOARDS), the pins of
  // its two FFC connectors, fewer first (its BOM's FPC1 and FPC2; surface/reader.py READERS' 32x16 and 32x32).
  const BOARDS = Object.freeze({
    "32x16": Object.freeze({id: "32x16", label: "32 × 16", file: "FlexiTac_reading_board_32x16.zip", bytes: 50257, pins: Object.freeze([16, 32])}),
    "32x32": Object.freeze({id: "32x32", label: "32 × 32", file: "FlexiTac_reading_board_32x32.zip", bytes: 92579, pins: Object.freeze([32, 32])}),
  });
  const whole = value => Number.isInteger(value) && value > 0;
  // A sensor's reading board by its lines: the larger of rows and columns at most 32 and the smaller at most 16, the
  // 32 x 16 board; the larger at most 32, the 32 x 32 board; else none (null: more than 32 lines on a side).
  function readingBoard(rows, columns) {
    if (!(whole(rows) && whole(columns))) return null;
    const [large, small] = [Math.max(rows, columns), Math.min(rows, columns)];
    return large <= 32 && small <= 16 ? BOARDS["32x16"] : large <= 32 ? BOARDS["32x32"] : null;
  }
  // The board a design's tails plug into (Gen's step 3; the review of 2026-11-17): tails of one pin per line (no pins
  // given, or each tail's its lines': the Reader none, tail C) the board their lines take (readingBoard); tails sized to
  // a reader's connectors (Gen by Surface's Reader, Rectangular's connector pins) the board with those connectors, else
  // none (the 16 x 16 and 48 x 48 readers, any other pins).  {board, why}: why says there is none; null for no sensor
  // (lines or pins not whole numbers, a tail of fewer pins than its lines: the form's own error).
  function tailsBoard(rows, columns, rowPins = null, columnPins = null) {
    const pins = [rowPins ?? rows, columnPins ?? columns];
    if (!(whole(rows) && whole(columns) && pins.every(whole) && pins[0] >= rows && pins[1] >= columns)) return null;
    if (pins[0] === rows && pins[1] === columns) {
      const board = readingBoard(rows, columns);
      return {board, why: board ? null : "more than 32 lines"};
    }
    const sorted = pins.sort((a, b) => a - b).join();
    const board = Object.values(BOARDS).find(item => item.pins.join() === sorted) || null;
    return {board, why: board ? null : "tails for another reader"};
  }
  window.FlexiTacBoards = Object.freeze({
    // The FlexiTac Hardware Fabrication Guide at its ordering steps (the generator's Ordering notes link it since
    // 2026-11-06).
    GUIDE: "https://docs.google.com/document/d/1bvz6AL7BUkhj4Dj7n9DFXTjnGIX4-ziN8-smiCKpVZU/edit?tab=t.0#heading=h.kk7d14qme9db",
    BOARDS,
    readingBoard,
    tailsBoard,
    href: board => READER + board.file,
    NOTICE: `${READER}NOTICE.md`,
    // The original pad's FPC Gerber ZIPs, unchanged (the showcase's window; tools/flexitac_downloads.py FPC_FILES).
    FPC: Object.freeze([
      Object.freeze({kind: "top-gerber", label: "Top FPC Gerber ZIP", href: `${FPC}Gerber_Top_FPC_2026-03-02.zip`, file: "Gerber_Top_FPC_2026-03-02.zip", bytes: 52816}),
      Object.freeze({kind: "bottom-gerber", label: "Bottom FPC Gerber ZIP", href: `${FPC}Gerber_Bottom_FPC_2026-03-02.zip`, file: "Gerber_Bottom_FPC_2026-03-02.zip", bytes: 66670}),
    ]),
  });
})();
