# The Library's gripper parts

The Library (the first page, `./`, and Gen by Surface at `gen.html?part=<id>`) shows sensors
already fitted to these gripper fingers; their files are served from this
folder so the app stays offline and keeps its Content Security Policy
(`default-src 'self'`).  The UMI fin-ray finger, the page's default part, is
served from `web/vendor/umi/` with its own notice.  The bodies the Library
draws around the eighteen grippers' fingers (the two hands' among them), in
its 3D view and its pictures,
are tabled in their own section below.  LeFlexiTac's files state no licence:
they are shared here with their authors' permission, given by a co-author of
LeFlexiTac on 2026-11-17 (below, and `licenses/leflexitac.txt`).  The
showcase at the top of the Library has a section of its own, after them: its
gripper is UFACTORY's 3D model, which is not an open-source file and has its
own notice,
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
  2023-2025, ARXrobotics; the ARX X5, derived from `ARX_Model`); since
  2026-11-16, `robotiq_2f85` (BSD-2-Clause, Copyright (c) 2013,
  ROS-Industrial; the Robotiq 2F-85, derived from ros-industrial/robotiq's
  `robotiq_2f_85_gripper_visualization`, whose package.xml names the BSD
  licence and a Robotiq maintainer), the one Robotiq model in the Library: the
  silicone finger pad (`robotiq_2f85/assets/silicone_pad.stl`, in
  millimetres) and the gripper's other meshes.
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
  its base link; and the Dex3-1 hand's own model
  (`robots/dexterous_hand_description/dex3_1/`: its left hand's URDF and
  the meshes of its palm, its thumb's first link and a finger's two links,
  in metres; the thumb's other two links are a finger's turned).
- LeFlexiTac, `https://github.com/TNA001-AI/LeFlexiTac` at
  `b61259fdea21bf8b0b5193fb3d373e71e5e5be81`, the STL downloads of its
  project page: the LeRobot SO-101 gripper's moving jaw and wrist roll as
  LeFlexiTac remade them for the FlexiTac pad
  (`assets/models/Moving_Jaw_08d.stl`, in millimetres, and
  `assets/models/Wrist_Roll_08c.stl`).  No licence is stated for them
  (`NOASSERTION`: the repository has no `LICENSE` file and its pages state
  none); `licenses/leflexitac.txt` is the FlexiTac-Gen project's note saying
  so, not a licence.  Both are remodelled from SO-ARM100's Apache-2.0 parts
  (below: `STL/SO101/Individual/Moving_Jaw_SO101.stl` and
  `Wrist_Roll_Follower_SO101.stl`), whose credit and licence text
  (`licenses/so-arm100.txt`) their rows carry.  They are shared here with
  the permission of their authors (the LeFlexiTac authors, Columbia
  University), given by a co-author of LeFlexiTac on 2026-11-17; the
  permission is not a licence, and none is stated for them.
- SO-ARM100, `https://github.com/TheRobotStudio/SO-ARM100` at
  `a758567c3978dfeefe282ede0500085a48fe8f78`, Apache License 2.0
  (TheRobotStudio): the LeRobot SO-101's gripper servo
  (`Simulation/SO101/assets/sts3215_03a_v1.stl`, in metres), the stock
  moving jaw and wrist roll LeFlexiTac's files are remodelled from, and
  the URDF that places LeFlexiTac's parts
  (`Simulation/SO101/so101_new_calib.urdf`, read, not copied).
- MuJoCo Menagerie at `fb36886b3023db08c198264e1e9956ab202c3e3b`, the
  newest commit to touch the model, `agilex_piper` (MIT License,
  Copyright (c) 2024 RosenYin; the AgileX PiPER, derived from AgileX's
  `Piper_ros`, MIT License, Copyright (c) 2024 RosenYin): the PiPER
  gripper's left finger (`agilex_piper/assets/link7.stl`), in metres, and
  its body.
- GalaxeaManipSim, `https://github.com/OpenGalaxea/GalaxeaManipSim` at
  `abe7f5161eeaa150e6eaffdf443af5df7f23f356`, Apache License 2.0, Copyright
  2025 Galaxea (its `LICENSE`): the Galaxea R1 Lite's G1 gripper finger
  (`galaxea_sim/assets/r1_lite/meshes/left_gripper_finger_link1.STL`), in
  metres, and its gripper link.  The repository's `NOTICE`, that portions
  of it derive from software under the MIT License, Copyright (c) 2025
  Tianxing Chen (RoboTwin, which its README credits), is carried unchanged
  as `licenses/galaxeamanipsim-NOTICE.txt` (Apache License 2.0, section
  4(d)); the README's badge says MIT, after those portions, and the
  licence file is the grant.
- MuJoCo Menagerie at the same commit, `seeed_rebot_devarm` (MIT License,
  Copyright (c) 2026 Seeed Studio; the reBot DevArm): the gripper's left
  finger (`assets/pla_left.STL`), in metres, its contact face's pockets
  capped (below), and its bracket and rail, rail supports and slider
  extension.  The menagerie derives the model from the URDF of Seeed
  Studio's `https://github.com/Seeed-Projects/reBot-Isaacsim` (at
  `51aa87625e6aaa1ccb8514b0d0c66e3aa1c711bf`, `urdf/00-arm-rs_asm-v3`),
  whose top-level `LICENSE` is the same MIT text.  Seeed Studio also
  publishes these meshes under the CERN Open Hardware Licence Version 2,
  Weakly Reciprocal (CERN-OHL-W-2.0), in its hardware repository,
  `https://github.com/Seeed-Projects/reBot-DevArm` at
  `eda479d46249e32f8ecc61ebfe8ce49f8a58c19b`
  (`Rebot_Arm_description/RS/meshes/visual/`: `cnc7.STL`, `cnc_left.STL`
  and `pla7_green.STL` the same files, `pla_left.STL` the same finger
  meshed finer), and reBot-Isaacsim's `urdf/RS/UPSTREAM_LICENSE` gives that
  licence for its copy of them.  The files here are taken under the MIT
  License, as the menagerie publishes them; the CERN-OHL-W-2.0 text, that
  repository's `LICENSE` at that commit, is shipped beside the MIT one as
  `licenses/seeed-rebot_devarm.txt`.
- MuJoCo Menagerie's `ufactory_xarm7` at
  `f3b6013629c7b94f8ee93fd977b161fa8350f9bc` (since the project owner's
  decision of 2026-11-17), BSD-3-Clause,
  Copyright (c) 2018, UFACTORY Inc. (the xArm7 with its gripper, derived
  from `xarm_ros`): the xArm Gripper's left finger with its pad
  (`ufactory_xarm7/assets/left_finger.stl`), in metres, and its housing
  and the four links of its linkage.
- MuJoCo Menagerie at the same commit, `rainbow_robotics_rby1` (Apache
  License 2.0, Copyright 2024 Rainbow Robotics; the Rainbow Robotics RB-Y1,
  2026-11-17; its 1.2 files came to the menagerie at `bef9f83`, pull
  request 238 of 2026-05-08, and the folder's README says its models are
  derived from Rainbow Robotics' public resources, the RB-Y1 URDF of
  `rby1-sdk` among them, whose gripper is `EE_BODY` and `EE_FINGER` too):
  the 1.2 model's gripper (`assets/EE_BODY.obj`, in `rby1m_1.2.xml`), its
  fingers (`assets/EE_FINGER_1.obj`) and the finger's pad
  (`assets/EE_FINGER_0.obj`), in metres.
- OpenArm 1.0 (2026-11-17): the HandUMI replica of the OpenArm 1.0
  gripper's finger, from HandUMI hardware above
  (`hardware/STL/gripper_tips/OpenArmv1/OpenArm-left.stl`, in metres), and
  openarm_description, `https://github.com/enactic/openarm_description` at
  `81fe64755f78777c9d55d7e5cc5a238a143f7950`, Apache License 2.0
  (Copyright 2025 Enactic, Inc.): the OpenArm 1.0 gripper's hand, its
  carriage blocks and its motor (Collada files in millimetres), placed by
  the repository's generated v1 URDF.  The replica reproduces Enactic's
  finger, openarm_description's
  `assets/end_effector/parallel_link/meshes/visual/finger.dae` (Apache
  License 2.0, Copyright 2025 Enactic, Inc.,
  `licenses/openarm_description.txt`): its vertices lie within 0.001 mm
  (median) of that finger's surface, but for the mount at its base.
