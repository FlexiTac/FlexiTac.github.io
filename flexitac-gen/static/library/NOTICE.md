# The Library's gripper parts

The Library (the first page, `./`, and Gen by Surface at `gen.html?part=<id>`) shows sensors
already fitted to these gripper fingers; their files are served from this
folder so the app stays offline and keeps its Content Security Policy
(`default-src 'self'`).  The UMI fin-ray finger, the page's default part, is
served from `web/vendor/umi/` with its own notice.  The bodies the Library
draws around the seven grippers' fingers, in its 3D view and its pictures,
are tabled in their own section below.  The showcase at the top of the
Library has a section of its own, after them: its gripper is UFACTORY's 3D
model, which is not an open-source file and has its own notice,
[`../vendor/ufactory-g1/NOTICE.md`](../vendor/ufactory-g1/NOTICE.md).

## Sources

Each file in the table below is a third-party file, taken from its upstream
repository at the pinned commit, unchanged unless its Change column says
otherwise; each licence text is that repository's (or model folder's) own
`LICENSE` at the same commit, unchanged.

- HandUMI hardware, `https://github.com/murobotics-ai/handumi-hw` at
  `144827862d4e2d5cd2d331ce7eed1374d3c769df`, Apache License 2.0 (Copyright
  2026 BrikHMP18): the HandUMI replicas of the ARX X5 and Trossen WidowX AI
  (its sock, and the backbone under it) gripper tips, in millimetres, and of
  the MakerMods Metal Arm gripper tip, in metres, and the UMI fin-ray finger
  the tapered tips are cut from
  (`hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl`, the
  page's default part, `web/vendor/umi/`).
- MuJoCo Menagerie, `https://github.com/google-deepmind/mujoco_menagerie` at
  `f3b6013629c7b94f8ee93fd977b161fa8350f9bc`:
  `franka_emika_panda` (Apache License 2.0; the model of the Franka Robotics
  Panda, derived from `franka_ros`), `trossen_wx250s` (BSD-3-Clause,
  Copyright (c) 2023, Trossen Robotics; the WidowX 250, derived from
  `interbotix_ros_manipulators`), `trossen_wxai` (BSD-3-Clause, Copyright
  (c) 2025, Trossen Robotics; the WidowX AI, derived from
  `trossen_arm_description`) and `arx_l5` (BSD-3-Clause, Copyright (c)
  2023-2025, ARXrobotics; the ARX X5, derived from `ARX_Model`).
- I2RT, `https://github.com/i2rt-robotics/i2rt` at
  `120c3c81400171174604e503943f8d1ebc891058`, MIT License, Copyright (c)
  I2RT Robotics: the YAM crank gripper's left tip
  (`i2rt/robot_models/gripper/crank_4310/assets/tip_left.stl`), in metres,
  and its body and right tip.
- unitree_ros, `https://github.com/unitreerobotics/unitree_ros` at
  `b579bbe1671bf330e42f6fc1b9cd75a73b0879a7`, BSD-3-Clause, Copyright (c)
  2016-2022 HangZhou YuShu TECHNOLOGY CO.,LTD. ("Unitree Robotics"): the
  Dex1-1 gripper's finger
  (`robots/g1_description/meshes/Dex1_finger_link_1.STL`), in metres, and
  its base link.

## Modified file

`meshes/franka-hand.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is the convex hull of the menagerie's
`franka_emika_panda/assets/finger_1.obj` (SHA-256
`cf239e9aca26bba09dbbf1c544c47d87cfc9a2f0637c8bb786af750b6d4eca44`), scaled
from metres to millimetres and written as a binary STL of 78 facets, changed
by the FlexiTac-Gen project in 2026.  The stock pad's face is cross-grooved
(V-grooves 4.5 mm wide and 1.6 mm deep); a laminated sensor bridges the
grooves, so its face is the hull's plane.

The twenty-six `meshes/umi-<kind>-tip<w>.stl` (`<kind>` one of `trap`,
`convex`, `concave`, `short-trap`, `short-convex` and `pointed`) are not
upstream files either (Apache License 2.0, section 4(b)): each is the
HandUMI `UMI-Soft-Gripper-Finger.stl` (SHA-256
`63331c666d485de462f3c7c80eb4200fd2bf98ac325095f5b0e8774a95dc8442`) with
its last 75 mm above the tip (40 mm for `short-trap` and `short-convex`,
50 mm for `pointed`) narrowed, symmetrically, to a tip of `<w>` mm (21.8,
17.8, 13.8, 9.8 or 5.8; 2 for `pointed`): straight sides (a trapezoid:
`trap`, `short-trap`), circular-arc sides tangent to the full width where
the taper starts (a convex arc: `convex`, `short-convex`, and `pointed`,
whose two arcs meet at its point) or circular-arc sides tangent to the
finger's axis at the tip (a concave arc: `concave`), cut through the whole
finger, the part above the taper unchanged; written as a binary STL in
millimetres, changed by the FlexiTac-Gen project in 2026 (the trapezoid and
convex arc tips over 75 mm on 2026-11-05, the others on 2026-11-16).

## Files

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `meshes/franka-hand.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/finger_1.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: convex hull of finger_1.obj, m to mm, binary STL | `3ac26349fc85ab971b81696e31ac88955f45d065ddc1254de376fea9d89b6c2c` |
| `meshes/widowx-250.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_10_gripper_finger.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | unchanged | `6a459bd4ef07eb5c4687e258bd9564004e741437e2e668af7ed31964567d8f90` |
| `meshes/trossen-widowx-ai.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/Trossen-WidowXAI/WXAI-LEFT-Gripper-sock.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `7e2792c557d7e15681b0a3cb693b728931c620d34d326f9f5409ba966372ee8c` |
| `meshes/arx-x5.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/ARX-X5-2023/ARX-X5-2023-LEFT-Gripper.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `5cf0e92353f4f5787b086eb518ff1d529ea41eb07502cdc3a2979766ccdd3018` |
| `meshes/i2rt-yam.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_left.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | unchanged | `b70f8c1e32ccfae03fec46ac10a0f04195347bc530ee761143a5d7c5bb07ae07` |
| `meshes/unitree-dex1.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_finger_link_1.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | unchanged | `7cd2ff199556e3955547a34c75ed9ea777fb7d704fc98e7318d0f67e4aaedf5a` |
| `meshes/makermods-metal.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/MakerMods-Metal/metal-arm-gripper-tip-left.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `f480c8fb9fbe5027ce0741436cd3c60c77702c2eec2b80d87f5829c4adca5925` |
| `meshes/umi-short-trap-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 40 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `d6bc8d807035eac4d3910f20bca4d11b6b50d1bd61bd618a8cb983b348c76141` |
| `meshes/umi-short-trap-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 40 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `81bcbbe8c5ce3f3b4dea48eb2a8f0d91402277f849ae096ae054f1aeb2c3db74` |
| `meshes/umi-short-trap-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 40 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `9d6813150101f93fd2ddeaad7b6f1a97356cc329866fa1aea9b52d30c6e3a197` |
| `meshes/umi-short-trap-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 40 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `89bd2cb2c996d580f1e7f5f6fcc23d145faecd63e458433152e1a5fb677eeae1` |
| `meshes/umi-short-trap-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 40 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `8f54771416e432855ec0f1c827ab79c7932c1819578243468cde9ac140fecec8` |
| `meshes/umi-short-convex-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 40 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `34399e92ef2a3d554205df20f4e28e8dcd064c10cc16bbdd3199d08579f8349c` |
| `meshes/umi-short-convex-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 40 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `bfba38d06565c605333a5ab6a777366dcec44c4c2e88ae4972cb7204ac742fcf` |
| `meshes/umi-short-convex-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 40 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `5becdc111e92694f98b3485d3a843f0ec936a04dd792d683d03b6a60c6ee84f0` |
| `meshes/umi-short-convex-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 40 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `976e8e54cdb39d88339bca6876c0562313eb99689c11e05aa5ee2e66cebc159a` |
| `meshes/umi-short-convex-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 40 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `ace3a48ccf990c63e917c205b6f4cda209c0ae2fcbd6a189ba333eec30896f8c` |
| `meshes/umi-convex-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `428e618e51772bd4882cc0fc1de132e4a1a8bff5d78fd9450fbf368bb95159e4` |
| `meshes/umi-convex-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `e254c3fd40cc7e3c1a3c49683cb7f8829d473590d40c4270a408c30fb26ec8c3` |
| `meshes/umi-convex-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `0aa24fb4dbd23de90c14b498bbeee9888dd34a6ac473d4a9db544ab572840ee2` |
| `meshes/umi-convex-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `3314dca59dd8260caf74ccb957d0ffe3c42e7267ad34f88affd2a818c5a702cb` |
| `meshes/umi-convex-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `d9562c18e2bc35af280f0d2f33577600a24c990098824df6718b66f17b1ab685` |
| `meshes/umi-trap-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `6ee1d59992d71ec0207ba15798b97c6bfc0e3001ef1282969c601dda46da6f29` |
| `meshes/umi-trap-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `23a46a0071b4807e028333fe0053565f0bbd96c10aba4fc8bce83c6b56e80549` |
| `meshes/umi-trap-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `5c5c582158db5034865aef20390cf9f6c8abf59b74277f3b251dd0eb270cbbe7` |
| `meshes/umi-trap-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `3cca74b0f6f70e3296bb4aa57ce537df5bac6eadbf90a2223e4e3be5b99a86bf` |
| `meshes/umi-trap-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `aa0f328d24c5107df0f2b19768edfe0b997835d286f7bea688d9721f57eea7e8` |
| `meshes/umi-concave-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (concave arc, h 75 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `e9e817b7cc1d142d466dc1811b07d47ccd7bc3819aaeee14bfdc976aa9eea2a3` |
| `meshes/umi-concave-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (concave arc, h 75 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `4a70cc098e201d2af4fa81940ed6aac126c99367e01926b5e42f1ba11abe6934` |
| `meshes/umi-concave-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (concave arc, h 75 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `a51dfcef0a0d53a88ad6bf9af0334fb6c7c7463e49f2b89a04909ef3a2411c13` |
| `meshes/umi-concave-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (concave arc, h 75 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `e2692fc9f689582d3455755757e04365bcad50eccea2f0bf42e3668d901a6fb0` |
| `meshes/umi-concave-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (concave arc, h 75 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `21594d26b53f30378cb35047f59e7ba1c5fa36846ffa020b974607fa32be0e60` |
| `meshes/umi-pointed-tip2.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 50 mm, tip 2 mm) from UMI-Soft-Gripper-Finger.stl | `4633bdbf0ef61c87e5ffd50ba02dfd61b4c587d062236a4bca83d123e67fd831` |
| `licenses/handumi-hw.txt` | handumi-hw `1448278`, `LICENSE` (the same file as `web/vendor/umi/LICENSE`) | Apache-2.0 | unchanged | `2fc33ff0cc150ee1b1a71db5763a8b7c3732ede5edac98ef0ce532ee3405981a` |
| `licenses/mujoco_menagerie-franka_emika_panda.txt` | mujoco_menagerie `f3b6013`, `franka_emika_panda/LICENSE` | Apache-2.0 | unchanged | `a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9` |
| `licenses/mujoco_menagerie-trossen_wx250s.txt` | mujoco_menagerie `f3b6013`, `trossen_wx250s/LICENSE` | BSD-3-Clause, Trossen Robotics | unchanged | `21868447315ac2b10e592d08958c1035b19a32cf39e9165b23033f68390098cb` |
| `licenses/i2rt.txt` | i2rt `120c3c8`, `LICENSE` | MIT, I2RT Robotics | unchanged | `7cd0a0224a287ebd6c45703eb6623d264c7810f8958d65de8f99e87ccd9f4891` |
| `licenses/unitree_ros.txt` | unitree_ros `b579bbe`, `LICENSE` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics) | unchanged | `84aac59fd3246e3ddc49d1387644e8fcf43b0def4f0b9fe687f372e90446df2d` |

## The bodies of the 3D view and the pictures

Each sensor's page in the Library turns in 3D, and the Library's pictures
are shot from that view.  For the seven grippers that are not UMI fingers
it draws the whole gripper at full opening with a sensor on both fingers:
each gripper's scene (`scenes/<part>.json`, which names its sources at their
commits, the opening and how the other finger was found) places the bodies
below (`bodies/<part>/<name>.stl`) around the Library's part.

