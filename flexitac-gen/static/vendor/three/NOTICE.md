# Vendored three.js (CAD mode viewer)

The CAD mode's 3D view uses three.js, served from this folder so the app
stays offline and keeps its CSP (`default-src 'self'`).  Rectangular mode
never loads it.

- Package: npm `three` 0.186.1 (r186), MIT licence (`LICENSE` here,
  "Copyright 2010-2026 three.js authors").
- Tarball: `https://registry.npmjs.org/three/-/three-0.186.1.tgz`,
  SHA-256 `8cd068708ea44f2c73c944b1cead2ba2f0d5c15c8fc194e5700f4e4f4a033fe7`;
  its sha512 matched the registry's `dist.integrity` when downloaded
  (2026-10-20).

| File | Source in the tarball | SHA-256 |
| --- | --- | --- |
| `three.module.js` | `build/three.module.js`, unchanged | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |
| `three.core.js` | `build/three.core.js`, unchanged | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `OrbitControls.js` | `examples/jsm/controls/OrbitControls.js`, patched | `30386f7141d5ce5d5e0a3ab643e4eb16265f4564466108105ce449857f62fdda` |
| `LICENSE` | `LICENSE`, unchanged | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

The only patch: line 12 of `OrbitControls.js`, `} from 'three';` became
`} from './three.module.js';`.  The CSP forbids an inline import map, so the
bare specifier `three` cannot be resolved; the upstream file's SHA-256 is
`3d79d07ecb686b4e5d93232eedab255331c1beef711e13164eaa1f68655a5f2b`.
`tests/test_surface_web.py` re-hashes these files so they cannot drift.