- YUBI, `https://github.com/Toyota/yubi-hw` at
  `dd8bd13d2fd8e5003057243576f88be333d95fc5` (2026-09-21), the CERN Open
  Hardware Licence Version 2, Weakly Reciprocal (CERN-OHL-W-2.0), Copyright
  2026 Toyota Motor Corporation (Frontier Research Center; the project page
  `https://yubi.airoa.io` and the paper, arXiv 2606.10244, with the AI Robot
  Association): the YUBI Gripper's left finger pad
  (`STL/gripper/FINGER_PAD_t30_L.stl`), in millimetres, unchanged, and
  its case, servo bracket, upper plate, finger attachment and flap
  (`STL/gripper/`), placed as `STEP/gripper/YUBI Gripper
  Assy_Dynamixel_ver2.STEP` places them.  The bodies made from them
  (decimated, written as binary STL) are modified Covered Source in the
  licence's words, licensed under CERN-OHL-W-2.0 as its section 3.3(d)
  requires, not under this repository's Apache License 2.0; their notes
  under Modified files below say how and on which date they were changed
  (section 3.3(b)), and this repository is their Source Location (section
  3.3(c)).  The YUBI project is Toyota's; it does not endorse FlexiTac-Gen
  or the sensors fitted to its pad.
- MuJoCo Menagerie at `f3b6013629c7b94f8ee93fd977b161fa8350f9bc`, `leap_hand` (MIT License, Copyright
  2023 Ananye Agarwal; the LEAP Hand of Carnegie Mellon University, derived
  from dex-urdf's `leap_hand` and from `LEAP_Hand_Sim`, both MIT License,
  the same holder): the right hand's white fingertip, one object of its
  distal link's file (`leap_hand/assets/distal.obj`), in metres, and the
  rest of the hand.

## Modified file

`meshes/franka-hand.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is the convex hull of the menagerie's
`franka_emika_panda/assets/finger_1.obj` (SHA-256
`cf239e9aca26bba09dbbf1c544c47d87cfc9a2f0637c8bb786af750b6d4eca44`), scaled
from metres to millimetres and written as a binary STL of 78 facets, changed
by the FlexiTac-Gen project in 2026.  The stock pad's face is cross-grooved
(V-grooves 4.5 mm wide and 1.6 mm deep); a laminated sensor bridges the
grooves, so its face is the hull's plane.

`meshes/seeed-rebot.stl` is not the upstream file (MIT License): it is the
menagerie's `seeed_rebot_devarm/assets/pla_left.STL` (SHA-256
`2101e5929ad211e6a28b45bad43fa6a404527fb40ac1ab802410159050bfe3ff`), the
reBot DevArm's printed finger with its MGN9 carriage and four screws, with
the two pockets of its contact face (1.85 mm deep: a slot up its middle and
one across its base) taken out and their rims capped flush with the face,
every other triangle unchanged, scaled from metres to millimetres and
written as a binary STL of 5068 facets, changed by the FlexiTac-Gen project
in 2026.  The pockets seat the gripper's silicone grip pads (30 x 9 x 2 mm
in Seeed's bill of materials), which stand about 0.15 mm proud of the face;
with the pads out, a laminated sensor bridges the pockets, so its face is
the finger's plane.

`meshes/leap-hand.stl` is not the upstream file (MIT License): it is the
white fingertip of the menagerie's `leap_hand/assets/distal.obj` (SHA-256
`6bfa2afb2a06557ce0c54b03baec13522bfe561aabb576bd4701d4704f93ec0f`): the
file's object `fingertip_W` (material `White_tip`) alone, without the
object `fingertip` (the black link and the posts that hold the fingertip),
scaled from metres to millimetres and written as a binary STL of 1450
facets in the file's order, changed by the FlexiTac-Gen project in 2026.

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

`meshes/rainbow-rby1.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is the menagerie's
`rainbow_robotics_rby1/assets/EE_FINGER_0.obj` (SHA-256
`b9fa737a1a58c04b4ccc5629022d020ecdd1614e2b9f5dca6c3756e0c802d3d4`), the
RB-Y1 finger's pad, scaled from metres to millimetres and written as a
binary STL of its 76 facets, changed by the FlexiTac-Gen project in 2026.

`meshes/unitree-dex3.stl` is not the upstream file (BSD-3-Clause): it is
unitree_ros's
`robots/dexterous_hand_description/dex3_1/meshes/left_hand_index_1_link.STL`
(SHA-256 `9e315ebc8a7a0cb98e033985b586b20d81cf8aa761181ae61ce56fcb14077a06`),
the Dex3-1's fingertip link, scaled from metres to millimetres, its bracket
unchanged and its fingertip cap, ridged up to 0.24 mm deep, replaced by the
cap's convex hull made mirror-symmetric across the link's mid-plane (a
laminated sensor bridges the ridges, so its face is the hull's), written as
a binary STL of 15524 facets, changed by the FlexiTac-Gen project in 2026.

## Files

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `meshes/robotiq-2f-85.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/silicone_pad.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | unchanged | `ca20c0fa61e6d3ce7b04bed25360e048e31dfd88ace04187aa6d9e8f4ca3fd0f` |
| `meshes/leflexitac.stl` | LeFlexiTac `b61259f`, `assets/models/Moving_Jaw_08d.stl` | NOASSERTION, no licence stated, shared with the authors' permission (given by a co-author of LeFlexiTac, 2026-11-17), `licenses/leflexitac.txt`; remodelled from SO-ARM100 `a758567`, `STL/SO101/Individual/Moving_Jaw_SO101.stl` (Apache-2.0, TheRobotStudio, `licenses/so-arm100.txt`) | unchanged | `c0f71e0134a7cd3a425488ba5cab87e16ee677f4768cd57036d21b9b81c6ea60` |
| `meshes/franka-hand.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/finger_1.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: convex hull of finger_1.obj, m to mm, binary STL | `3ac26349fc85ab971b81696e31ac88955f45d065ddc1254de376fea9d89b6c2c` |
| `meshes/widowx-250.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_10_gripper_finger.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | unchanged | `6a459bd4ef07eb5c4687e258bd9564004e741437e2e668af7ed31964567d8f90` |
| `meshes/trossen-widowx-ai.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/Trossen-WidowXAI/WXAI-LEFT-Gripper-sock.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `7e2792c557d7e15681b0a3cb693b728931c620d34d326f9f5409ba966372ee8c` |
| `meshes/arx-x5.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/ARX-X5-2023/ARX-X5-2023-LEFT-Gripper.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `5cf0e92353f4f5787b086eb518ff1d529ea41eb07502cdc3a2979766ccdd3018` |
| `meshes/i2rt-yam.stl` | i2rt `120c3c8`, `i2rt/robot_models/gripper/crank_4310/assets/tip_left.stl` | MIT, I2RT Robotics, `licenses/i2rt.txt` | unchanged | `b70f8c1e32ccfae03fec46ac10a0f04195347bc530ee761143a5d7c5bb07ae07` |
| `meshes/unitree-dex1.stl` | unitree_ros `b579bbe`, `robots/g1_description/meshes/Dex1_finger_link_1.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | unchanged | `7cd2ff199556e3955547a34c75ed9ea777fb7d704fc98e7318d0f67e4aaedf5a` |
| `meshes/unitree-dex3.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_index_1_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: the fingertip cap's mirror-symmetric convex hull, m to mm, binary STL | `9fb4d06c219e39c2578297a0638a76dd0b868823b659ebaa9e69143fa4e522d3` |
| `meshes/leap-hand.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/distal.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: distal.obj's object fingertip_W (the white fingertip) alone, m to mm, binary STL | `166bb1de0c0af51f7dde4df90940d2294991f6eff1ceb4909e7c064b6f89b312` |
| `meshes/makermods-metal.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/MakerMods-Metal/metal-arm-gripper-tip-left.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt` | unchanged | `f480c8fb9fbe5027ce0741436cd3c60c77702c2eec2b80d87f5829c4adca5925` |
| `meshes/agilex-piper.stl` | mujoco_menagerie `fb36886`, `agilex_piper/assets/link7.stl` | MIT, RosenYin, `licenses/mujoco_menagerie-agilex_piper.txt` | unchanged | `907dcdd10498a9d2e9317e42f550570a4ca522d1c4ff7b7c8721fd5cb951e481` |
| `meshes/galaxea-r1-lite.stl` | GalaxeaManipSim `abe7f51`, `galaxea_sim/assets/r1_lite/meshes/left_gripper_finger_link1.STL` | Apache-2.0, Galaxea, `licenses/galaxeamanipsim.txt`, its NOTICE `licenses/galaxeamanipsim-NOTICE.txt` | unchanged | `9e486d5bfa8bd512e272bed6e5df92e8f9d12de796ee03139f5b9618b55fa79b` |
| `meshes/seeed-rebot.stl` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/assets/pla_left.STL` | MIT, Seeed Studio, `licenses/mujoco_menagerie-seeed_rebot_devarm.txt`; also CERN-OHL-W-2.0, Seeed Studio, `licenses/seeed-rebot_devarm.txt` | modified: contact face's two pockets capped, m to mm, binary STL | `56f349cadcf7bab472ed454f02d2013b603cfafe95bd7a25298aeb3e025fa81b` |
| `meshes/ufactory-xarm.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/left_finger.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | unchanged | `a44756eb72f9c214cb37e61dc209cd7073fdff3e4271a7423476ef6fd090d2d4` |
| `meshes/enactic-openarm.stl` | handumi-hw `1448278`, `hardware/STL/gripper_tips/OpenArmv1/OpenArm-left.stl` | Apache-2.0, BrikHMP18 (HandUMI), `licenses/handumi-hw.txt`; the surface of Enactic's finger (openarm_description `81fe647`, `finger.dae`; Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt`) | unchanged | `b86528931e3abae5cebee5b62e306afb16a5acf36740df52a595cd98ae92ddf7` |
| `meshes/yubi-gripper.stl` | yubi-hw `dd8bd13`, `STL/gripper/FINGER_PAD_t30_L.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | unchanged | `36e029e3fe2590711014823c6b75b0c403b0c0a59315d565b4625318f2a46466` |
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
| `licenses/mujoco_menagerie-robotiq_2f85.txt` | mujoco_menagerie `f3b6013`, `robotiq_2f85/LICENSE` | BSD-2-Clause, ROS-Industrial | unchanged | `3d5edd18d1e22a17666e9bb84270171ed5ac90b192d24e0177fd171708ea2316` |
| `licenses/leflexitac.txt` | the FlexiTac-Gen project's note on LeFlexiTac `b61259f` | NOASSERTION, not a licence | the project's own words | `31907cd7ad7a6543b813b21a52903b26f6e3a5b159c670e82f2dd81f7dc50247` |
| `licenses/mujoco_menagerie-agilex_piper.txt` | mujoco_menagerie `fb36886`, `agilex_piper/LICENSE` | MIT, RosenYin | unchanged | `e32d78fd3761052ab0b2bb42fef8a7a9ad3f298d315d305333c349d2aff1f134` |
| `licenses/galaxeamanipsim.txt` | GalaxeaManipSim `abe7f51`, `LICENSE` | Apache-2.0, Galaxea | unchanged | `10db29e13785435bf4fbf7054ee73bbf6801ef4bb4fd32cedea6127d5bae7a16` |
| `licenses/galaxeamanipsim-NOTICE.txt` | GalaxeaManipSim `abe7f51`, `NOTICE` | Apache-2.0 NOTICE, Galaxea (MIT portions, Tianxing Chen) | unchanged | `b37c5fab7d2070adec53099acc19c6772a59ebd3bd8681a54401aff5aacf754e` |
| `licenses/mujoco_menagerie-ufactory_xarm7.txt` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/LICENSE` | BSD-3-Clause, UFACTORY Inc. | unchanged | `4fe659325706d0fc41592c8743d085a0bdf778056249f2a108943d22be916fb2` |
| `meshes/rainbow-rby1.stl` | mujoco_menagerie `f3b6013`, `rainbow_robotics_rby1/assets/EE_FINGER_0.obj` | Apache-2.0, Rainbow Robotics, `licenses/mujoco_menagerie-rainbow_robotics_rby1.txt` | modified: OBJ in metres to binary STL in millimetres | `b25966e831ec215924f7f2ae1fa169ffdc66c52d368ef2d35d1c86638ae8f6ab` |
| `licenses/mujoco_menagerie-rainbow_robotics_rby1.txt` | mujoco_menagerie `f3b6013`, `rainbow_robotics_rby1/LICENSE` | Apache-2.0, Rainbow Robotics | unchanged | `b8806955780f26ee80dbb5662fbf637a860d26bffd68298f0c2d222e38bab41f` |
| `licenses/mujoco_menagerie-leap_hand.txt` | mujoco_menagerie `f3b6013`, `leap_hand/LICENSE` | MIT, Ananye Agarwal | unchanged | `5a91c3d709c2ee3a71f166b46e3208cebd83c0c7a870746c729b31a01f156984` |

## The bodies of the 3D view and the pictures

Each sensor's page in the Library turns in 3D, and the Library's pictures
are shot from that view.  For the eighteen grippers that are not UMI fingers it
draws the whole gripper open with a sensor on both fingers (fully open, but
the LeFlexiTac's rotary jaw at 39 of its 100 degrees and the YUBI Gripper's
rotary fingers as far as its near sensor reads as a face, as their scenes
say; on a hand, the whole hand open with a sensor on every finger):
each gripper's scene (`scenes/<part>.json`, which names its sources at their
commits, the opening and how the other finger was found) places the bodies
below (`bodies/<part>/<name>.stl`) around the Library's part.