- The other finger of the Trossen WidowX AI, the ARX X5 and the I2RT YAM is
  the mirror image of the Library's part, and its sensor is drawn with the
  mirror image of the board.  That board is not the entry's Gerbers, which
  make the board of the Library's part only.  On the other four grippers
  the other finger is the same part turned, with the same board.
- The MakerMods Metal Arm's pictures and 3D view show its two HandUMI tips
  (the Library's part, and the same tip turned for the other finger),
  standing on `bodies/makermods-metal/rail.stl`: a plain rail drawn by the
  FlexiTac-Gen project, not MakerMods hardware.  No MakerMods file is used:
  the rest of the gripper drawn there (the beam's walls and end stops, the
  guide rail and its holes, the housing and motor can, the camera's mount
  and lens) is plain shapes of the project's own too, drawn by eye after
  the maker's photos, not MakerMods' 3D model or hardware
  (`bodies/makermods-metal/drawn-*.stl`, under Modified files below).
- Each body below is a third-party file of the Sources above, taken at its
  pinned commit and modified as its Change column says (all written in
  millimetres, and all but one decimated with quadric error metrics: each
  surface kept within 0.5 mm of the upstream one both ways and facing its
  way within 15 degrees); the two licence texts at the end of the table
  serve these bodies alone.
- A gripper is drawn after photos of the real product, each component in
  its material's look.  Where one body holds several materials, its
  triangles are shared out by material into several files: a row whose
  Change says "split by look" is one of them, its triangles those of the
  decimated body named there, none of them changed, and the note under
  Modified files for that body describes them all.  A file named
  `bodies/<part>/drawn-<name>.stl` is a plain shape (a box, a cylinder)
  drawn by the FlexiTac-Gen project where a model lacks a component the
  photos show; it is not the maker's geometry, and its scene's `about`
  says what it stands for.

### Modified files

`bodies/franka-hand/hand_0.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's `franka_emika_panda/assets/hand_0.obj`
(SHA-256 `b94aab901086f85df04c019b30f43bf9aa23a7ad0443ec80a8c14662a41cabd2`),
decimated with quadric error metrics from 42 to 14 triangles, its surface
within 0.37 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/franka-hand/hand_1.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's `franka_emika_panda/assets/hand_1.obj`
(SHA-256 `cd76f7494bb314406a1819c46eb826ee254894f87235714f604a470653d9badb`),
decimated with quadric error metrics from 488 to 252 triangles, its surface
within 0.25 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/franka-hand/hand_2.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's `franka_emika_panda/assets/hand_2.obj`
(SHA-256 `e0f44a71712afa5b98eb20355eff17763d3e2e19f459b2bef19abed3727e64b3`),
decimated with quadric error metrics from 2310 to 1582 triangles, its surface
within 0.22 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/franka-hand/hand_3.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's `franka_emika_panda/assets/hand_3.obj`
(SHA-256 `a431a06d99e88a1b322b3122a01424ee7704daeaad0bc343b90b9604f014ad0c`),
decimated with quadric error metrics from 3548 to 1330 triangles, its surface
within 0.36 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/franka-hand/hand_4.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's `franka_emika_panda/assets/hand_4.obj`
(SHA-256 `21f96ef6a8de082e41b1ea9834f1043de359e5d60305541bcb63539581f53bff`),
decimated with quadric error metrics from 690 to 576 triangles, its surface
within 0.43 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/franka-hand/finger_0.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is mujoco_menagerie's
`franka_emika_panda/assets/finger_0.obj` (SHA-256
`215098c0fcdf7192f6c503a37cf49e3efecf8a9e1320f02b17c5584d89cc5b2c`), scaled
from metres to millimetres and written as a binary STL, changed by the
FlexiTac-Gen project in 2026.  The Library holds it as
`bodies/franka-hand/finger-body.stl`: all its triangles, none of them
changed, in one file of one look, beside the screws the project drew on it
(below).

`bodies/franka-hand/drawn-screws.stl`,
`bodies/franka-hand/drawn-screw-bores.stl`,
`bodies/franka-hand/drawn-shell-screws.stl` and
`bodies/franka-hand/drawn-shell-screw-seats.stl` are not from the upstream
model, which has no screw: they are plain cylinders drawn by the
FlexiTac-Gen project in 2026 after photos of the hand (on each finger the
two screws of its mount in their counterbores and the fingertip's screw,
one file drawn on both fingers; on the one broad face of the shell that
the photos show, the two small screws beside the inlay strip, in their
seats), from the numbers of `tools/library_looks/franka-hand.json`.  They
are the project's own drawing, not Franka Robotics' geometry.

`bodies/widowx-250/wx250s_7_gripper.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`trossen_wx250s/assets/wx250s_7_gripper.stl` (SHA-256
`6dbc189d3787ca62e09a8cf3f928ceca70c5c184a95c97ac6587805aa6a1ec6d`), decimated
with quadric error metrics from 352 to 124 triangles, its surface within 0.37
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/widowx-250/wx250s_9_gripper_bar.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`trossen_wx250s/assets/wx250s_9_gripper_bar.stl` (SHA-256
`b54601da3f60eea180226b695bb95a9b29b187f22f5b74d9a523ac9785d9a518`), decimated
with quadric error metrics from 732 to 188 triangles, its surface within 0.34
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/widowx-250/wx250s_8_gripper_prop.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`trossen_wx250s/assets/wx250s_8_gripper_prop.stl` (SHA-256
`30fcd807817b7c9df6275d2c8100cfe0e7786e2c65b574d22efe177520f1a316`), decimated
with quadric error metrics from 452 to 88 triangles, its surface within 0.26 mm
of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/widowx-250/drawn-bar-rail-slots.stl`,
`bodies/widowx-250/drawn-bar-plate-screws.stl`,
`bodies/widowx-250/drawn-bar-plate-sockets.stl`,
`bodies/widowx-250/drawn-inserts-sensor.stl`,
`bodies/widowx-250/drawn-insert-bores-sensor.stl`,
`bodies/widowx-250/drawn-inserts-mate.stl` and
`bodies/widowx-250/drawn-insert-bores-mate.stl` are not from the upstream
model, whose rail is a plain square bar and which has no screw and no insert:
they are plain boxes and cylinders drawn by the FlexiTac-Gen project in 2026
after photos of the gripper (the four slots of the rail's extrusion, which
notch its sawn ends; the two button-head screws on the plate with their
sockets; on each finger's carriage the two brass inserts with their bores),
from the numbers of `tools/library_looks/widowx-250.json`.  They are the
project's own drawing, not Trossen Robotics' geometry.

`bodies/trossen-widowx-ai/link_6.stl` is not the upstream file (BSD-3-Clause):
it is mujoco_menagerie's `trossen_wxai/assets/meshes/wxai/link_6.obj` (SHA-256
`ed5214e3c27c6a46cb0cc8aff77e4417c8fe869e4f00b0eb54a200ec532990ce`), decimated
with quadric error metrics from 1020 to 736 triangles, its surface within 0.40
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/trossen-widowx-ai/carriage_left.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`trossen_wxai/assets/meshes/wxai/carriage_left.obj` (SHA-256
`29242116cb338b6ffc78d4113c7e736faf98499eb426547a58dc0b0f7db85408`), decimated
with quadric error metrics from 512 to 390 triangles, its surface within 0.38
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/trossen-widowx-ai/carriage_right.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`trossen_wxai/assets/meshes/wxai/carriage_right.obj` (SHA-256
`aa25bb251187b0675bfdcceda62d39f63ee32c49c970a422742d6a5c7f635bf4`), decimated
with quadric error metrics from 512 to 388 triangles, its surface within 0.37
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/trossen-widowx-ai/wxai-left-gripper-backbone.stl` is not the upstream
file (Apache License 2.0, section 4(b)): it is handumi-hw's
`hardware/STL/gripper_tips/Trossen-WidowXAI/WXAI-LEFT-Gripper-backbone.stl`
(SHA-256 `899741dfe77243c6d7531a145ba9c15b33910d5ac84dc5334b14dc0f0b7e8881`),
decimated with quadric error metrics from 186616 to 1508 triangles, its surface
within 0.13 mm of the upstream one both ways, written as a binary STL, changed
by the FlexiTac-Gen project in 2026.

`bodies/trossen-widowx-ai/link_6.stl` is published as
`bodies/trossen-widowx-ai/link_6-rail.stl`, `link_6-housing.stl` and
`link_6-actuator.stl`: the same triangles, shared out by look (the table's
rows).  `bodies/trossen-widowx-ai/drawn-rail-bores.stl`,
`drawn-rail-holes.stl`, `drawn-rail-screws.stl`, `drawn-rail-sockets.stl`,
`drawn-shell-screws.stl` and `drawn-shell-sockets.stl` are not from the
upstream model, which has no screw and no hole in its rail: they are plain
cylinders drawn by the FlexiTac-Gen project in 2026 after photos of the
gripper (on the guide rail two empty counterbores and two black socket-head
screws, on each end shell's outer face a black button-head screw with its hex
socket), from the numbers of `tools/library_looks/trossen-widowx-ai.json`.
They are the project's own drawing, not Trossen Robotics' geometry.

`bodies/arx-x5/link6.stl` is not the upstream file (BSD-3-Clause): it is
mujoco_menagerie's `arx_l5/assets/link6.obj` (SHA-256
`57957e2a042277526ad29d84c608993431a1bdd9b19f71a24d2d161215f27587`), decimated
with quadric error metrics from 12874 to 6716 triangles, its surface within
0.41 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.  It is
published shared out by material, its triangles unchanged, as
`bodies/arx-x5/link6-rail.stl`, `bodies/arx-x5/link6-pinion.stl`,
`bodies/arx-x5/link6-beam.stl` and `bodies/arx-x5/link6-motor.stl`.

