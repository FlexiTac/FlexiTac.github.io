# Vendored UMI finger (CAD mode's default part)

CAD mode opens with this part loaded until a file is chosen (`web/cad/main.js`
`DEFAULT_PART`); it is served from this folder so the app stays offline and
keeps its CSP (`default-src 'self'`).

- Source: the HandUMI hardware repository
  (`https://github.com/murobotics-ai/handumi-hw`),
  `hardware/STL/gripper_tips/UMI-Gripper/UMI-Soft-Gripper-Finger.stl`, the
  soft fin-ray finger of the UMI gripper (Chi et al., RSS 2024); the same file
  as `asset/handumi-hw-main/` and `asset/UMI-Gripper/` in this repository.
- Licence: Apache License 2.0 (`LICENSE` here, the repository's own).
- Binary STL in millimetres, 3624 facets, 40.0 x 25.8 x 123.4 mm.
- `default-fit.json` is this project's own: the fit of the default part's
  sensor (the request the page sends and the reply), shipped so the sensor
  shows at once; written by `tools/browser/write_default_fit.py` and checked
  against the engine by `tests/test_surface_web.py`.

| File | Source | SHA-256 |
| --- | --- | --- |
| `UMI-Soft-Gripper-Finger.stl` | the repository's file, unchanged | `63331c666d485de462f3c7c80eb4200fd2bf98ac325095f5b0e8774a95dc8442` |
| `LICENSE` | the repository's `LICENSE`, unchanged | `2fc33ff0cc150ee1b1a71db5763a8b7c3732ede5edac98ef0ce532ee3405981a` |
