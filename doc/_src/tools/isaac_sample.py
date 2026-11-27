"""Record one FlexiTac-IsaacSim episode as a visuo-tactile sample for the docs' point cloud viewer (pcv.js).

Run it with the Python of a FlexiTac-IsaacSim-Simulation environment
(github.com/binghao-huang/FlexiTac-IsaacSim-Simulation, main branch: Isaac Sim 6.2 + Isaac Lab 3.0), from that checkout:

    cd FlexiTac-IsaacSim-Simulation
    OMNI_KIT_ACCEPT_EULA=YES python /path/to/FlexiTac.github.io/doc/_src/tools/isaac_sample.py \
        --out /path/to/FlexiTac.github.io/doc/assets/data/isaac-aloha \
        --rgb_src /doc/assets/data/isaac-aloha-rgb.webp --episode_idx 3

It replays one demonstration of the bundled plug-socket data (Isaacsim_tactile_env/data) on the ALOHA robot with the
UMI gripper and its four FlexiTac pads, the way reply_with_tactile.py does. It records `--hz` times per second of
simulated time (physics runs at 120 Hz):
  - the camera's RGB image, rendered by Isaac Sim's RTX renderer, for the viewer's inset;
  - camera points: the same camera's depth image (distance to the image plane), turned into world points, cropped to
    VT-Refine's workspace box with its floor just above the table top, and down-sampled by farthest-point sampling;
  - tactile points: each pad's 12 x 32 taxels in the world frame with their normalized readings, straight from the
    WarpSdf tactile sensors, re-ordered column by column like VT-Refine's data;
  - the 16 joint positions, scaled to -1..1 with the dataset's normalizer (VT-Refine's convention).
Writes <out>.bin and <out>.json in pcv.js's layout, and <out>-rgb.webp: one picture per frame, 10 per row.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import torch
from isaaclab.app import AppLauncher

p = argparse.ArgumentParser()
p.add_argument("--out", required=True, help="output prefix")
p.add_argument("--repo", default=".", help="the FlexiTac-IsaacSim-Simulation checkout")
p.add_argument("--dataset_npz", default="Isaacsim_tactile_env/data/dataset_train.npz")
p.add_argument("--normalization_pth", default="Isaacsim_tactile_env/data/dataset_normalizer.npz")
p.add_argument("--episode_idx", type=int, default=3)
p.add_argument("--steps_per_frame", type=int, default=3)
p.add_argument("--hz", type=float, default=30.0, help="frames recorded per second of simulated time")
p.add_argument("--normal_offset", type=float, default=None, help="taxel plane from the pad's mid-plane [m] (env default)")
p.add_argument("--max_frames", type=int, default=0, help="stop after this many recorded frames (0: whole episode)")
p.add_argument("--points", type=int, default=1024, help="camera points kept per frame (VT-Refine keeps 512)")
p.add_argument("--eye", default="-0.40,0.0,0.33", help="camera position: beside the table, on VT-Refine's side "
               "(its camera is at -0.385,-0.023,0.408)")
p.add_argument("--target", default="0.0,0.0,0.10", help="where the camera looks")
p.add_argument("--focal", type=float, default=24.0, help="focal length [mm] (20.955 mm horizontal aperture)")
p.add_argument("--size", default="640x480", help="camera image size")
p.add_argument("--crop", default="-0.2,0.2,-0.12,0.12,0.2", help="x, y bounds and z top of the kept box (VT-Refine's)")
p.add_argument("--above_table", type=float, default=0.006, help="floor of the kept box above the table top [m]")
p.add_argument("--rgb", default="256x192", help="size of each picture in the atlas")
p.add_argument("--rgb_src", default=None, help="URL of the atlas as the docs page loads it")
AppLauncher.add_app_launcher_args(p)
args = p.parse_args()
args.enable_cameras = True                                  # the env's camera renders with RTX
app = AppLauncher(args).app

REPO = Path(args.repo).resolve()
sys.path.insert(0, str(REPO / "Isaacsim_tactile_env"))
from PIL import Image  # noqa: E402

from aloha_tactile_cfg import AlohaTactileEnvCfg  # noqa: E402
from aloha_tactile_env import AlohaTactileEnv, _torch  # noqa: E402

ROWS, COLS = 12, 32
EYE = np.array([float(v) for v in args.eye.split(",")])
TARGET = np.array([float(v) for v in args.target.split(",")])
X0, X1, Y0, Y1, ZTOP = (float(v) for v in args.crop.split(","))
W, H = (int(v) for v in args.size.split("x"))
RW, RH = (int(v) for v in args.rgb.split("x"))


def load_episode(key):
    """One episode of `key`, de-normalized as reply_with_tactile.py does; also the normalizer's min and max."""
    data = np.load(REPO / args.dataset_npz, allow_pickle=False)
    lengths = np.asarray(data["traj_lengths"], dtype=np.int64)
    s = int(np.concatenate(([0], np.cumsum(lengths)[:-1]))[args.episode_idx])
    ep = data[key].astype(np.float32)[s:s + int(lengths[args.episode_idx])]
    stats = torch.load(REPO / args.normalization_pth, map_location="cpu")
    lo = stats[f"stats.{key}.min"].cpu().numpy().astype(np.float32)
    hi = stats[f"stats.{key}.max"].cpu().numpy().astype(np.float32)
    return (ep + 1.0) * 0.5 * (hi - lo) + lo, lo, hi