`bodies/arx-x5/drawn-rail-screws.stl`, `bodies/arx-x5/drawn-rail-sockets.stl`,
`bodies/arx-x5/drawn-rail-holes.stl`, `bodies/arx-x5/drawn-caps-sensor.stl`
and `bodies/arx-x5/drawn-caps-mate.stl` are not from the upstream model, which
has no screw and no carriage: they are plain cylinders and boxes drawn by the
FlexiTac-Gen project in 2026 after ARX's photo of the gripper (the socket-head
screw in the outermost counterbore at each end of the guide rail, with its
socket; a plain dark disc in each of the six other counterbores, as the photo
shows the second hole from each end, the four it hides assumed to be alike;
and the red end caps of the two linear carriages where the rail leaves each
finger's base), from the numbers of `tools/library_looks/arx-x5.json`.  They
are the project's own drawing, not ARX Robotics' geometry.

`bodies/i2rt-yam/gripper.stl` is not the upstream file (MIT License): it is
i2rt's `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` (SHA-256
`efbe5e92e44c715d9c0ea0617e412a24db6ea0f3dabf18edc6746cd685a5d85f`), decimated
with quadric error metrics from 8000 to 2146 triangles, its surface within 0.44
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/i2rt-yam/tip_right.stl` is not the upstream file (MIT License): it is
i2rt's `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` (SHA-256
`f074d03ca2a4fdc53cb7f47240111010b02b6fe7bae4465230b6ac3e5a1b32d6`), decimated
with quadric error metrics from 8000 to 3466 triangles, its surface within 0.29
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/i2rt-yam/drawn-block.stl`, `bodies/i2rt-yam/drawn-block-caps.stl`,
`bodies/i2rt-yam/drawn-block-seals.stl`,
`bodies/i2rt-yam/drawn-tip-right-caps.stl`,
`bodies/i2rt-yam/drawn-tip-right-seals.stl`,
`bodies/i2rt-yam/drawn-rail-screws.stl`,
`bodies/i2rt-yam/drawn-crank-hub.stl` and
`bodies/i2rt-yam/drawn-crank-hub-bore.stl` are not from the upstream model,
which has no screw, no hub and one plain shape for each bearing block: they
are plain boxes and cylinders drawn by the FlexiTac-Gen project in 2026 after
photos of the gripper (the green caps and red seals at the ends of both
bearing blocks and the steel body of the sensor finger's, six screw heads on
the rails, the crank's bright hub and its bore), from the numbers of
`tools/library_looks/i2rt-yam.json`.  They are the project's own drawing, not
I2RT Robotics' geometry.  The two decimated bodies described above,
`bodies/i2rt-yam/gripper.stl` and `bodies/i2rt-yam/tip_right.stl`, are in the
Library as the component files of the table below (split by look, their
triangles unchanged), not under those two names.

`bodies/unitree-dex1/dex1_base_link.stl` is not the upstream file
(BSD-3-Clause): it is unitree_ros's
`robots/g1_description/meshes/Dex1_base_link.STL` (SHA-256
`03f1cb02f94d6b280953f6c5a10da2eab6220ea5c301408d3c4decca66c8cdad`), decimated
with quadric error metrics from 56498 to 22840 triangles, its surface within
0.46 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/unitree-dex1/drawn-rail-sensor.stl`,
`bodies/unitree-dex1/drawn-rail-screws-sensor.stl`,
`bodies/unitree-dex1/drawn-rail-mate.stl` and
`bodies/unitree-dex1/drawn-rail-screws-mate.stl` are not files of the
upstream model, whose finger mesh holds the guide rail, the rack and the
jaw as one body of one colour: they are plain boxes and cylinders drawn by
the FlexiTac-Gen project in 2026 after pictures of the gripper (on each
finger the bright steel of its guide rail and of the rack's body, just proud
of the model's own, the rail's two black cap screws that stand outside
the block at full opening, and a small black plate behind the cover
strip's open screw hole, which keeps the drawn steel from showing through
it), from the numbers of
`tools/library_looks/unitree-dex1.json`.  They are the project's own
drawing, not Unitree Robotics' geometry.

`bodies/makermods-metal/drawn-rail-steel.stl`,
`bodies/makermods-metal/drawn-rail-bores.stl`,
`bodies/makermods-metal/drawn-beam-walls.stl`,
`bodies/makermods-metal/drawn-end-stops.stl`,
`bodies/makermods-metal/drawn-housing.stl`,
`bodies/makermods-metal/drawn-camera-mount.stl` and
`bodies/makermods-metal/drawn-camera-lens.stl` are not MakerMods files, and
no MakerMods model was used, traced or measured to make them: they are plain
boxes, cylinders and prisms drawn by the FlexiTac-Gen project in 2026 by eye
after the maker's product photos of the gripper and its published stroke,
round the project's own plain rail (the beam's two walls and end stops, the
steel guide rail on its floor with its counterbored holes, the gripper's
housing and motor can behind it, the printed camera mount, the camera's
housing, barrel and lens), from the numbers of
`tools/library_looks/makermods-metal.json`.  They are the project's own
drawing, not MakerMods' 3D model, geometry or hardware.

### Bodies

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `bodies/franka-hand/hand_0.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_0.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.37 mm), OBJ in metres to binary STL in millimetres | `ba1dc5e09278f0e26986950e5ec54bf7e62c361eec7d2684032c88027364b603` |
| `bodies/franka-hand/hand_1.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_1.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.25 mm), OBJ in metres to binary STL in millimetres | `5320d381d8aeab2fb1387988ebd23351ea7db8d82ff999feb6f22fb585f393a0` |
| `bodies/franka-hand/hand_2.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_2.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.22 mm), OBJ in metres to binary STL in millimetres | `19661cf24853021f5ffd679e06e166a746f981a7289669cfa48d6c3ba39b1fe0` |
| `bodies/franka-hand/hand_3.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_3.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.36 mm), OBJ in metres to binary STL in millimetres | `478989357bc67efb859a676a900f7442934c757db1a6d14dcd5e77076ac9836b` |
| `bodies/franka-hand/hand_4.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_4.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.43 mm), OBJ in metres to binary STL in millimetres | `d9d2fdc7966225a5ff56b05015a16dc243fe41f8c7aad7f13562ff8a0bc5bbf0` |
| `bodies/franka-hand/finger-body.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/finger_0.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (the one file of finger_0.stl's) | `8f9ed457aa02a857005a17df4b13a7faa0e651112e1121c8afe194e875dd478e` |
| `bodies/widowx-250/gripper-bracket.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_7_gripper.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.37 mm); split by look, its triangles unchanged (one of the 2 files of wx250s_7_gripper.stl's) | `a17b9a3ffed7d66e4958075600293e93fb3aef9c9efc7725f0a388dcc4ef7a20` |
| `bodies/widowx-250/gripper-servo.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_7_gripper.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.37 mm); split by look, its triangles unchanged (one of the 2 files of wx250s_7_gripper.stl's) | `4fece2e55cd8d4f1375d2ce46604b2d9f9f5696420137cbe10c10c1ca14fb021` |
| `bodies/widowx-250/bar-plate.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_9_gripper_bar.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.34 mm); split by look, its triangles unchanged (one of the 3 files of wx250s_9_gripper_bar.stl's) | `e4867f6d6f7ebd24f9a4035833cb93275680ed235396d7e7a3eaadbe4d7db74b` |
| `bodies/widowx-250/bar-rail-ends.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_9_gripper_bar.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.34 mm); split by look, its triangles unchanged (one of the 3 files of wx250s_9_gripper_bar.stl's) | `ca2b4559b05a10312d2b5c483a383f03609afa0a1807e721fb7c2e5c1c4d07a1` |
| `bodies/widowx-250/bar-rail.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_9_gripper_bar.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.34 mm); split by look, its triangles unchanged (one of the 3 files of wx250s_9_gripper_bar.stl's) | `1d971ae628673d43d1d6182e38e92a8ac6cc34dce91102c22e51e1b66e7bf17d` |
| `bodies/widowx-250/wx250s_8_gripper_prop.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_8_gripper_prop.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.26 mm) | `0deb0cd3d6e310964ad3d446effaa41e19480b10c3435d478cbef71c3071fea5` |
| `bodies/trossen-widowx-ai/link_6-rail.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/link_6.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.40 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link_6.stl's) | `64d0951be887ffb0bd10e5ab699ff5711b7c7dd11d6a1543bcf863e8fb417ff2` |
| `bodies/trossen-widowx-ai/link_6-housing.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/link_6.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.40 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link_6.stl's) | `7820f6356662749317566f795d87ba2f7cc7971ad71a0a8e03a8095e79b99a89` |
| `bodies/trossen-widowx-ai/link_6-actuator.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/link_6.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.40 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link_6.stl's) | `af3c76ad4439b9d319b3e03f88bc502c155f29cf20b6bcdec95bfbeb7fd7eb08` |
| `bodies/trossen-widowx-ai/carriage_left.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/carriage_left.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.38 mm), OBJ in metres to binary STL in millimetres | `2d7261c67d20067c006bef6b5fbee06005505829c71a3ddbbd8359667c40021d` |
| `bodies/trossen-widowx-ai/carriage_right.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/carriage_right.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.37 mm), OBJ in metres to binary STL in millimetres | `ba52c7e0e9f23e33ab2acaf65a6514c41f8cfa78e9c2eb08bd55263f16eaba65` |
| `bodies/trossen-widowx-ai/wxai-left-gripper-backbone.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/Trossen-WidowXAI/WXAI-LEFT-Gripper-backbone.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: decimated (quadric error metrics, 0.13 mm) | `33bb42eb82f340536926a1c362021b064d21684e22d884021756bc89601674f8` |
| `bodies/arx-x5/link6-rail.stl` | mujoco_menagerie `f3b6013`, `arx_l5/assets/link6.obj` | BSD-3-Clause, ARXrobotics, `licenses/mujoco_menagerie-arx_l5.txt` | modified: decimated (quadric error metrics, 0.41 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of link6.stl's) | `08ace824d239458c93e0510da61cec7cc9e9dd95a25fd0c80e5275e0da813d14` |
| `bodies/arx-x5/link6-pinion.stl` | mujoco_menagerie `f3b6013`, `arx_l5/assets/link6.obj` | BSD-3-Clause, ARXrobotics, `licenses/mujoco_menagerie-arx_l5.txt` | modified: decimated (quadric error metrics, 0.41 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of link6.stl's) | `950f090867da94dc9d7a31a01086b728a4410b626eeb0ace4959ab5bd204c7e5` |
| `bodies/arx-x5/link6-beam.stl` | mujoco_menagerie `f3b6013`, `arx_l5/assets/link6.obj` | BSD-3-Clause, ARXrobotics, `licenses/mujoco_menagerie-arx_l5.txt` | modified: decimated (quadric error metrics, 0.41 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of link6.stl's) | `14e0cddf0209209b03b4709cd9a8c533fff1aa94dd7f212c19bb2dcd09a1e5f4` |
| `bodies/arx-x5/link6-motor.stl` | mujoco_menagerie `f3b6013`, `arx_l5/assets/link6.obj` | BSD-3-Clause, ARXrobotics, `licenses/mujoco_menagerie-arx_l5.txt` | modified: decimated (quadric error metrics, 0.41 mm), OBJ in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of link6.stl's) | `e0f33738f6cea4038fc8ff78220e14f351a60286b68cf4ab56f801ceac2a3df1` |
| `bodies/i2rt-yam/crank-face.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `bbf2a3b8e70c81c7609f5db4aacbc3909c4f8674305a93a488d138ef292741a8` |
| `bodies/i2rt-yam/crank-rollers.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `acbc5d7a84b4b88c41702ccf3a352a46ff1b3047af8082969a6e5bc5fe3468e6` |
| `bodies/i2rt-yam/crank.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `bdabeb2017a1f26fd900834fa885f3ca108a9c1f11b618638f40874fab03380d` |
| `bodies/i2rt-yam/rail-ends.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `26afd94c82c7718305fd1492434b6d174354aadfe1b360d6d5f75785072089ec` |
| `bodies/i2rt-yam/rails.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `c333d6263efd1ef3601d11789db7b482b658dece5061ed7bea4c7657bd651eaa` |
| `bodies/i2rt-yam/motor.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `71d41ee97025d008602aa84a51a86bdad143317e1095b9eed5e69e1653c28ebf` |
| `bodies/i2rt-yam/rail-plate.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 7 files of gripper.stl's) | `64611b6178fc6154959bffd5e658fd398c2c3f7e07f90ddf43afaa7b7c538035` |
| `bodies/i2rt-yam/tip-right-finger.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.29 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of tip_right.stl's) | `4c0856986524a567000609bd9496d405d15f02b43c20fbaf62a17390ddb880a8` |
| `bodies/i2rt-yam/tip-right-block.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.29 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of tip_right.stl's) | `fd941994384807c764b1f71a72832d899e9683f3185804f8a55cee76113ca32d` |
| `bodies/i2rt-yam/tip-right-yoke.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.29 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of tip_right.stl's) | `da3a20a58981d2edf932ce1b4e72e935eb237b75ea1a53e4fb69b688d43acf4b` |
| `bodies/i2rt-yam/tip-right-plate.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.29 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of tip_right.stl's) | `be360bdc86dba2c6b5a04fb7280217ee23af28dcc4985f53d2badef5a4adadc4` |
| `bodies/unitree-dex1/dex1-motor.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `d207acadf15f83a32f684733bdbef6f089cf6d7b6435c2125745ccf065d01bb5` |
| `bodies/unitree-dex1/dex1-block.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `24180c42cee18b1f634f2987b7e6ccd176f023864213c79f2621e86a4fc7d81e` |
| `bodies/unitree-dex1/dex1-pinion.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `585d07d8881e628edae4ddb26cec453da601c82da55adc266f66b8395556c6a4` |
| `bodies/unitree-dex1/dex1-carriages.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `4be3e98751bc4c6674065f2cfa41bf2e3876059b3bc3721014c22fbfbb552d90` |
| `bodies/unitree-dex1/dex1-connector.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `b724dbd4fbf255b33f9c8ec6e3375f802c9877192053870ed7ad97cdbfe2b61b` |
| `bodies/unitree-dex1/dex1-inside.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 6 files of dex1_base_link.stl's) | `59e4e588231afd9493b68aba4d3ce080d57c832c9b73c16a7d83780be97000dd` |
| `licenses/mujoco_menagerie-trossen_wxai.txt` | mujoco_menagerie `f3b6013`, `trossen_wxai/LICENSE` | BSD-3-Clause, Trossen Robotics | unchanged | `110a998ebd9a901d31173892d43224f8f59f12ebfd6398b9f3dea0ee9a01ab16` |
| `licenses/mujoco_menagerie-arx_l5.txt` | mujoco_menagerie `f3b6013`, `arx_l5/LICENSE` | BSD-3-Clause, ARXrobotics | unchanged | `11b6d7cd3c80b5eda4974f4fde6c08ec4c142bd9cb66f1b854974c25dab9cf22` |