- The other finger of the Trossen WidowX AI, the ARX X5, the I2RT YAM and
  the YUBI Gripper is the mirror image of the Library's part, and its sensor is drawn with the
  mirror image of the board.  That board is not the entry's Gerbers, which
  make the board of the Library's part only.  On the other grippers the
  other finger is the same part turned, with the same board; on the
  Unitree Dex3-1, a three-finger hand, so is its third finger; on the LEAP
  Hand the thumb's and the two other fingers' fingertips are the same part
  turned or moved, each with the same board.
- The LeFlexiTac's other finger is its static jaw, a share of LeFlexiTac's
  wrist roll (`bodies/leflexitac/static-jaw.stl`; the servo's cradle is the
  rest of it, `bodies/leflexitac/wrist-roll.stl`), and its sensor is the
  Library part's board turned onto that jaw's flat face.
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
  way within 15 degrees; the LEAP Hand's within 1.0 mm and 45 degrees, and
  its two distal links' files drawn without their white fingertips, one
  object of each file, the fingertips being the Library's part); of the
  seven licence texts at the end of the table, trossen_wxai's, arx_l5's,
  SO-ARM100's (the LeFlexiTac's credit too) and openarm_description's serve
  these bodies alone, and the Seeed reBot DevArm's two (its MIT text and
  Seeed Studio's CERN-OHL-W-2.0 text) and the YUBI Gripper's their parts in
  the Files table too.
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

`bodies/leflexitac/sts3215.stl` is not the upstream file (Apache License
2.0, section 4(b)): it is SO-ARM100's
`Simulation/SO101/assets/sts3215_03a_v1.stl` (SHA-256
`a37c871fb502483ab96c256baf457d36f2e97afc9205313d9c5ab275ef941cd0`),
decimated with quadric error metrics from 19080 to 2396 triangles, its
surface within 0.30 mm of the upstream one both ways, scaled from metres to
millimetres and written as a binary STL, changed by the FlexiTac-Gen project
in 2026.

`bodies/leflexitac/wrist-roll.stl` is not the upstream file (no licence
stated): it is LeFlexiTac's `assets/models/Wrist_Roll_08c.stl` (SHA-256
`7e78b577cd03f5c3e1ec5c2a5c1f0fb71cbaed23e6dd2bf76dc166a3b0b7bdeb`), decimated
with quadric error metrics from 18856 to 2954 triangles, its surface within
0.28 mm of the upstream one both ways, written as a binary STL, of which this
file holds 1952 triangles, its triangles up to z 38 mm of the file, changed by
the FlexiTac-Gen project in 2026.

`bodies/leflexitac/static-jaw.stl` is not the upstream file (no licence
stated): it is LeFlexiTac's `assets/models/Wrist_Roll_08c.stl` (SHA-256
`7e78b577cd03f5c3e1ec5c2a5c1f0fb71cbaed23e6dd2bf76dc166a3b0b7bdeb`), decimated
with quadric error metrics from 18856 to 2954 triangles, its surface within
0.28 mm of the upstream one both ways, written as a binary STL, of which this
file holds 1002 triangles, its triangles above z 38 mm of the file, changed by
the FlexiTac-Gen project in 2026.

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

`bodies/unitree-dex3/palm.stl` is not the upstream file (BSD-3-Clause): it is
unitree_ros's
`robots/dexterous_hand_description/dex3_1/meshes/left_hand_palm_link.STL`
(SHA-256 `23a486b75bd78a9bf03cec25d84d87f97f3dae038cf21a743b6d469b337e4004`),
decimated with quadric error metrics from 42802 to 3570 triangles, its surface
within 0.44 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/unitree-dex3/thumb_0.stl` is not the upstream file (BSD-3-Clause): it
is unitree_ros's
`robots/dexterous_hand_description/dex3_1/meshes/left_hand_thumb_0_link.STL`
(SHA-256 `a90c721661c0622685488a3c74d1e122c7da89242d3a1daef75edb83422d05e0`),
decimated with quadric error metrics from 176 to 50 triangles, its surface
within 0.11 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/unitree-dex3/proximal.stl` is not the upstream file (BSD-3-Clause): it
is unitree_ros's
`robots/dexterous_hand_description/dex3_1/meshes/left_hand_index_0_link.STL`
(SHA-256 `6b35f2f77211d5a366f0b9a4e47c4ee35e536731266f1a34e9efa12db579b892`),
decimated with quadric error metrics from 9518 to 2210 triangles, its surface
within 0.24 mm of the upstream one both ways, scaled from metres to millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026.
The two decimated bodies described above, `bodies/unitree-dex3/palm.stl` and
`bodies/unitree-dex3/proximal.stl` (drawn three times, as the index's, the
middle finger's and the thumb's first links), are in the Library as the
component files of the table below (split by look, their triangles
unchanged), not under those two names.

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

