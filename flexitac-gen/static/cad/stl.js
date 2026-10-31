// STL parsing for the CAD view: triangles in file order, so facet i here is
// facet i of the server (surface/mesh.py).  Display and picking only; every
// number the app reports comes from the server.  The detection order, the
// ASCII grammar and the facet cap are the server's, so both sides read the
// same facets (a mismatch turns clicking on the part off).

const BINARY_HEADER = 84;
const BINARY_FACET = 50;
// surface/mesh.py MAX_FACETS: larger meshes are refused before anything is allocated.
export const MAX_FACETS = 1_000_000;
// surface/mesh.py _MAX_NAME_BYTES: the longest 'solid' or 'endsolid' line (after the word).
const MAX_NAME_BYTES = 4096;
// Python float() syntax for the ASCII coordinates (inf/nan are refused as non-finite).
const DIGITS = String.raw`\d+(?:_\d+)*`;
const NUMBER = new RegExp(String.raw`^[+-]?(?:(?:${DIGITS}(?:\.(?:${DIGITS})?)?|\.${DIGITS})(?:[eE][+-]?${DIGITS})?|inf(?:inity)?|nan)$`, "i");

function looksAscii(bytes) {
  // surface/mesh.py _looks_ascii: "solid" after an optional BOM and white space, no NUL in the first 512 bytes.
  const head = bytes.subarray(0, 512);
  if (head.includes(0)) return false;
  let start = head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf ? 3 : 0;
  while (start < head.length && head[start] <= 32) start += 1;
  return new TextDecoder("ascii").decode(head.subarray(start, start + 5)).toLowerCase() === "solid";
}

function tooMany(count) {
  return new Error(`${count.toLocaleString("en-US")} facets; at most ${MAX_FACETS.toLocaleString("en-US")} are accepted.`);
}

function binaryPositions(view, count) {
  if (count > MAX_FACETS) throw tooMany(count);
  const positions = new Float32Array(count * 9);
  for (let facet = 0; facet < count; facet += 1) {
    const offset = BINARY_HEADER + BINARY_FACET * facet + 12;
    for (let k = 0; k < 9; k += 1) positions[9 * facet + k] = view.getFloat32(offset + 4 * k, true);
  }
  return positions;
}

function utf8Length(text) {
  return new TextEncoder().encode(text).length;
}

function asciiPositions(bytes) {
  // surface/mesh.py _ascii_triangles: tokens split at ASCII white space; "solid" and the rest of its
  // line (the name, any words), then facet normal n n n / outer loop / 3 x vertex x y z / endloop /
  // endfacet, "endsolid" and the rest of its line; several solids may follow each other.  When no
  // line follows (a file written on one line), a name is the words up to "facet" or "endsolid"
  // (after "solid") or up to "solid" (after "endsolid").
  const text = new TextDecoder("utf-8").decode(bytes);
  const TOKEN = /[^ \t\n\r\f\v]+/g;
  const LINE_END = /[\r\n]/g;
  // The last line break followed by a token (-1: the file is written on one line).
  let contentEnd = text.length;
  while (contentEnd > 0 && " \t\n\r\f\v".includes(text[contentEnd - 1])) contentEnd -= 1;
  const lastBreak = contentEnd > 0 ? Math.max(text.lastIndexOf("\n", contentEnd - 1), text.lastIndexOf("\r", contentEnd - 1)) : -1;
  const values = [];
  let match = TOKEN.exec(text);
  const lower = () => match[0].toLowerCase();
  const advance = () => { match = TOKEN.exec(text); };
  const expect = word => {
    if (match === null || lower() !== word) throw new Error(`Expected '${word}' in the ASCII STL, found ${match !== null ? `'${match[0].slice(0, 40)}'` : "the end of the file"}.`);
    advance();
  };
  const expectLine = (word, stops) => {
    // The word and the rest of its line (the solid's name), at most MAX_NAME_BYTES bytes.
    if (match === null || lower() !== word) expect(word);
    const start = match.index + match[0].length;
    if (stops) {
      advance();
      let last = start;
      while (match !== null && !stops.includes(lower())) {
        last = match.index + match[0].length;
        if (last - start > MAX_NAME_BYTES) break;
        advance();
      }
      if (utf8Length(text.slice(start, last)) > MAX_NAME_BYTES) {
        throw new Error(`The solid's name after '${word}' in the ASCII STL is longer than ${MAX_NAME_BYTES} bytes.`);
      }
      return;
    }
    LINE_END.lastIndex = start;
    const lineEnd = LINE_END.exec(text);
    const end = lineEnd === null ? text.length : lineEnd.index;
    if (end - start > MAX_NAME_BYTES || utf8Length(text.slice(start, end)) > MAX_NAME_BYTES) {
      throw new Error(`The '${word}' line of the ASCII STL is longer than ${MAX_NAME_BYTES} bytes.`);
    }
    TOKEN.lastIndex = end;
    advance();
  };
  const number = () => {
    if (match === null) throw new Error("The ASCII STL ends inside a facet.");
    const token = match[0];
    if (!NUMBER.test(token)) throw new Error(`'${token.slice(0, 40)}' is not a number.`);
    advance();
    return Number(token.replace(/_/g, "").replace(/^([+-]?)inf(inity)?$/i, "$1Infinity"));
  };
  while (match !== null) {
    // No line follows the word "solid": the solid is written on one line.
    const oneLine = lastBreak < match.index + match[0].length;
    expectLine("solid", oneLine ? ["facet", "endsolid"] : null);
    while (match !== null && lower() === "facet") {
      advance();
      expect("normal");
      for (let k = 0; k < 3; k += 1) {
        // The server refuses a non-finite normal too.
        if (!Number.isFinite(number())) throw new Error(`Facet ${values.length / 9} has a non-finite coordinate.`);
      }
      expect("outer");
      expect("loop");
      for (let corner = 0; corner < 3; corner += 1) {
        expect("vertex");
        values.push(number(), number(), number());
      }
      expect("endloop");
      expect("endfacet");
      if (values.length / 9 > MAX_FACETS) throw tooMany(values.length / 9);
    }
    expectLine("endsolid", oneLine ? ["solid"] : null);
  }
  return new Float32Array(values);
}

/** Parse an STL ArrayBuffer: {positions (Float32, 9 per facet, file units), facets, format}. */
export function parseStl(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const count = bytes.length >= BINARY_HEADER ? view.getUint32(80, true) : null;
  let positions;
  let format;
  if (count !== null && BINARY_HEADER + BINARY_FACET * count === bytes.length) {
    positions = binaryPositions(view, count);
    format = "binary";
  } else if (looksAscii(bytes)) {
    positions = asciiPositions(bytes);
    format = "ascii";
  } else if (count !== null && BINARY_HEADER + BINARY_FACET * count > bytes.length) {
    throw new Error(`The binary STL announces ${count.toLocaleString("en-US")} facets but the file is too short for them (truncated).`);
  } else if (count !== null && count > 0) {
    // A padded binary STL: the announced facets are complete (as on the server).
    positions = binaryPositions(view, count);
    format = "binary";
  } else {
    throw new Error("Not an STL file (neither binary nor ASCII).");
  }
  if (!positions.length) throw new Error("The STL holds no facet.");
  for (let i = 0; i < positions.length; i += 1) {
    if (!Number.isFinite(positions[i])) throw new Error(`Facet ${Math.floor(i / 9)} has a non-finite coordinate.`);
  }
  return {positions, facets: positions.length / 9, format};
}
