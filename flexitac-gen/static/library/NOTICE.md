# The Library's gripper parts

The Library (`library.html`, and Gen by Surface at `./?part=<id>`) shows sensors
already fitted to these gripper fingers; their files are served from this
folder so the app stays offline and keeps its Content Security Policy
(`default-src 'self'`).  The UMI fin-ray finger, the page's default part, is
served from `web/vendor/umi/` with its own notice.  The bodies the Library
draws around the seven grippers' fingers, in its 3D view and its pictures,
are tabled in their own section below.

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

The ten `meshes/umi-trap-tip<w>.stl` and `meshes/umi-convex-tip<w>.stl` are
not upstream files either (Apache License 2.0, section 4(b)): each is the
HandUMI `UMI-Soft-Gripper-Finger.stl` (SHA-256
`63331c666d485de462f3c7c80eb4200fd2bf98ac325095f5b0e8774a95dc8442`) with
its last 75 mm above the tip narrowed, symmetrically, to a tip of `<w>` mm
(21.8, 17.8, 13.8, 9.8 or 5.8): straight sides (a trapezoid) or circular-arc
sides tangent to the full width where the taper starts (a convex arc), cut
through the whole finger, the part above the taper unchanged; written as a
binary STL in millimetres, changed by the FlexiTac-Gen project in 2026.

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
| `meshes/umi-trap-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `6ee1d59992d71ec0207ba15798b97c6bfc0e3001ef1282969c601dda46da6f29` |
| `meshes/umi-trap-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `23a46a0071b4807e028333fe0053565f0bbd96c10aba4fc8bce83c6b56e80549` |
| `meshes/umi-trap-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `5c5c582158db5034865aef20390cf9f6c8abf59b74277f3b251dd0eb270cbbe7` |
| `meshes/umi-trap-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `3cca74b0f6f70e3296bb4aa57ce537df5bac6eadbf90a2223e4e3be5b99a86bf` |
| `meshes/umi-trap-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (trapezoid, h 75 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `aa0f328d24c5107df0f2b19768edfe0b997835d286f7bea688d9721f57eea7e8` |
| `meshes/umi-convex-tip21.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 21.8 mm) from UMI-Soft-Gripper-Finger.stl | `428e618e51772bd4882cc0fc1de132e4a1a8bff5d78fd9450fbf368bb95159e4` |
| `meshes/umi-convex-tip17.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 17.8 mm) from UMI-Soft-Gripper-Finger.stl | `e254c3fd40cc7e3c1a3c49683cb7f8829d473590d40c4270a408c30fb26ec8c3` |
| `meshes/umi-convex-tip13.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 13.8 mm) from UMI-Soft-Gripper-Finger.stl | `0aa24fb4dbd23de90c14b498bbeee9888dd34a6ac473d4a9db544ab572840ee2` |
| `meshes/umi-convex-tip9.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 9.8 mm) from UMI-Soft-Gripper-Finger.stl | `3314dca59dd8260caf74ccb957d0ffe3c42e7267ad34f88affd2a818c5a702cb` |
| `meshes/umi-convex-tip5.8.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: tip cut (convex arc, h 75 mm, tip 5.8 mm) from UMI-Soft-Gripper-Finger.stl | `d9562c18e2bc35af280f0d2f33577600a24c990098824df6718b66f17b1ab685` |
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
- The MakerMods Metal Arm's pictures and 3D view show only its two HandUMI
  tips (the Library's part, and the same tip turned for the other finger),
  standing on `bodies/makermods-metal/rail.stl`: a plain rail drawn by the
  FlexiTac-Gen project, not MakerMods hardware.  No MakerMods part is drawn.
- Each body below is a third-party file of the Sources above, taken at its
  pinned commit and modified as its Change column says (all written in
  millimetres, and all but one decimated with quadric error metrics: each
  surface kept within 0.5 mm of the upstream one both ways and facing its
  way within 15 degrees); the two licence texts at the end of the table
  serve these bodies alone.

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
FlexiTac-Gen project in 2026.

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

`bodies/arx-x5/link6.stl` is not the upstream file (BSD-3-Clause): it is
mujoco_menagerie's `arx_l5/assets/link6.obj` (SHA-256
`57957e2a042277526ad29d84c608993431a1bdd9b19f71a24d2d161215f27587`), decimated
with quadric error metrics from 12874 to 6716 triangles, its surface within
0.41 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

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

`bodies/unitree-dex1/dex1_base_link.stl` is not the upstream file
(BSD-3-Clause): it is unitree_ros's
`robots/g1_description/meshes/Dex1_base_link.STL` (SHA-256
`03f1cb02f94d6b280953f6c5a10da2eab6220ea5c301408d3c4decca66c8cdad`), decimated
with quadric error metrics from 56498 to 22840 triangles, its surface within
0.46 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