`bodies/robotiq-2f-85/base_mount.stl` is not the upstream file (BSD-2-Clause):
it is mujoco_menagerie's `robotiq_2f85/assets/base_mount.stl` (SHA-256
`87971dfdd6e5311b5a723e7b73c4701ebf5c2364df671500f30dfc1c53c8e61a`), decimated
with quadric error metrics from 21834 to 1790 triangles, its surface within
0.43 mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/robotiq-2f-85/base.stl` is not the upstream file (BSD-2-Clause): it is
mujoco_menagerie's `robotiq_2f85/assets/base.stl` (SHA-256
`1c7b9f2bd92d705fc4e897c94e905973a3c05f406845e942229433deb7041453`), decimated
with quadric error metrics from 34248 to 7186 triangles, its surface within
0.44 mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.  It is published shared out by material, its
triangles unchanged, as `bodies/robotiq-2f-85/base-palm.stl`,
`bodies/robotiq-2f-85/base-screws.stl` and
`bodies/robotiq-2f-85/base-housing.stl`.

`bodies/robotiq-2f-85/driver.stl` is not the upstream file (BSD-2-Clause): it
is mujoco_menagerie's `robotiq_2f85/assets/driver.stl` (SHA-256
`bbd6e868b1778bead60d2516c7ede581d7ad4e431744b1828757d6ea5129c112`), decimated
with quadric error metrics from 1340 to 400 triangles, its surface within 0.28
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/robotiq-2f-85/coupler.stl` is not the upstream file (BSD-2-Clause): it
is mujoco_menagerie's `robotiq_2f85/assets/coupler.stl` (SHA-256
`d5ee95e62f8415bf5b6e503c831a958f5fc1990bf9b2865329ec38a28932727c`), decimated
with quadric error metrics from 1780 to 644 triangles, its surface within 0.26
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.  The Library holds it as
`bodies/robotiq-2f-85/coupler-link.stl`: all its triangles, none of them
changed, in one file of one look, beside the pins the project drew in its holes
(below).

`bodies/robotiq-2f-85/spring_link.stl` is not the upstream file (BSD-2-Clause):
it is mujoco_menagerie's `robotiq_2f85/assets/spring_link.stl` (SHA-256
`4fb74a8a0d76c0e471cf19fd48bc676fd5b19123798e7a39eb6aa56869354283`), decimated
with quadric error metrics from 1696 to 652 triangles, its surface within 0.20
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.  It is published shared out by material, its
triangles unchanged, as `bodies/robotiq-2f-85/spring-link-far-pins.stl` and
`bodies/robotiq-2f-85/spring-link.stl`.

`bodies/robotiq-2f-85/follower.stl` is not the upstream file (BSD-2-Clause): it
is mujoco_menagerie's `robotiq_2f85/assets/follower.stl` (SHA-256
`633793332c081641ce200df27a40643cc293b29956e3cb5cb29cb811c33ef1c7`), decimated
with quadric error metrics from 2208 to 868 triangles, its surface within 0.32
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.  It is published shared out by material, its
triangles unchanged, as `bodies/robotiq-2f-85/follower-pins.stl` and
`bodies/robotiq-2f-85/follower-tip.stl`.

`bodies/robotiq-2f-85/pad.stl` is not the upstream file (BSD-2-Clause): it is
mujoco_menagerie's `robotiq_2f85/assets/pad.stl` (SHA-256
`4af1fa8d9bb285abecbf5dfc88e74cb30f059a7a074c2030dc35e9ee4316019d`), decimated
with quadric error metrics from 300 to 34 triangles, its surface within 0.16 mm
of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/robotiq-2f-85/drawn-coupler-pins.stl`,
`bodies/robotiq-2f-85/drawn-spring-link-caps.stl` and
`bodies/robotiq-2f-85/drawn-spring-link-pins.stl` are not from the upstream
model, which leaves those pivots' holes open: they are plain cylinders drawn by
the FlexiTac-Gen project in 2026 after Robotiq's studio photos of the gripper
(a pin's head in each pivot of the outer link, and in the inner link's bore at
the housing a dark cap with a pin's head in it), from the numbers of
`tools/library_looks/robotiq-2f-85.json`.  They are the project's own drawing,
not Robotiq's geometry.

`bodies/agilex-piper/link6.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `agilex_piper/assets/link6.stl` (SHA-256
`e0b2050ba81a45c79c045b9f13e3d1dd11f84bca1beb12eebc3102651c8476cf`), decimated
with quadric error metrics from 13422 to 7106 triangles, its surface within
0.44 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.  It is
published shared out by material, its triangles unchanged, as
`bodies/agilex-piper/link6-rail.stl`, `bodies/agilex-piper/link6-plate.stl`
and `bodies/agilex-piper/link6-can.stl`.

`bodies/galaxea-r1-lite/left_gripper_link.stl` is not the upstream file (Apache
License 2.0, section 4(b)): it is GalaxeaManipSim's
`galaxea_sim/assets/r1_lite/meshes/left_gripper_link.STL` (SHA-256
`5f47c587e75fe94f8c5b041691e8a32d873bf5e80d586760e6dea89a2fa2511f`), decimated
with quadric error metrics from 2708 to 1542 triangles, its surface within 0.43
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.  It is in the
Library as the two component files of the table below (split by look, their
triangles unchanged), not under that name.

`bodies/galaxea-r1-lite/drawn-carriage-sensor.stl` is not a file of the
upstream model, whose finger mesh holds the finger, its carriage and its
rack as one body of one colour: it is plain boxes drawn by the FlexiTac-Gen
project in 2026 after Galaxea's pictures of the gripper (on the sensor's
finger, just proud of the model's own, in the carriage's black: the
carriage's block on the plate, its bar in the notch at the base of the
finger's face and the fillet between them, and the rack where the plate's
slot shows it), from the numbers of `tools/library_looks/galaxea-r1-lite.json`.
It is the project's own drawing, not Galaxea's geometry.

