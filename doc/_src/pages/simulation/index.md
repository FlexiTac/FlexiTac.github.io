---
title: Tactile simulation
sidebar_label: Isaac Sim & VT-Refine
description: Simulate FlexiTac pads in NVIDIA Isaac Sim, then replay tactile trajectories and record visuo-tactile demonstrations in the browser. Plus VT-Refine, the sim fine-tuning research behind it.
---

The simulation lets you work with touch without any hardware. Simulated pads give the same 12 × 32 taxel grid as a FlexiTac-V2 sensor, on the fingers of a robot in NVIDIA Isaac Sim. The current release is the **FlexiTac tactile simulation in Isaac Sim**, which this page shows you how to build and run. It uses the same bimanual plug–socket setup and the same pad layout as **VT-Refine**, the research on fine-tuning visuo-tactile policies in simulation, whose own code runs on the older Isaac Gym.

| | Isaac Sim simulation (current release) | VT-Refine (research code) |
| --- | --- | --- |
| **Simulator** | Isaac Sim 6.2 with Isaac Lab 3.0 | Isaac Gym Preview (TacSL build), in Docker |
| **Robot and task** | Bimanual ALOHA robot, plug–socket insertion | ALOHA-style tabletop arms and a two-arm Kinova robot, plug–socket insertion |
| **Simulated pads** | 12 × 32 taxels at 2 mm on all four fingers | 12 × 32 at 2 mm on the ALOHA setup |
| **What you do with it** | Replay trajectories with live tactile heatmaps; teleoperate in the browser and record demonstrations | Pre-train a visuo-tactile policy, then fine-tune it with reinforcement learning |
| **Code** | [FlexiTac-IsaacSim-Simulation](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation) | [NVlabs/vt-refine](https://github.com/NVlabs/vt-refine) |

## Build the Isaac Sim simulation {#isaac-sim}

The repository is an Isaac Lab tree with two additions: a tactile sensor for FlexiTac pads, and an ALOHA environment whose four fingers each carry a simulated pad.

**You need:** a Linux x86_64 computer (Ubuntu 22.04 or newer) with an NVIDIA RTX GPU and a driver of version 580.65 or newer, plus git and [uv](https://docs.astral.sh/uv/). Isaac Sim, PyTorch and Isaac Lab take about 30 GB. The trajectory viewer opens a desktop window; the browser interface can run headless. No FlexiTac hardware is needed.

:::steps
#### Clone the repository

```bash
git clone https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation.git
cd FlexiTac-IsaacSim-Simulation
```

#### Create a Python 3.12 environment

```bash title="FlexiTac-IsaacSim-Simulation/"
uv venv --python 3.12 --seed env_isaaclab
source env_isaaclab/bin/activate
```

#### Install Isaac Sim 6.2 and PyTorch
The CUDA 13 build of PyTorch is the one Isaac Lab 3.0 pins:

```bash title="FlexiTac-IsaacSim-Simulation/"
uv pip install "isaacsim[all,extscache]==6.2.0" --extra-index-url https://pypi.nvidia.com --index-strategy unsafe-best-match
uv pip install -U torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cu130
```

The first launch asks you to accept the NVIDIA Omniverse EULA; `export OMNI_KIT_ACCEPT_EULA=YES` accepts it ahead of time.

#### Install Isaac Lab and the viewer dependencies
`core` installs Isaac Lab's packages, including the FlexiTac sensor, and `visualizer[kit]` the Isaac Sim window:

```bash title="FlexiTac-IsaacSim-Simulation/"
sudo apt install cmake build-essential
./isaaclab.sh -i core
./isaaclab.sh -i 'visualizer[kit]'
uv pip install viser opencv-python
```
:::

These steps follow the repository's [installation guide](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation#%EF%B8%8F-installation) as of November 2026. If the two differ, the README is the source of truth. For Isaac Sim 5.1 and Isaac Lab 2.3, use the repository's [`isaacsim-5.1` branch](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation/tree/isaacsim-5.1) and its README.

## Replay a trajectory with touch {#replay}

Replay an episode from the bundled sample dataset. The ALOHA robot repeats the recorded motion, and a separate window shows the four finger pads as live tactile heatmaps.

```bash title="FlexiTac-IsaacSim-Simulation/"
./isaaclab.sh -p Isaacsim_tactile_env/reply_with_tactile.py \
    --dataset_npz Isaacsim_tactile_env/data/dataset_train.npz \
    --normalization_pth Isaacsim_tactile_env/data/dataset_normalizer.npz \
    --episode_idx 3 \
    --replay_key joint_states \
    --steps_per_frame 3
```

The script really is named `reply_with_tactile.py`. Change `--episode_idx` to replay another episode, and add `--headless` to run without the Isaac Sim window.

## Teleoperate and record in the browser {#web}

Start the web interface, then open **http://localhost:8080**:

```bash title="FlexiTac-IsaacSim-Simulation/"
./isaaclab.sh -p Isaacsim_tactile_env/viser_interface.py \
    --headless \
    --enable_cameras
```

Drag the handle on each end effector to move the two arms, and open or close each gripper with its buttons. The page shows the four tactile heatmaps, the simulated camera and the robot state as you work. **Reset** puts the plug and socket back at the start with a slightly randomized wrist orientation.

**Start Recording** and **Stop Recording** save each demonstration as one `.npz` file in `Isaacsim_tactile_env/output/trajectories/`. Each file holds:

| Key | Shape | What it is |
| --- | --- | --- |
| `tactile` | (T, 4, 12, 32) | The four pads, in the order left arm left finger, left arm right finger, right arm left finger, right arm right finger |
| `joint_pos`, `joint_vel` | (T, 16) | Joint positions and velocities of both arms |
| `actions` | (T, 16) | Per arm: target position (3), quaternion (4), gripper (1) |
| `plug_pose`, `socket_pose` | (T, 7) | Object position and wxyz quaternion |
| `rgb` | (T, 480, 640, 3) | Camera images |

## How the simulated pad works {#sensor-model}

Each finger has a pad with a 12 × 32 grid of taxels at 2 mm pitch, the same layout as a FlexiTac-V2 sensor. On every step, [NVIDIA Warp](https://github.com/NVIDIA/warp) measures how far each taxel has pushed into the object's mesh. That depth becomes a spring force, `clamp(stiffness × depth, 0, max_force)`, which is then divided by `max_force` so each reading lies between 0 and 1. The taxels sit 1.4 mm in front of the pad's face, so a reading starts just before the object touches it; lower `normal_offset` (or pass `--normal_offset` to either script) for smaller contact patches. The grid size, spacing, `normal_offset` (0.0029 m from the pad's mid-plane), `stiffness` (5000) and `max_force` (10) are settings in [`AlohaTactileEnvCfg`](https://github.com/binghao-huang/FlexiTac-IsaacSim-Simulation/blob/5fbca10482e1139daead8285d71d166247ec8d27/Isaacsim_tactile_env/aloha_tactile_cfg.py#L53-L64).

:::caution[What it does not model yet]
- The pads on the left arm sense only the socket, and the pads on the right arm only the plug. Touching anything else, such as the table, gives no signal.
- Readings are normalized from 0 to 1, not calibrated to a real sensor's output.
- The environment is built around the ALOHA robot. Using another gripper or pad layout means changing the code; there is no guide for that yet.
:::

## VT-Refine {#vt-refine}

[VT-Refine](https://binghao-huang.github.io/vt_refine/) (CoRL 2025) trains bimanual assembly policies in three stages, from real to sim and back to real. It first trains a diffusion policy on about 30 real demonstrations per task. Each demonstration records FlexiTac pads on all four fingers together with a camera point cloud, the representation from [3D-ViTac](/doc/robot-learning/tactile-representation/#3d). Next it fine-tunes that policy in a simulated copy of the setup with large-scale, GPU-parallel reinforcement learning. Finally it moves the policy back to the real robot. The tasks are plug–socket insertions done in mid-air.

The repository has the simulation and training side: a Docker environment, the simulated environments with their tactile model, training configs, and a script that downloads about 909 MB of pre-training data. It does not include trained checkpoints or code for collecting data or running on a real robot.

:::steps
#### Install with Docker
Clone with submodules and build the image, which installs the TacSL build of Isaac Gym. [README: Installation](https://github.com/NVlabs/vt-refine#installation)

#### Pre-train the visuo-tactile policy
Download the data and train the diffusion policy. [README: Pre-training](https://github.com/NVlabs/vt-refine#pre-training)

#### Fine-tune in simulation
Evaluate the pre-trained policy in simulation, then fine-tune it with reinforcement learning. [README: Evaluation](https://github.com/NVlabs/vt-refine#evaluation---pre-training) · [Fine-tuning](https://github.com/NVlabs/vt-refine#fine-tuning)
:::

:::note[License and simulator]
The VT-Refine repository is under the NVIDIA License (non-commercial research and evaluation only), and its pre-training data under CC BY-NC 4.0. The submodules it pulls in, with the simulated environments, the tactile model and the training code, are MIT-licensed. It runs on Isaac Gym, which NVIDIA no longer develops. For new work, start from the [Isaac Sim simulation](#isaac-sim) above.
:::