### Bodies

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `bodies/franka-hand/hand_0.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_0.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.37 mm), OBJ in metres to binary STL in millimetres | `ba1dc5e09278f0e26986950e5ec54bf7e62c361eec7d2684032c88027364b603` |
| `bodies/franka-hand/hand_1.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_1.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.25 mm), OBJ in metres to binary STL in millimetres | `5320d381d8aeab2fb1387988ebd23351ea7db8d82ff999feb6f22fb585f393a0` |
| `bodies/franka-hand/hand_2.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_2.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.22 mm), OBJ in metres to binary STL in millimetres | `19661cf24853021f5ffd679e06e166a746f981a7289669cfa48d6c3ba39b1fe0` |
| `bodies/franka-hand/hand_3.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_3.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.36 mm), OBJ in metres to binary STL in millimetres | `478989357bc67efb859a676a900f7442934c757db1a6d14dcd5e77076ac9836b` |
| `bodies/franka-hand/hand_4.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/hand_4.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: decimated (quadric error metrics, 0.43 mm), OBJ in metres to binary STL in millimetres | `d9d2fdc7966225a5ff56b05015a16dc243fe41f8c7aad7f13562ff8a0bc5bbf0` |
| `bodies/franka-hand/finger_0.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/finger_0.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: OBJ in metres to binary STL in millimetres | `3a4788747102666fbe3b298cd6290b1a219bcce0a5699a2ab7c8490317468491` |
| `bodies/widowx-250/wx250s_7_gripper.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_7_gripper.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.37 mm) | `4e4f1bb053c1946e5ba5c6d24dec9bbb9f29cb938654904a4996b618a042c5cf` |
| `bodies/widowx-250/wx250s_9_gripper_bar.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_9_gripper_bar.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.34 mm) | `aaa7b9b712cf789361fb2155a2a1ac54623bfe9c82aea2ba3ed8738447d17fd1` |
| `bodies/widowx-250/wx250s_8_gripper_prop.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_8_gripper_prop.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: decimated (quadric error metrics, 0.26 mm) | `0deb0cd3d6e310964ad3d446effaa41e19480b10c3435d478cbef71c3071fea5` |
| `bodies/trossen-widowx-ai/link_6.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/link_6.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.40 mm), OBJ in metres to binary STL in millimetres | `be82b4d7a19e00c7dcd21d4e5e4fee8a92f5f1c7f77af4563c2a6960f3afaf37` |
| `bodies/trossen-widowx-ai/carriage_left.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/carriage_left.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.38 mm), OBJ in metres to binary STL in millimetres | `2d7261c67d20067c006bef6b5fbee06005505829c71a3ddbbd8359667c40021d` |
| `bodies/trossen-widowx-ai/carriage_right.stl` | mujoco_menagerie `f3b6013`, `trossen_wxai/assets/meshes/wxai/carriage_right.obj` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wxai.txt` | modified: decimated (quadric error metrics, 0.37 mm), OBJ in metres to binary STL in millimetres | `ba52c7e0e9f23e33ab2acaf65a6514c41f8cfa78e9c2eb08bd55263f16eaba65` |
| `bodies/trossen-widowx-ai/wxai-left-gripper-backbone.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/Trossen-WidowXAI/WXAI-LEFT-Gripper-backbone.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | modified: decimated (quadric error metrics, 0.13 mm) | `33bb42eb82f340536926a1c362021b064d21684e22d884021756bc89601674f8` |
| `bodies/arx-x5/link6.stl` | mujoco_menagerie `f3b6013`, `arx_l5/assets/link6.obj` | BSD-3-Clause, ARXrobotics, `licenses/mujoco_menagerie-arx_l5.txt` | modified: decimated (quadric error metrics, 0.41 mm), OBJ in metres to binary STL in millimetres | `27f9dcff1ff5364068a9c4ef610d2f27d6e319e5423bd75e1c138819eb94635f` |
| `bodies/i2rt-yam/gripper.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/gripper.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres | `bc1a2a90fd9776866e4bbf901ee8572a78a1be2f2b055ff171819281120b401d` |
| `bodies/i2rt-yam/tip_right.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_right.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | modified: decimated (quadric error metrics, 0.29 mm), STL in metres to binary STL in millimetres | `56839ed9d8f5c5a17d2e0dccae0c75769ba6f699270ba4bfb36eccc886b5400f` |
| `bodies/unitree-dex1/dex1_base_link.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_base_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.46 mm), STL in metres to binary STL in millimetres | `fb5e81436c287e1ed6c35a7b1496706c285cd49b109be4e6e5b91ebef15d908f` |
| `licenses/mujoco_menagerie-trossen_wxai.txt` | mujoco_menagerie `f3b6013`, `trossen_wxai/LICENSE` | BSD-3-Clause, Trossen Robotics | unchanged | `110a998ebd9a901d31173892d43224f8f59f12ebfd6398b9f3dea0ee9a01ab16` |
| `licenses/mujoco_menagerie-arx_l5.txt` | mujoco_menagerie `f3b6013`, `arx_l5/LICENSE` | BSD-3-Clause, ARXrobotics | unchanged | `11b6d7cd3c80b5eda4974f4fde6c08ec4c142bd9cb66f1b854974c25dab9cf22` |

## This project's own files

`NOTICE.md`, `parts.json`, `entries.json`, `fits/<id>.json` (each sensor's
fit: the request the page sends and the engine's reply, written by
`tools/library_write.py`), `shots/` (the sensors' pictures, drawn by
FlexiTac-Gen's sensor on the part and shot by
`tools/browser/library_shots.py`, with `shots/manifest.json`),
`art/<id>.json.gz` (each sensor's two boards as the generator draws them,
for the 3D view, written by the same tool), `scenes/` (the grippers' scenes:
where each body and the other finger stand, written by the project's scene
builder) and `bodies/makermods-metal/rail.stl` (a plain rail drawn by the
FlexiTac-Gen project, not MakerMods hardware) are the FlexiTac-Gen
project's own, under its Apache License 2.0 (the repository's `LICENSE`).

## Trademarks

The names of the grippers and of their makers (Franka, WidowX, Trossen,
ARX, I2RT, YAM, Unitree, Dex1, MakerMods) are the trademarks of their
owners; FlexiTac is not affiliated with them, and no holder of these files
endorses it or the sensors fitted to their parts.