`bodies/seeed-rebot/cnc7.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `seeed_rebot_devarm/assets/cnc7.STL` (SHA-256
`2d6088744c7d5195fc3f78d930dba9a9843ad208b2a6243fade1aaf17fecc782`), decimated
with quadric error metrics from 4086 to 2122 triangles, its surface within 0.39
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/seeed-rebot/pla7_green.stl` is not the upstream file (MIT License): it
is mujoco_menagerie's `seeed_rebot_devarm/assets/pla7_green.STL` (SHA-256
`00b3c3d51f6f756ab96fc65a229610b952ce4a8be927e2ec404bacbcf43f4afc`), decimated
with quadric error metrics from 1010 to 740 triangles, its surface within 0.45
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/seeed-rebot/cnc_left.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `seeed_rebot_devarm/assets/cnc_left.STL` (SHA-256
`8f8ed951fad05dd5e3fec04f697864a64e394db9138d72fdfa62f8f047388aa6`), decimated
with quadric error metrics from 2544 to 1044 triangles, its surface within 0.27
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/seeed-rebot/drawn-motor-can.stl`,
`bodies/seeed-rebot/drawn-motor-base.stl` and
`bodies/seeed-rebot/drawn-motor-plugs.stl` are not files of the upstream
model: they are plain cylinders and boxes drawn by the FlexiTac-Gen project
in 2026 in place of the model's `motor_7.STL` (the reBot DevArm's RS-00
gripper actuator, which decimated within 0.5 mm keeps 20 629 of its 26 480
triangles, 1.03 MB), to that mesh's sizes and where the model places it (its
can, its base ring and its two plug housings), from the numbers of
`tools/library_looks/seeed-rebot.json`.  They are the project's own drawing,
not Seeed Studio's geometry.

`bodies/ufactory-xarm/base_link.stl` is not the upstream file (BSD-3-Clause):
it is mujoco_menagerie's `ufactory_xarm7/assets/base_link.stl` (SHA-256
`cdaa4cff22f7c9cff05c6a8ed32f94fd2b11a69d37dd97a159ccee2d8dd32f13`), decimated
with quadric error metrics from 24227 to 5580 triangles, its surface within
0.45 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/ufactory-xarm/left_outer_knuckle.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`ufactory_xarm7/assets/left_outer_knuckle.stl` (SHA-256
`501665812b08d67e764390db781e839adc6896a9540301d60adf606f57648921`), decimated
with quadric error metrics from 444 to 374 triangles, its surface within 0.32
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/ufactory-xarm/left_inner_knuckle.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`ufactory_xarm7/assets/left_inner_knuckle.stl` (SHA-256
`e8e48692ad26837bb3d6a97582c89784d09948fc09bfe4e5a59017859ff04dac`), decimated
with quadric error metrics from 7324 to 2940 triangles, its surface within 0.31
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/ufactory-xarm/right_outer_knuckle.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`ufactory_xarm7/assets/right_outer_knuckle.stl` (SHA-256
`75ca1107d0a42a0f03802a9a49cab48419b31851ee8935f8f1ca06be1c1c91e8`), decimated
with quadric error metrics from 444 to 374 triangles, its surface within 0.32
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/ufactory-xarm/right_inner_knuckle.stl` is not the upstream file
(BSD-3-Clause): it is mujoco_menagerie's
`ufactory_xarm7/assets/right_inner_knuckle.stl` (SHA-256
`b41dd2c2c550281bf78d7cc6fa117b14786700e5c453560a0cb5fd6dfa0ffb3e`), decimated
with quadric error metrics from 7324 to 2906 triangles, its surface within 0.23
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/ufactory-xarm/drawn-pad-sensor.stl` and
`bodies/ufactory-xarm/drawn-pad-mate.stl` are not from the upstream model,
whose finger and its pad are one file: they are plain prisms drawn by the
FlexiTac-Gen project in 2026 so that the pad shows the light grey rubber of
UFACTORY's photos (on each finger, over the pad of
`meshes/ufactory-xarm.stl`, which is unchanged: the pad's outline and
thickness, 0.02 mm larger on every side), from the numbers of
`tools/library_looks/ufactory-xarm.json`.  They are the project's own
drawing, not UFACTORY's geometry.

`bodies/rainbow-rby1/ee_body.stl` is not the upstream file (Apache License
2.0, section 4(b)): it is mujoco_menagerie's
`rainbow_robotics_rby1/assets/EE_BODY.obj` (SHA-256
`61522247e9edbcbeb4c1d3bafa55c4828425875c89cf95eab197e7157d58dcfd`), decimated
with quadric error metrics from 3500 to 1848 triangles, its surface within 0.39
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/rainbow-rby1/ee_finger_1.stl` is not the upstream file (Apache License
2.0, section 4(b)): it is mujoco_menagerie's
`rainbow_robotics_rby1/assets/EE_FINGER_1.obj` (SHA-256
`1e1716f93d8c36cd7babfb13ddb35c2d311030d178527fefa909624220aba3e0`), decimated
with quadric error metrics from 416 to 236 triangles, its surface within 0.13
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/enactic-openarm/hand.stl` is not the upstream file (Apache License 2.0, section
4(b)): it is openarm_description's
`assets/end_effector/parallel_link/meshes/visual/hand.dae` (SHA-256
`a7a1ff18be1b603544f36645b50e9842ee1ea94d1ba8cbccdeded50946f4bce7`), decimated
with quadric error metrics from 28508 to 3136 triangles, its surface within
0.44 mm of the upstream one both ways, read from Collada (DAE) in millimetres
and written as a binary STL, changed by the FlexiTac-Gen project in 2026. It is
published shared out by material, its triangles unchanged, as
`bodies/enactic-openarm/hand-rail.stl` and `bodies/enactic-openarm/hand-brackets.stl`.

`bodies/enactic-openarm/link7-motor.stl` is not the upstream file (Apache License 2.0,
section 4(b)): it is openarm_description's
`assets/robot/openarm_v1.0/mesh/arm/visual/link7.dae` (SHA-256
`e0e1d59b1e09c5a73198cdf175dbb94844073ec067d4b491dcab8a9e1a7faade`), of it the
gripper's motor (the components wholly above z 590 mm) alone, decimated with
quadric error metrics from 74250 to 7053 triangles, its surface within 0.45 mm
of the upstream one both ways, read from Collada (DAE) in millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026. It is
published shared out by material, its triangles unchanged, as
`bodies/enactic-openarm/motor-flange.stl`, `bodies/enactic-openarm/motor-cap.stl`,
`bodies/enactic-openarm/motor-screws.stl` and `bodies/enactic-openarm/motor-can.stl`.

`bodies/enactic-openarm/finger-carriage.stl` is not the upstream file (Apache License
2.0, section 4(b)): it is openarm_description's
`assets/end_effector/parallel_link/meshes/visual/finger.dae` (SHA-256
`64492f6a80a551a7a53e3f769facc42ee4a9bce1634ff63300a9d7f5b3628cb0`), of it the
guide's carriage block (its material mat_0.009) alone, decimated with quadric
error metrics from 13550 to 1396 triangles, its surface within 0.39 mm of the
upstream one both ways, read from Collada (DAE) in millimetres and written as a
binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/yubi-gripper/case.stl` is not the upstream file (CERN-OHL-W-2.0,
section 3.3): it is yubi-hw's `STL/gripper/CASE.stl` (SHA-256
`2055cc9d2fa3e458a47aa91ac7de0470f749acf21bf3aea4d255ca6bec8a74a5`), decimated
with quadric error metrics from 3020 to 1354 triangles, its surface within 0.38
mm of the upstream one both ways, written from ASCII as a binary STL, changed
by the FlexiTac-Gen project on 2026-11-17.

`bodies/yubi-gripper/bracket-dynamixel.stl` is not the upstream file
(CERN-OHL-W-2.0, section 3.3): it is yubi-hw's
`STL/gripper/BRACKET_DYNAMIXEL.stl` (SHA-256
`79958cf52c8cde2df6f3153c7eafb63321e428a6ce32b81b9354b9f440d7fd3e`), decimated
with quadric error metrics from 1024 to 516 triangles, its surface within 0.15
mm of the upstream one both ways, written from ASCII as a binary STL, changed
by the FlexiTac-Gen project on 2026-11-17.

`bodies/yubi-gripper/upper-plate.stl` is not the upstream file (CERN-OHL-W-2.0,
section 3.3): it is yubi-hw's `STL/gripper/UPPER PLATE_CAMERA BKT.stl` (SHA-256
`67c869b7962a30adedb625cc2cf8efc53e1202aa6b149bfb28d2b37ae1f11e5e`), decimated
with quadric error metrics from 3620 to 1440 triangles, its surface within 0.29
mm of the upstream one both ways, written as a binary STL, changed by the
FlexiTac-Gen project on 2026-11-17.