def fps(pts, n):
    """Farthest-point sampling (3D-ViTac's down-sampling)."""
    if len(pts) <= n:
        return pts
    idx = np.zeros(n, dtype=np.int64)
    dist = np.full(len(pts), np.inf)
    for i in range(1, n):
        dist = np.minimum(dist, ((pts - pts[idx[i - 1]]) ** 2).sum(1))
        idx[i] = int(dist.argmax())
    return pts[idx]


def main():
    traj, j_lo, j_hi = load_episode("joint_states")
    print(f"[sample] episode {args.episode_idx}: {len(traj)} frames", flush=True)
    cfg = AlohaTactileEnvCfg(
        headless=True, device=str(getattr(args, "device", None) or "cuda:0"), enable_camera=True,
        camera_data_types=("rgb", "distance_to_image_plane"), camera_width=W, camera_height=H,
        camera_eye=tuple(EYE), camera_target=tuple(TARGET), camera_focal_length=args.focal,
        **({"normal_offset": args.normal_offset} if args.normal_offset is not None else {}),
    )
    env = AlohaTactileEnv(cfg, simulation_app=app)
    obs, _ = env.reset()

    # camera model: intrinsics from the sensor, pose from the look-at (Isaac Lab's "world" convention:
    # x forward, z up), so a pixel (u, v) at depth d sits at EYE + d * (fwd + right * u' - up * v')
    K = _torch(env._camera.data.intrinsic_matrices)[0].detach().cpu().numpy()
    fx, fy, cx, cy = K[0, 0], K[1, 1], K[0, 2], K[1, 2]
    fwd = (TARGET - EYE) / np.linalg.norm(TARGET - EYE)
    right = np.cross(fwd, [0.0, 0.0, 1.0])
    right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    uu, vv = np.meshgrid((np.arange(W) + 0.5 - cx) / fx, (np.arange(H) + 0.5 - cy) / fy)
    rays = fwd[None, None] + uu[..., None] * right - vv[..., None] * up          # (H, W, 3), unit length along fwd

    # floor of the kept box: just above the table top (the table body is a 1 cm slab)
    robot = env._robot
    table_z = float(_torch(robot.data.body_link_pos_w)[0, robot.body_names.index("table"), 2]) + 0.005
    z_floor = table_z + args.above_table
    print(f"[sample] table top z={table_z:.4f}, cloud floor z={z_floor:.4f}, fovy="
          f"{math.degrees(2 * math.atan(H / 2 / fy)):.1f} deg", flush=True)

    spf = max(1, args.steps_per_frame)
    every = max(1, round(1.0 / (cfg.physics_dt * args.hz)))   # physics steps between recorded frames
    hz = 1.0 / (cfg.physics_dt * every)
    frames = []
    for step in range(len(traj) * spf):
        k = min(step // spf, len(traj) - 1)
        action = traj[k].copy()
        action[14] -= 0.005                                # as reply_with_tactile.py
        action[15] += 0.005
        obs, *_ = env.step(action)
        if (step + 1) % every:
            continue
        d = obs["depth"]
        ok = np.isfinite(d) & (d > 0.02) & (d < 2.0)
        pc = EYE + rays[ok] * d[ok][:, None]
        keep = ((pc[:, 0] >= X0) & (pc[:, 0] <= X1) & (pc[:, 1] >= Y0) & (pc[:, 1] <= Y1)
                & (pc[:, 2] >= z_floor) & (pc[:, 2] <= ZTOP))
        pc = pc[keep]
        if len(pc) > 30000:
            pc = pc[np.linspace(0, len(pc) - 1, 30000).astype(np.int64)]
        pc = fps(pc, args.points)
        tac = np.zeros((4, ROWS * COLS, 4), dtype=np.float32)
        for i, sensor in enumerate(env._tactile_sensors):
            t = sensor.data.tactile_points_w[0].detach().cpu().numpy().reshape(ROWS, COLS, 4)
            tac[env._sensor_slot_order[i]] = t.transpose(1, 0, 2).reshape(ROWS * COLS, 4)
        tac = tac.reshape(-1, 4)
        # check: pressed taxels should sit on the fingers the camera sees (a few mm away)
        pressed = tac[tac[:, 3] > 0.02, :3]
        gap = float(np.median(np.min(np.linalg.norm(pressed[:, None] - pc[None], axis=-1), axis=1))) if len(pressed) else -1
        rgb = Image.fromarray(obs["rgb"]).resize((RW, RH), Image.LANCZOS)
        frames.append({"cam": pc, "tac": tac, "q": obs["joint_pos"].copy(), "rgb": rgb})
        print(f"[sample] frame {len(frames) - 1} (dataset frame {k}): {len(pc)} camera points, {len(pressed)} taxels pressed, "
              f"median gap to camera points {gap * 1000:.1f} mm", flush=True)
        if args.max_frames and len(frames) >= args.max_frames:
            break

    # ---- pack for pcv.js ------------------------------------------------------------------------------------
    F = len(frames)
    n_pc = min(len(fr["cam"]) for fr in frames)
    allp = np.concatenate([np.concatenate([fr["cam"][:n_pc], fr["tac"][:, :3]]) for fr in frames])
    origin, unit = allp.min(0), 0.0005
    assert (allp.max(0) - origin).max() / unit < 65535

    def q16(x):
        return np.clip(np.round((x - origin) / unit), 0, 65535).astype("<u2")

    out = bytearray()
    for fr in frames:
        out += q16(fr["cam"][:n_pc]).tobytes()
    for fr in frames:
        out += q16(fr["tac"][:, :3]).tobytes()
    for fr in frames:
        out += np.clip(np.round(fr["tac"][:, 3] * 255), 0, 255).astype(np.uint8).tobytes()
    while len(out) % 4:
        out += b"\0"
    q = np.array([fr["q"] for fr in frames], dtype=np.float32)
    span = np.where(j_hi - j_lo > 1e-6, j_hi - j_lo, 1.0)
    out += np.clip((q - j_lo) / span * 2 - 1, -1, 1).astype("<f4").tobytes()
    Path(args.out + ".bin").write_bytes(bytes(out))

    cols = 10
    sheet = Image.new("RGB", (cols * RW, math.ceil(F / cols) * RH))
    for i, fr in enumerate(frames):
        sheet.paste(fr["rgb"], ((i % cols) * RW, (i // cols) * RH))
    sheet.save(args.out + "-rgb.webp", quality=80, method=6)

    meta = {
        "source": f"FlexiTac-IsaacSim-Simulation (Isaac Sim 6.2, Isaac Lab 3.0): ALOHA with the UMI gripper, "
                  f"plug-socket episode {args.episode_idx} of {Path(args.dataset_npz).name}, WarpSdf tactile sensors, "
                  "RTX camera (RGB and depth)",
        "frames": F, "nPc": int(n_pc), "nTac": 4 * ROWS * COLS, "joints": 16, "rows": ROWS, "cols": COLS,
        "unit": unit, "origin": [round(float(v), 6) for v in origin], "hz": round(hz, 3),
        "normalOffset": cfg.normal_offset,
        "camera": {"pos": EYE.tolist(), "target": TARGET.tolist(), "fovy": round(math.degrees(2 * math.atan(H / 2 / fy)), 3)},
        "rgb": {"src": args.rgb_src or Path(args.out + "-rgb.webp").name, "cols": cols, "w": RW, "h": RH},
        "layout": "uint16 camera points [frames][nPc][3], uint16 tactile points [frames][nTac][3] "
                  "(origin + value * unit, metres), uint8 readings [frames][nTac], pad to 4, "
                  "float32 joints [frames][16] scaled to -1..1 by the dataset normalizer",
    }
    Path(args.out + ".json").write_text(json.dumps(meta, indent=1) + "\n")
    print(f"[sample] wrote {args.out}.bin/.json/-rgb.webp: {F} frames, {n_pc} camera points", flush=True)
    env.close()
    app.close()


if __name__ == "__main__":
    main()
