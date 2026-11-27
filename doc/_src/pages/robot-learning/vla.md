---
title: VLA with touch
sidebar_label: VLA
status: pending
description: Integrating touch into VLA models.
---

:::note[Coming soon]
We're writing a full guide to this topic. Until then, LeFlexiTac's training code covers two VLA models today.
:::

## Available today {#today}

### LeFlexiTac: Pi0.5 and SmolVLA {#leflexitac}

Besides ACT and Diffusion Policy, LeFlexiTac trains **Pi0.5** and **SmolVLA** on the LeRobot datasets you [record with it](/doc/robot-learning/data-collection/#teleoperation), with or without touch (`--policy.use_tactile=true` / `false`). Fine-tuning Pi0.5 needs a GPU with at least 80 GB of memory. See steps 09–10 of the [LeFlexiTac docs](https://tna001-ai.github.io/LeFlexiTac/docs.html#reproduction) and its [results](https://tna001-ai.github.io/LeFlexiTac/).