`bodies/yubi-gripper/finger-attachment.stl` is not the upstream file
(CERN-OHL-W-2.0, section 3.3): it is yubi-hw's `STL/gripper/FINGER
ATTACHMENT_L.stl` (SHA-256
`9e842840bb0d36316c1338f41184b851b5530d4006c32d32cf499bde28d55d1a`), decimated
with quadric error metrics from 1088 to 460 triangles, its surface within 0.29
mm of the upstream one both ways, written from ASCII as a binary STL, changed
by the FlexiTac-Gen project on 2026-11-17.

`bodies/yubi-gripper/flap.stl` is not the upstream file (CERN-OHL-W-2.0,
section 3.3): it is yubi-hw's `STL/gripper/FLAP_L.stl` (SHA-256
`a8e76c8e77688064bdf5a6fb68a87f1d5bbf86bfc2dd90df55132fd05647b371`), decimated
with quadric error metrics from 1039 to 257 triangles, its surface within 0.26
mm of the upstream one both ways, written from ASCII as a binary STL, changed
by the FlexiTac-Gen project on 2026-11-17.

The YUBI Gripper's `bodies/yubi-gripper/bracket.stl` and `plate.stl` are
`bracket-dynamixel.stl`'s and `upper-plate.stl`'s triangles (above), split
by look; `bodies/yubi-gripper/drawn-servo.stl`, `drawn-camera-board.stl`,
`drawn-camera-lens.stl` and `drawn-camera-glass.stl` are plain boxes, prisms
and cylinders drawn by the FlexiTac-Gen project on 2026-11-17, from the
numbers of `tools/library_looks/yubi-gripper.json`: the DYNAMIXEL
XM430-W350-R servo to its published size (28.5 x 46.5 x 34 mm) and the
fisheye camera's board, lens holder and lens to the sizes of the assembly
STEP's camera, where that assembly places them.  They are the project's own
drawing, not ROBOTIS's, ELP's or the YUBI project's geometry.

`bodies/leap-hand/palm.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/palm_right.obj` (SHA-256
`839b2e58e69ce57e0feaa2f565f8124101a2ed81d99fb2c5d00372b245634ab8`), decimated
with quadric error metrics from 86942 to 15992 triangles, its surface within
0.90 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/base.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/base.obj` (SHA-256
`3d7194a6a33626ffcdfce78a0ca854e67b6b49f2e09a3bd62656f94515fdfbec`), decimated
with quadric error metrics from 32174 to 5716 triangles, its surface within
0.90 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/proximal.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/proximal.obj` (SHA-256
`3fff19dc1f0100bb5f34eaf8a40fcf3db40f96fd7179bb7336e538b21ff8e067`), decimated
with quadric error metrics from 21020 to 3916 triangles, its surface within
0.90 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/medial.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/medial.obj` (SHA-256
`472e054348c5a0e987829e721d5ba8486ddd47d867e416bb45d8d2a2ff917acf`), decimated
with quadric error metrics from 30764 to 5690 triangles, its surface within
0.88 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/distal.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/distal.obj` (SHA-256
`6bfa2afb2a06557ce0c54b03baec13522bfe561aabb576bd4701d4704f93ec0f`), its object
fingertip alone, decimated with quadric error metrics from 9781 to 1711
triangles, its surface within 0.85 mm of the upstream one both ways, scaled
from metres to millimetres and written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

`bodies/leap-hand/thumb_base.stl` is not the upstream file (MIT License): it is
mujoco_menagerie's `leap_hand/assets/thumb_base.obj` (SHA-256
`d28876cc3b674323aa7d8a628a4240cda2757c61263b05e86a66280035a2689d`), decimated
with quadric error metrics from 9376 to 1742 triangles, its surface within 0.89
mm of the upstream one both ways, scaled from metres to millimetres and written
as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/thumb_proximal.stl` is not the upstream file (MIT License):
it is mujoco_menagerie's `leap_hand/assets/thumb_proximal.obj` (SHA-256
`5b402876601f2b0b36631e6a54ad20588f88e74f52320b6c902a8bc694578689`), decimated
with quadric error metrics from 29028 to 5080 triangles, its surface within
0.89 mm of the upstream one both ways, scaled from metres to millimetres and
written as a binary STL, changed by the FlexiTac-Gen project in 2026.

