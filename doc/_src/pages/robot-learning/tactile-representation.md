---
title: Tactile representation
status: pending
description: 2D heatmaps, 3D tactile points and multimodal observations.
---

:::note[Coming soon]
We're writing a full guide to this topic. Until then, here is where the 3D representation comes from.
:::

## Background {#today}

### 3D-ViTac: the visuo-tactile point cloud {#3d-vitac}

[3D-ViTac](https://binghao-huang.github.io/3D-ViTac/) (CoRL 2024) is where this line of work started. It introduced the sensor now called FlexiTac-V1 and the *visuo-tactile point cloud*, which places each taxel in 3D next to the camera points and feeds both to one policy. For now its [training-code repository](https://github.com/binghao-huang/3d-vitac-training-code) only points to the pre-training stage of [VT-Refine](/doc/simulation/#vt-refine). The authors say that stage uses the same setup but runs in simulation, on VT-Refine's plug–socket data rather than 3D-ViTac's own tasks. 3D-ViTac's data and real-robot code have not been released yet.

For more work built on FlexiTac, see [Awesome FlexiTac](https://binghao-huang.github.io/Awesome-FlexiTac/).