## The showcase

The Library's first section shows the hand-designed FlexiTac sensor on the
xArm Gripper G1 with UMI soft fingers (`scenes/flexitac-g1.json`, the
showcase's own scene: it is no part of the Library, has no fit and none of
the generator's downloads).  It is drawn from three sources:

- the gripper: twelve meshes in `web/vendor/ufactory-g1/`, made from
  UFACTORY's 3D model of the Gripper G1.  They are the property of UFACTORY,
  used by the project owner's decision of 2026-11-12 and not under this
  repository's Apache License 2.0; that folder's notice,
  [`../vendor/ufactory-g1/NOTICE.md`](../vendor/ufactory-g1/NOTICE.md), tables
  them and says what was changed.  No sensor, part or sample of the Library
  uses them;
- the two finger holders: HandUMI's `UMI-RIGHT-Finger-Holder.stl`, the body
  below (the left holder is drawn as its mirror image);
- the soft fingers: the UMI fin-ray finger, the page's default part
  (`web/vendor/umi/`), unchanged, the other finger its mirror image;
- the sensor: the original FlexiTac V2 pad, whose files in
  `web/vendor/flexitac-v2/` are CC BY-NC 4.0 material of Columbia
  University with their own notice,
  [`../vendor/flexitac-v2/NOTICE.md`](../vendor/flexitac-v2/NOTICE.md).

The seven files `bodies/flexitac-g1/drawn-<name>.stl` are plain boxes and
cylinders drawn by the FlexiTac-Gen project, for what the models have only
as holes or not at all, after the project owner's photo of the gripper as
built where it shows them: a shell screw's head (`drawn-shell-screw.stl`;
on the logo's face where that photo shows the screws, on the other face,
which no photo shows, in the wells the vendor's model has there), a
holder bolt's head and its nut (`drawn-holder-bolt.stl`,
`drawn-holder-nut.stl`), the black block in the shell's top slot
(`drawn-slot-block.stl`) and, behind each finger, the extender board on
the sensor's tails, its two sockets round the tails' ends and a short stub
of the flat cable (`drawn-extender.stl`, `drawn-extender-sockets.stl`,
`drawn-cable-stub.stl`), placed by eye.  They are this project's own
(Apache License 2.0, as the repository) and are neither UFACTORY's nor
HandUMI's geometry.  `showcase.json` (the showcase's words and records) is
this project's own too.  The three pictures in `showcase/` are the
Library's own drawings of the scene above; they show UFACTORY's model and
the FlexiTac V2 design, and those two notices say whose these are.

