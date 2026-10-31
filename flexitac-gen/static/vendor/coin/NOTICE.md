# Vendored coin photo (coin for scale)

Every view of a board shows a US quarter beside it for scale (`web/app.js`
`coinArt`, `coinPlane`); its face is this photo, served from this folder so
the app stays offline and keeps its CSP (`img-src 'self' data:`).

- Source: Wikimedia Commons, "50 State and Territories quarter obverse
  (Philadelphia).jpg", a United States Mint image from
  `https://www.usmint.gov/news/image-library/50-state-quarters-program`
  (2000 x 2000 px, sRGB), downloaded 2026-10-30, SHA-256
  `b0a32f6f46044b0eef6f0dffe3df8c6485f64dfe99f82ea12bc5bdb274b8a549`.
- Licence: public domain, a work of the United States federal government
  (17 U.S.C. 105); the design is John Flanagan's Washington quarter obverse
  (1932, as restored in 1999).

| File | Made from the source | SHA-256 |
| --- | --- | --- |
| `us-quarter-obverse.jpg` | cropped to the coin's edge (x 17..1980, y 7..1992), resized to 720 x 720 (Lanczos), white outside a circle of the full width, JPEG quality 84, progressive | `feb75c09a1b61ffa5fb5f1a7831b2d4c616bec1a0dc3e7732a9ef2d53bd1480d` |

The app clips the photo to the coin's circle (`index.html` `#coin-clip`) and
draws it at the quarter's 24.26 mm in the board's millimetres; without the
photo the coin is a plain metal disk of the same size.