`bodies/leap-hand/thumb_distal.stl` is not the upstream file (MIT License): it
is mujoco_menagerie's `leap_hand/assets/thumb_distal.obj` (SHA-256
`4695d72a70285e8a0132ed4de49876cf99c813182e3a24b172b53631224890de`), its object
thumb_fingertip alone, decimated with quadric error metrics from 20781 to 3657
triangles, its surface within 0.89 mm of the upstream one both ways, scaled
from metres to millimetres and written as a binary STL, changed by the
FlexiTac-Gen project in 2026.

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
| `bodies/robotiq-2f-85/base_mount.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/base_mount.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.43 mm) | `8fd8796a29801361d2b418d71e60207b545c1c945e0a24e87227f97fd520a522` |
| `bodies/robotiq-2f-85/base-palm.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/base.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.44 mm); split by look, its triangles unchanged (one of the 3 files of base.stl's) | `34402c00f6ddcab95365effe67956ed395a646a0902a54049580ee926b1d2836` |
| `bodies/robotiq-2f-85/base-screws.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/base.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.44 mm); split by look, its triangles unchanged (one of the 3 files of base.stl's) | `2f8372e89470951284b07dc2dc3b98308542537950051711f7eb371cc2c31158` |
| `bodies/robotiq-2f-85/base-housing.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/base.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.44 mm); split by look, its triangles unchanged (one of the 3 files of base.stl's) | `10d076752f8342ddfbcb5e457a39ffe463c9d75af4d1635eb7afab06156f6a37` |
| `bodies/robotiq-2f-85/driver.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/driver.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.28 mm) | `612d798e7d0425e4ba9e0b97aeb4f9cf586a30da277778aebf8b319617dcfba8` |
| `bodies/robotiq-2f-85/coupler-link.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/coupler.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.26 mm); split by look, its triangles unchanged (the one file of coupler.stl's) | `3b1c077e6613a0047c4d71086d1b6a76230bd84f563625242395c8fd7c456421` |
| `bodies/robotiq-2f-85/spring-link-far-pins.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/spring_link.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.20 mm); split by look, its triangles unchanged (one of the 2 files of spring_link.stl's) | `d110d548ce8f5973d3a86a4983f3149636d896c1e30ad7ad30372e99cfc13413` |
| `bodies/robotiq-2f-85/spring-link.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/spring_link.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.20 mm); split by look, its triangles unchanged (one of the 2 files of spring_link.stl's) | `20dbf70b890999ba9e62e8ddf990fc073a1e553818cc8fc636fee44dd6197a4b` |
| `bodies/robotiq-2f-85/follower-pins.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/follower.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.32 mm); split by look, its triangles unchanged (one of the 2 files of follower.stl's) | `45440bef98962e1bf7a36b96790e9468f30b248e507ac32a2d77c89e22e41a03` |
| `bodies/robotiq-2f-85/follower-tip.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/follower.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.32 mm); split by look, its triangles unchanged (one of the 2 files of follower.stl's) | `19a9b43ee9c2d772b0269fab0b05a48d27c5bda3d66f548279ccac50a1d8a0ce` |
| `bodies/robotiq-2f-85/pad.stl` | mujoco_menagerie `f3b6013`, `robotiq_2f85/assets/pad.stl` | BSD-2-Clause, ROS-Industrial, `licenses/mujoco_menagerie-robotiq_2f85.txt` | modified: decimated (quadric error metrics, 0.16 mm) | `0a16b432f97e7fbfc160e6e18c356567c31d556ab428c31bf102964559398ce4` |
| `bodies/leflexitac/sts3215.stl` | SO-ARM100 `a758567`, `Simulation/SO101/assets/sts3215_03a_v1.stl` | Apache-2.0, TheRobotStudio, `licenses/so-arm100.txt` | modified: decimated (quadric error metrics, 0.30 mm), STL in metres to binary STL in millimetres | `475eddde4c84b2a207819d3d002c6cd0ced6874c83b8721b58b8f38abef6e0c4` |
| `bodies/leflexitac/wrist-roll.stl` | LeFlexiTac `b61259f`, `assets/models/Wrist_Roll_08c.stl` | NOASSERTION, the LeFlexiTac authors, no licence stated, shared with the authors' permission (given by a co-author of LeFlexiTac, 2026-11-17), `licenses/leflexitac.txt`; remodelled from SO-ARM100 `a758567`, `STL/SO101/Individual/Wrist_Roll_Follower_SO101.stl` (Apache-2.0, TheRobotStudio, `licenses/so-arm100.txt`) | modified: decimated (quadric error metrics, 0.28 mm); its triangles up to z 38 mm of the file | `de8487dbafaa5defdb3f382c0ccfcc75a7a1a6d940bdf4fa7b115dc126cfc4f7` |
| `bodies/leflexitac/static-jaw.stl` | LeFlexiTac `b61259f`, `assets/models/Wrist_Roll_08c.stl` | NOASSERTION, the LeFlexiTac authors, no licence stated, shared with the authors' permission (given by a co-author of LeFlexiTac, 2026-11-17), `licenses/leflexitac.txt`; remodelled from SO-ARM100 `a758567`, `STL/SO101/Individual/Wrist_Roll_Follower_SO101.stl` (Apache-2.0, TheRobotStudio, `licenses/so-arm100.txt`) | modified: decimated (quadric error metrics, 0.28 mm); its triangles above z 38 mm of the file | `a1991511f2b08448306cce9275db464dab20228471f9a6694c5b207e1da738fc` |
| `bodies/agilex-piper/link6-rail.stl` | mujoco_menagerie `fb36886`, `agilex_piper/assets/link6.stl` | MIT, RosenYin, `licenses/mujoco_menagerie-agilex_piper.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link6.stl's) | `b3f6044f2a06482fd2c5b4d46c293baa123b11d35da0519c4ec7c46356a442ca` |
| `bodies/agilex-piper/link6-plate.stl` | mujoco_menagerie `fb36886`, `agilex_piper/assets/link6.stl` | MIT, RosenYin, `licenses/mujoco_menagerie-agilex_piper.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link6.stl's) | `47173f8242fc24b8db5e42890668b16d54bd03cab36f8f48bc48d75550984e33` |
| `bodies/agilex-piper/link6-can.stl` | mujoco_menagerie `fb36886`, `agilex_piper/assets/link6.stl` | MIT, RosenYin, `licenses/mujoco_menagerie-agilex_piper.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 3 files of link6.stl's) | `2ff9d4f61ffaf09861980708b53fa17f0ef121150f02adf37b35531ca2730085` |
| `bodies/galaxea-r1-lite/gripper-motor.stl` | GalaxeaManipSim `abe7f51`, `galaxea_sim/assets/r1_lite/meshes/left_gripper_link.STL` | Apache-2.0, Galaxea, `licenses/galaxeamanipsim.txt` | modified: decimated (quadric error metrics, 0.43 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of left_gripper_link.stl's) | `afd686144aef1074f93d60af6ff60c1aa27c6f08ba4a3f9f1efabaaa36515a9f` |
| `bodies/galaxea-r1-lite/gripper-plate.stl` | GalaxeaManipSim `abe7f51`, `galaxea_sim/assets/r1_lite/meshes/left_gripper_link.STL` | Apache-2.0, Galaxea, `licenses/galaxeamanipsim.txt` | modified: decimated (quadric error metrics, 0.43 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of left_gripper_link.stl's) | `8840c9a0f17bb44bc9f072c80a2866bbe76b24d076ef45512258d5c2aef3b70f` |
| `bodies/seeed-rebot/cnc7-rail.stl` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/assets/cnc7.STL` | MIT, Seeed Studio, `licenses/mujoco_menagerie-seeed_rebot_devarm.txt` | modified: decimated (quadric error metrics, 0.39 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of cnc7.stl's) | `b6d933eb1d77a2ed23b40ccd176a785acc3eb2b63e772b5c6d3a8a5d3d9e6738` |
| `bodies/seeed-rebot/cnc7-plate.stl` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/assets/cnc7.STL` | MIT, Seeed Studio, `licenses/mujoco_menagerie-seeed_rebot_devarm.txt` | modified: decimated (quadric error metrics, 0.39 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of cnc7.stl's) | `13a42f862a2dd8ee1c8775bb83f275fa62fe6f86c3d36ca031fcddcb5c44da28` |
| `bodies/seeed-rebot/pla7_green.stl` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/assets/pla7_green.STL` | MIT, Seeed Studio, `licenses/mujoco_menagerie-seeed_rebot_devarm.txt` | modified: decimated (quadric error metrics, 0.45 mm), STL in metres to binary STL in millimetres | `6ec046829bfb334c5c1ee44b24ce9d64379d4d29f0d03da4751a9390b7730009` |
| `bodies/seeed-rebot/cnc_left.stl` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/assets/cnc_left.STL` | MIT, Seeed Studio, `licenses/mujoco_menagerie-seeed_rebot_devarm.txt` | modified: decimated (quadric error metrics, 0.27 mm), STL in metres to binary STL in millimetres | `412dfbd8b9469da5ff657aee3266a2e5c6767797d1f4d72930f6c0db86d6e7cc` |
| `bodies/ufactory-xarm/base-shell.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/base_link.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.45 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of base_link.stl's) | `b9300559117c8503f5b0f411fcc3d8257a3653c6c4b3585617812195c359b647` |
| `bodies/ufactory-xarm/base-screws.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/base_link.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.45 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of base_link.stl's) | `c7cd97b6478a6172c3c945ca04e8c438a2a8bc67c2dd7c59bab2332152b78e86` |
| `bodies/ufactory-xarm/base-flange.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/base_link.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.45 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of base_link.stl's) | `b7c28b031c2c15d726aa921af8a5f2fb3fb8c005c656b2084c8ef20fdb311a5a` |
| `bodies/ufactory-xarm/base-chassis.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/base_link.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.45 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 4 files of base_link.stl's) | `88274b3f2c6c0071f161a3afeadc08c019502ec1fac68923af5ecfe9b146b07b` |
| `bodies/ufactory-xarm/left_outer_knuckle.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/left_outer_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.32 mm), STL in metres to binary STL in millimetres | `c9393b6c78a59b50d6cff3dabb2c25401f084f5039d9b59f0b2493ef6098596c` |
| `bodies/ufactory-xarm/left-inner-pins.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/left_inner_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.31 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of left_inner_knuckle.stl's) | `07c144b8d1d40ac83d2012eab7864b92ea3086c151b63d0b38461b15f61106ce` |
| `bodies/ufactory-xarm/left-inner-links.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/left_inner_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.31 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of left_inner_knuckle.stl's) | `298f61b19d83dcb0a05596d341a1d344e32a836a6cb63f21d58cbfb291f8ec4a` |
| `bodies/ufactory-xarm/right_outer_knuckle.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/right_outer_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.32 mm), STL in metres to binary STL in millimetres | `e0a5402c805ed12978ab5dd6b95aef4e901fedb46f2122c139e308933f7a12e1` |
| `bodies/ufactory-xarm/right-inner-pins.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/right_inner_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.23 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of right_inner_knuckle.stl's) | `0347e182eedcd410e97eea8e2c8440e916d614e196a9167a1cf04e7e0d84027e` |
| `bodies/ufactory-xarm/right-inner-links.stl` | mujoco_menagerie `f3b6013`, `ufactory_xarm7/assets/right_inner_knuckle.stl` | BSD-3-Clause, UFACTORY Inc., `licenses/mujoco_menagerie-ufactory_xarm7.txt` | modified: decimated (quadric error metrics, 0.23 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of right_inner_knuckle.stl's) | `311cb50b06f7352dda5e8ef214483b5d8b44fbf59de2ca7badcdd50d3050175b` |
| `bodies/rainbow-rby1/ee_body.stl` | mujoco_menagerie `f3b6013`, `rainbow_robotics_rby1/assets/EE_BODY.obj` | Apache-2.0, Rainbow Robotics, `licenses/mujoco_menagerie-rainbow_robotics_rby1.txt` | modified: decimated (quadric error metrics, 0.39 mm), OBJ in metres to binary STL in millimetres | `870be7d956d2fab630dee864aefa9174ea59b85dcf0342289163256cec1c7241` |
| `bodies/rainbow-rby1/ee_finger_1.stl` | mujoco_menagerie `f3b6013`, `rainbow_robotics_rby1/assets/EE_FINGER_1.obj` | Apache-2.0, Rainbow Robotics, `licenses/mujoco_menagerie-rainbow_robotics_rby1.txt` | modified: decimated (quadric error metrics, 0.13 mm), OBJ in metres to binary STL in millimetres | `ff90e1efe93736fadba19dbe358a53dc7ceb8eee693c6ffb330d4c878e7da12a` |
| `bodies/enactic-openarm/hand-rail.stl` | openarm_description `81fe647`, `assets/end_effector/parallel_link/meshes/visual/hand.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: decimated (quadric error metrics, 0.44 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 2 files of hand.stl's) | `1d7ea3228c15fea8cf59ccad0bb58e8b04bd2d143cca38e9110984250fa00d2b` |
| `bodies/enactic-openarm/hand-brackets.stl` | openarm_description `81fe647`, `assets/end_effector/parallel_link/meshes/visual/hand.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: decimated (quadric error metrics, 0.44 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 2 files of hand.stl's) | `698375c86eb13c5138c189d44a173749feea741b0f7e14579b92a5a8715d198c` |
| `bodies/enactic-openarm/motor-flange.stl` | openarm_description `81fe647`, `assets/robot/openarm_v1.0/mesh/arm/visual/link7.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: the gripper's motor (the components wholly above z 590 mm), decimated (quadric error metrics, 0.45 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 4 files of link7-motor.stl's) | `b0f75b4966849d6554f75e49326ac8930cc1aabc10beceb1b1020e0cda25b686` |
| `bodies/enactic-openarm/motor-cap.stl` | openarm_description `81fe647`, `assets/robot/openarm_v1.0/mesh/arm/visual/link7.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: the gripper's motor (the components wholly above z 590 mm), decimated (quadric error metrics, 0.45 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 4 files of link7-motor.stl's) | `cd620e7df6a95dc8698116be1c1e654a7bcb0398f46326d20f6bb35f75c51e65` |
| `bodies/enactic-openarm/motor-screws.stl` | openarm_description `81fe647`, `assets/robot/openarm_v1.0/mesh/arm/visual/link7.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: the gripper's motor (the components wholly above z 590 mm), decimated (quadric error metrics, 0.45 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 4 files of link7-motor.stl's) | `7b5f5ee22807c3bd1b8c9f642db1587ec1008c1f327c42aadfe93630e5ed8c51` |
| `bodies/enactic-openarm/motor-can.stl` | openarm_description `81fe647`, `assets/robot/openarm_v1.0/mesh/arm/visual/link7.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: the gripper's motor (the components wholly above z 590 mm), decimated (quadric error metrics, 0.45 mm), Collada (DAE) in millimetres to binary STL; split by look, its triangles unchanged (one of the 4 files of link7-motor.stl's) | `f1e4c23f7ff0284d781c4d9bd6793618b13d4d46166246fa916de386f389327b` |
| `bodies/enactic-openarm/finger-carriage.stl` | openarm_description `81fe647`, `assets/end_effector/parallel_link/meshes/visual/finger.dae` | Apache-2.0, Enactic, Inc., `licenses/openarm_description.txt` | modified: the guide's carriage block (its material mat_0.009), decimated (quadric error metrics, 0.39 mm), Collada (DAE) in millimetres to binary STL | `3e50ee99348ef41531ddfb8e19a8a89ce541d71a652ed5113289ae93dabc0f44` |
| `bodies/yubi-gripper/case.stl` | yubi-hw `dd8bd13`, `STL/gripper/CASE.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | modified: decimated (quadric error metrics, 0.38 mm), ASCII STL to binary STL | `248206349accc277043777812d79c1edab5972aae5ac48fa7f8996b438626318` |
| `bodies/yubi-gripper/bracket.stl` | yubi-hw `dd8bd13`, `STL/gripper/BRACKET_DYNAMIXEL.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | modified: decimated (quadric error metrics, 0.15 mm), ASCII STL to binary STL; split by look, its triangles unchanged (the one file of bracket-dynamixel.stl's) | `12ac435beef07d5823ec4df44baea88ef459b146a577103758fc85eda958b2ed` |
| `bodies/yubi-gripper/plate.stl` | yubi-hw `dd8bd13`, `STL/gripper/UPPER PLATE_CAMERA BKT.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | modified: decimated (quadric error metrics, 0.29 mm); split by look, its triangles unchanged (the one file of upper-plate.stl's) | `1db4fb76c8b8b81961fb0cd73fc043fd1edf0009d7b34e559c3fe2f53de3aed9` |
| `bodies/yubi-gripper/finger-attachment.stl` | yubi-hw `dd8bd13`, `STL/gripper/FINGER ATTACHMENT_L.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | modified: decimated (quadric error metrics, 0.29 mm), ASCII STL to binary STL | `3979daffc4957f2070429dc8bbcf65f4a59a22028f9ac96ebd206f082caa1a71` |
| `bodies/yubi-gripper/flap.stl` | yubi-hw `dd8bd13`, `STL/gripper/FLAP_L.stl` | CERN-OHL-W-2.0, Toyota Motor Corporation, `licenses/yubi-hw.txt` | modified: decimated (quadric error metrics, 0.26 mm), ASCII STL to binary STL | `bec1f7fe16faae6fdb3ce98ba7a85ef0f6b6f18ad6eb5e056cf13f42ea996254` |
| `bodies/unitree-dex3/palm-knuckles.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_palm_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of palm.stl's) | `07305e114a514a8b6640cd1eeee9ee4ba36ad788ab4e2755ffc071a9724f8b38` |
| `bodies/unitree-dex3/palm-shell.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_palm_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.44 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of palm.stl's) | `39efa9d01230decad86576d898327362792d9ce5bd0f265b1f37a8b37d401dba` |
| `bodies/unitree-dex3/thumb_0.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_thumb_0_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.11 mm), STL in metres to binary STL in millimetres | `a3c875844c6ab5cf024c0bb95a36b511269d42e2514eea3f59243904027f4e6b` |
| `bodies/unitree-dex3/proximal-pad.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_index_0_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.24 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of proximal.stl's) | `4fd2db0c3d031a04c5465a78df25189261e1149c424195a77553c65af6f95ee4` |
| `bodies/unitree-dex3/proximal-frame.stl` | unitree_ros `b579bbe`, `robots/dexterous_hand_description/dex3_1/meshes/left_hand_index_0_link.STL` | BSD-3-Clause, HangZhou YuShu Technology (Unitree Robotics), `licenses/unitree_ros.txt` | modified: decimated (quadric error metrics, 0.24 mm), STL in metres to binary STL in millimetres; split by look, its triangles unchanged (one of the 2 files of proximal.stl's) | `91d94b516659f97b53a94040f4b2f39c32a8bcb7c0fc42648e5912885641b9ba` |
| `bodies/leap-hand/palm.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/palm_right.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.90 mm), OBJ in metres to binary STL in millimetres | `870a2186c2aabb263cd8a1c7053a553606ae254e5de6e82ab0c82282fe6b2fb5` |
| `bodies/leap-hand/base.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/base.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.90 mm), OBJ in metres to binary STL in millimetres | `24fb1fc0da681f5c8fe6a7dbcb1797a48fb2f17d217ca2c910da90caf7780f3e` |
| `bodies/leap-hand/proximal.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/proximal.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.90 mm), OBJ in metres to binary STL in millimetres | `b31d59d974f7284f98f2857ac9287df9c700584f9fc7a644fa6262134ba4e7c3` |
| `bodies/leap-hand/medial.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/medial.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.88 mm), OBJ in metres to binary STL in millimetres | `b006d7ac979560d25b4d9712515b034de3a86d9d4292b9ccce24ac8b2bcf7144` |
| `bodies/leap-hand/distal.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/distal.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: its object fingertip alone, decimated (quadric error metrics, 0.85 mm), OBJ in metres to binary STL in millimetres | `41f2ebf82ad884f0e10611c5aaf1d1746cd23371b8f1bee35db9035c0556bbaf` |
| `bodies/leap-hand/thumb_base.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/thumb_base.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.89 mm), OBJ in metres to binary STL in millimetres | `64cf1e810c798a0ce6408335d8c2f376ce2c52afa37d3a32ff397d7e127bd4b4` |
| `bodies/leap-hand/thumb_proximal.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/thumb_proximal.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: decimated (quadric error metrics, 0.89 mm), OBJ in metres to binary STL in millimetres | `16dc4d76a36d882e42e3d2e360e69c7e4dab817922d20b039d02e7f6d482fb80` |
| `bodies/leap-hand/thumb_distal.stl` | mujoco_menagerie `f3b6013`, `leap_hand/assets/thumb_distal.obj` | MIT, Ananye Agarwal, `licenses/mujoco_menagerie-leap_hand.txt` | modified: its object thumb_fingertip alone, decimated (quadric error metrics, 0.89 mm), OBJ in metres to binary STL in millimetres | `c71979eaa5cb78fd79f41e8a58a3861324101d2603536ed8b81932898b2723a2` |
| `licenses/mujoco_menagerie-trossen_wxai.txt` | mujoco_menagerie `f3b6013`, `trossen_wxai/LICENSE` | BSD-3-Clause, Trossen Robotics | unchanged | `110a998ebd9a901d31173892d43224f8f59f12ebfd6398b9f3dea0ee9a01ab16` |
| `licenses/mujoco_menagerie-arx_l5.txt` | mujoco_menagerie `f3b6013`, `arx_l5/LICENSE` | BSD-3-Clause, ARXrobotics | unchanged | `11b6d7cd3c80b5eda4974f4fde6c08ec4c142bd9cb66f1b854974c25dab9cf22` |
| `licenses/so-arm100.txt` | SO-ARM100 `a758567`, `LICENSE` | Apache-2.0, TheRobotStudio | unchanged | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| `licenses/mujoco_menagerie-seeed_rebot_devarm.txt` | mujoco_menagerie `f3b6013`, `seeed_rebot_devarm/LICENSE` | MIT, Seeed Studio | unchanged | `3c46ce472bd9cd9c419bae897f4ced4ae73691c41fdd8eafa8a4b673725664e8` |
| `licenses/seeed-rebot_devarm.txt` | reBot-DevArm `eda479d`, `LICENSE` | CERN-OHL-W-2.0, Seeed Studio | unchanged | `e258a9c6833bfd17fb90252df8c33e29d13fabc2768508248927824c17878db7` |
| `licenses/openarm_description.txt` | openarm_description `81fe647`, `LICENSE.txt` | Apache-2.0, Enactic, Inc. | unchanged | `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` |
| `licenses/yubi-hw.txt` | yubi-hw `dd8bd13`, `LICENSE` | CERN-OHL-W-2.0, Toyota Motor Corporation | unchanged | `6d3e25e377354ac09d62d33c38520d0fc2a0d7be84b346643de91a5d46d98902` |

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

The names of the grippers and of their makers (2F-85, AgileX, ARX,
Carnegie Mellon University, Dex1, Dex3, Enactic, Feetech, Franka, G1, Galaxea,
I2RT, LEAP Hand, LeRobot, MakerMods, OpenArm, PiPER, R1 Lite, Rainbow Robotics,
RB-Y1, reBot, Robotiq, Seeed, SO-101, STS3215, TheRobotStudio, Toyota, Trossen,
UFACTORY, Unitree, WidowX, xArm, YAM, YUBI) and of the parts
drawn with them (DYNAMIXEL, ROBOTIS, ELP) are the trademarks of their owners;
FlexiTac is not affiliated with them, and no holder of these files endorses it
or the sensors fitted to their parts.