`bodies/flexitac-g1/umi-right-finger-holder.stl` is not the upstream file
(Apache License 2.0, section 4(b)): it is handumi-hw's
`hardware/STL/gripper_tips/UMI-Gripper/UMI-RIGHT-Finger-Holder.stl` (SHA-256
`80ebab13e5d84a4e83d80e4ff21fa660223fd98f0f83dc45055d7015b4e71c00`), decimated
with quadric error metrics from 13504 to 2544 triangles, its surface within
0.05 mm of the upstream one both ways (and each face within 15 degrees of the
way it faced), written as a binary STL in millimetres, changed by the
FlexiTac-Gen project in 2026.

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `bodies/flexitac-g1/umi-right-finger-holder.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-RIGHT-Finger-Holder.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: decimated (quadric error metrics, 0.05 mm) | `bed7997d234957cd874aecec2be76e133ab14b4cd652abe4c0491ee06fe469dd` |

## This project's own files

`NOTICE.md`, `parts.json`, `entries.json`, `fits/<id>.json` (each sensor's
fit: the request the page sends and the engine's reply, written by
`tools/library_write.py`), `shots/` (the sensors' pictures, drawn by
FlexiTac-Gen's sensor on the part and shot by
`tools/browser/library_shots.py`, with `shots/manifest.json`),
`art/<id>.json.gz` (each sensor's two boards as the generator draws them,
for the 3D view, written by the same tool), `scenes/` (the grippers' scenes:
where each body and the other finger stand, written by the project's scene
builder; their looks by `tools/library_split.py`; the showcase's, by
`tools/library_showcase.py`),
`bodies/makermods-metal/rail.stl` (a plain rail drawn by the FlexiTac-Gen
project, not MakerMods hardware) and any `bodies/<part>/drawn-<name>.stl`
(a plain shape drawn by the project, above) are the FlexiTac-Gen
project's own, under its Apache License 2.0 (the repository's `LICENSE`).

## Trademarks

The names of the grippers and of their makers (Franka, WidowX, Trossen,
ARX, I2RT, YAM, Unitree, Dex1, MakerMods, UFACTORY, xArm) are the trademarks
of their owners; FlexiTac is not affiliated with them, and no holder of these files
endorses it or the sensors fitted to their parts.
