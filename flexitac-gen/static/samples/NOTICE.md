# Gen by Surface's samples

The step guide's "Try a sample" (Gen by Surface, `index.html`; the list is
`samples.json`) offers eight parts a visitor drags onto the 3D view, or
clicks, to see a sensor generated at once.  Six of them are Library fingers,
served from `web/library/meshes/` as they are and covered by
`web/library/NOTICE.md`: the UMI fin-ray finger's trapezoid tip of 5.8 mm and
convex arc tip of 13.8 mm (cut by the FlexiTac-Gen project from the HandUMI
finger), and the HandUMI replicas of the ARX X5 and MakerMods Metal Arm tips,
the I2RT YAM's left tip and the Unitree Dex1-1's finger.  The two whole
grippers are this folder's files, tabled below; their sensors are the
Library's of each gripper's finger.

## Sources

Each whole gripper is one binary STL in millimetres, assembled by the
FlexiTac-Gen project in 2026 (`tools/sample_grippers.py`) from the Library's
scene of that gripper (`web/library/scenes/<part>.json`: where each body and
the other finger stand, the jaws fully open) and the files it names, with no
geometry of its own:

- MuJoCo Menagerie, `https://github.com/google-deepmind/mujoco_menagerie` at
  `f3b6013629c7b94f8ee93fd977b161fa8350f9bc`: `franka_emika_panda`
  (Apache License 2.0; the model of the Franka Robotics Panda, derived from
  `franka_ros`) and `trossen_wx250s` (BSD-3-Clause, Copyright (c) 2023,
  Trossen Robotics; the WidowX 250, derived from
  `interbotix_ros_manipulators`).  Each licence text is that model folder's
  own `LICENSE` at the same commit, unchanged, in `licenses/` (the same files
  as `web/library/licenses/`).

## Modified files

`franka-hand-gripper.stl` is not an upstream file (Apache License 2.0,
section 4(b)): it is assembled from the Library's Franka Hand finger pad
(`web/library/meshes/franka-hand.stl`, the convex hull of the menagerie's
`franka_emika_panda/assets/finger_1.obj`, scaled from metres to
millimetres), twice (the sensor finger, then the other finger turned 180
degrees about the hand's axis, 80 mm across), the hand's five visual meshes
`hand_0.obj` to `hand_4.obj` (decimated by quadric error metrics, 0.22 to
0.43 mm) and, on each finger, `finger_0.obj`, each converted from OBJ in
metres to binary STL in millimetres and placed where the menagerie's
`hand.xml` places it at the full opening of 40 mm a finger (the Library's
decimated bodies, `web/library/bodies/franka-hand/`); changed by the
FlexiTac-Gen project in 2026.

`widowx-250-gripper.stl` is not an upstream file (BSD-3-Clause): it is
assembled from the menagerie's `trossen_wx250s/assets/wx250s_10_gripper_finger.stl`
(unchanged, the Library's `web/library/meshes/widowx-250.stl`), twice (the
left finger, then the right one turned 180 degrees about the approach axis,
84 mm across), and `wx250s_7_gripper.stl`, `wx250s_9_gripper_bar.stl` and
`wx250s_8_gripper_prop.stl` (decimated by quadric error metrics, 0.37, 0.34
and 0.26 mm), placed where the menagerie's `wx250s.xml` places them at the
full opening of 37 mm a finger (the Library's decimated bodies,
`web/library/bodies/widowx-250/`); changed by the FlexiTac-Gen project in
2026.

## Files

| File | Source at commit | Licence and holder | Change | SHA-256 |
| --- | --- | --- | --- | --- |
| `franka-hand-gripper.stl` | mujoco_menagerie `f3b6013`, `franka_emika_panda/assets/finger_1.obj`, `finger_0.obj`, `hand_0.obj` to `hand_4.obj` | Apache-2.0, `licenses/mujoco_menagerie-franka_emika_panda.txt` | modified: assembled from the Library's Franka Hand pad and the hand's bodies (decimated, OBJ in metres to binary STL in millimetres) at the full opening | `e06a40f6b35245556e251095b5a4c18ca3bb5befde16003ea82a0ab6fbefd765` |
| `widowx-250-gripper.stl` | mujoco_menagerie `f3b6013`, `trossen_wx250s/assets/wx250s_10_gripper_finger.stl`, `wx250s_7_gripper.stl`, `wx250s_8_gripper_prop.stl`, `wx250s_9_gripper_bar.stl` | BSD-3-Clause, Trossen Robotics, `licenses/mujoco_menagerie-trossen_wx250s.txt` | modified: assembled from both fingers and the gripper's bodies (decimated) at the full opening | `997bcaefe5c9ff76575cc849a49551dff3079650b15a5212335902cb61d291f1` |
| `licenses/mujoco_menagerie-franka_emika_panda.txt` | mujoco_menagerie `f3b6013`, `franka_emika_panda/LICENSE` | Apache-2.0 | unchanged | `a6cba85bc92e0cff7a450b1d873c0eaa2e9fc96bf472df0247a26bec77bf3ff9` |
| `licenses/mujoco_menagerie-trossen_wx250s.txt` | mujoco_menagerie `f3b6013`, `trossen_wx250s/LICENSE` | BSD-3-Clause, Trossen Robotics | unchanged | `21868447315ac2b10e592d08958c1035b19a32cf39e9165b23033f68390098cb` |

## This project's own files

`NOTICE.md`, `samples.json` and `thumbs/<id>.webp` (each sample's part as
Gen by Surface's 3D view draws it, drawn by `tools/browser/sample_thumbs.py`;
what they picture is the parts above and in `web/library/NOTICE.md`, under
those files' licences) are the FlexiTac-Gen project's own, under its Apache
License 2.0 (the repository's `LICENSE`).

## Trademarks

The names of the grippers and of their makers (Franka, WidowX, Trossen,
ARX, I2RT, YAM, Unitree, Dex1, MakerMods) are the trademarks of their
owners; FlexiTac is not affiliated with them, and no holder of these files
endorses it or the sensors fitted to their parts.
