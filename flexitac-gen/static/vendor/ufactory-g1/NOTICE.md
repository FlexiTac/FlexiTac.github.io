# The xArm Gripper G1's 3D model (the Library's showcase)

The Library's first section (`library.html`) is a showcase: the hand-designed
FlexiTac sensor on UFACTORY's xArm Gripper G1 with UMI soft fingers.  The
twelve meshes in this folder draw that gripper, and nothing else uses them:
no sensor, part, sample or download of the generator.  They are served from
this folder so the app stays offline and keeps its Content Security Policy
(`default-src 'self'`).

## Whose they are

- The meshes are made from UFACTORY's 3D model of the xArm Gripper G1, the
  file `Gripper G1 3D File (With).stl` from UFACTORY's download centre
  (6,347,684 bytes, 126,952 triangles, SHA-256
  `6c59aabbd22823819af1face17752cfd5b32f43529ed08da9596148770de332f`; the
  copy is the project owner's download, whose address and date are not
  recorded).
- The 3D model and these meshes made from it are the property of UFACTORY.
- They are used by the project owner's decision of 2026-11-12, to show the
  gripper the sensor was designed for.
- They are not covered by this repository's Apache-2.0 licence: the
  repository's `LICENSE` grants no right in them, and nothing here licenses
  any other use of them.
- The file itself, unsplit and undecimated, is not published with this
  project.
- xArm and UFACTORY are trademarks of their owner; FlexiTac is not affiliated
  with UFACTORY, which does not endorse it or this sensor.

## What was modified

The file is one closed surface set in millimetres, the fingers closed.  It
was modified by FlexiTac-Gen 2026 (`tools/library_showcase.py`, which
rebuilds these files byte for byte from that file and refuses any other):

- split into the gripper's bodies by its connected components: the housing
  shell, the inner frame, the mounting flange, the pivot pins, the four links
  and, for each finger, its coupler and its pins; a sliver under the shell's
  face and each finger's pad with its screws are left out;
- each finger cut at y = 96 mm, where the UMI finger holder sits in this
  setup (the stock finger above it is removed; the cut is left open);
- each body decimated with quadric error metrics (half-edge collapses, so
  every vertex kept is a vertex of the file), its surface within 0.1 mm of
  the file's both ways and each face within 15 degrees of the way it faced,
  the deviation measured after (the number in each row, in mm);
- written as binary STL in millimetres, in the file's own axes; each file's
  80-byte header says "modified (split, decimated <= 0.1 mm) by FlexiTac-Gen
  2026, see NOTICE.md" (the couplers': "split, cut, decimated").

## Files

| File | What it is | Owner | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `body_shell.stl` | the housing shell | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.084 mm) | `17f20591f7ad00a5c19f8f915404df71b9332e971007f5afd58dc0ee83196000` |
| `body_frame.stl` | the inner frame | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.058 mm) | `c3fac3ded9752ee3101a4eb0752d687404ff87989601ed853ce9dbde1fe1201c` |
| `body_flange.stl` | the mounting flange | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.053 mm) | `53d5b7376b3b15bae4974e93f60fc565d487d32337c88163718ef9e58071038f` |
| `body_pins.stl` | the body's four pivot pins | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.050 mm) | `0e36e3e656bc3a5b684f20fe87aa1e76d3956eb7cd52e60fb638de4d2458424f` |
| `link_r_outer.stl` | the right outer link | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.070 mm) | `a30b4e83a108cdc8d3cafbbcdf4dc87e2c33828440f28776e2a601ce4ab40588` |
| `link_r_inner.stl` | the right inner link | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.059 mm) | `6d095d76626f53a5a7af281e86051fe18665dca5a56f5e03c9c83a19ffa66299` |
| `link_l_outer.stl` | the left outer link | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.070 mm) | `6ab58ca8f67ed33fd07016a82c606938c142ca283bc7ab04218b772783d7376c` |
| `link_l_inner.stl` | the left inner link | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.058 mm) | `93f51a6a5713d5ccec58ec8548ef63855d7e20561dd152dc81f273e20b3f8ea0` |
| `finger_r_coupler.stl` | the right finger's coupler, the stock finger cut where the UMI holder sits | the property of UFACTORY, not Apache-2.0 | modified: split, cut at the holder, decimated (quadric error metrics, 0.057 mm) | `a8526adbd71aaaad6bfd7b109baabc7eeaecfccc40fedb42624210455f3d5c8b` |
| `finger_r_pins.stl` | the right coupler's pins | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.050 mm) | `8af3cc1ad160fcac75e4db0f5a1b2b5546aeecdcecb639dd87fdf5f678c3ddf0` |
| `finger_l_coupler.stl` | the left finger's coupler, the stock finger cut where the UMI holder sits | the property of UFACTORY, not Apache-2.0 | modified: split, cut at the holder, decimated (quadric error metrics, 0.059 mm) | `b9c13ced96553fb2ee8038ccb78354f1a1ad1098818c2d9e8084bd524d0de849` |
| `finger_l_pins.stl` | the left coupler's pins | the property of UFACTORY, not Apache-2.0 | modified: split, decimated (quadric error metrics, 0.050 mm) | `be9bd6efe4aa156542836c82b13603a544760a88bab3e03f02afa8721841da9c` |

- `body_shell.stl`: the housing shell; from 64200 to 21142 triangles, 1057184 bytes, within 0.084 mm.
- `body_frame.stl`: the inner frame; from 2806 to 1002 triangles, 50184 bytes, within 0.058 mm.
- `body_flange.stl`: the mounting flange; from 2376 to 1428 triangles, 71484 bytes, within 0.053 mm.
- `body_pins.stl`: the body's four pivot pins; from 7544 to 2678 triangles, 133984 bytes, within 0.050 mm.
- `link_r_outer.stl`: the right outer link; from 5510 to 2476 triangles, 123884 bytes, within 0.070 mm.
- `link_r_inner.stl`: the right inner link; from 4654 to 2046 triangles, 102384 bytes, within 0.059 mm.
- `link_l_outer.stl`: the left outer link; from 5506 to 2472 triangles, 123684 bytes, within 0.070 mm.
- `link_l_inner.stl`: the left inner link; from 4664 to 2038 triangles, 101984 bytes, within 0.058 mm.
- `finger_r_coupler.stl`: the right finger's coupler, the stock finger cut where the UMI holder sits; from 2639 to 1279 triangles, 64034 bytes, within 0.057 mm.
- `finger_r_pins.stl`: the right coupler's pins; from 7332 to 2650 triangles, 132584 bytes, within 0.050 mm.
- `finger_l_coupler.stl`: the left finger's coupler, the stock finger cut where the UMI holder sits; from 2621 to 1261 triangles, 63134 bytes, within 0.059 mm.
- `finger_l_pins.stl`: the left coupler's pins; from 8666 to 3020 triangles, 151084 bytes, within 0.050 mm.

The finger holders and the soft fingers the showcase draws with them are
HandUMI's, under the Apache License 2.0: `web/library/NOTICE.md` (the
holder, `bodies/flexitac-g1/`) and `web/vendor/umi/NOTICE.md` (the finger).
