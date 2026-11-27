---
title: Imitation learning with touch
sidebar_label: Imitation learning
status: pending
description: ACT and Diffusion Policy.
---

:::note[Coming soon]
We're writing a full guide to this topic. Until then, both [data-collection setups](/doc/robot-learning/data-collection/) come with training code you can use today.
:::

## Available today {#today}

### LeFlexiTac: ACT and Diffusion Policy {#leflexitac}

LeFlexiTac trains policies on the LeRobot datasets you [record with it](/doc/robot-learning/data-collection/#teleoperation). Touch is an extra input, switched on with `--policy.use_tactile=true`. On tube insertion, peg-in-hole and pen retrieval from a bag, the tactile policies beat their vision-only versions in every reported comparison ([results](https://tna001-ai.github.io/LeFlexiTac/)).

Train with and without touch (`--policy.use_tactile=true` / `false`) on a Linux machine with a CUDA GPU, then roll the checkpoint out on the arm. Train and run a policy at the same frame rate you recorded at. Steps 09–10 of the [LeFlexiTac docs](https://tna001-ai.github.io/LeFlexiTac/docs.html#reproduction) have the training and evaluation commands, and the same page ends with practical tips on calibration, camera placement and frame rates.

### Touch in the Wild: Diffusion Policy {#touch-in-the-wild}

Touch in the Wild trains a Diffusion Policy conditioned on its [pretrained visuo-tactile encoder](/doc/robot-learning/pretraining/#touch-in-the-wild), then runs it on a uFactory xArm 850 with the same fingers and sensors.

**To run policies you need:** a uFactory xArm 850 with the xArm Gripper, the printed finger holder and GoPro mount from the [gripper guide](https://docs.google.com/document/d/1Gxd2PzVo-sH_XbvnVw_r3eI5i3I3t0rr7JdhpN1PJMA/edit?tab=t.0#heading=h.dcjpnwh7wh40), an HDMI capture card for the GoPro feed, and an NVIDIA GPU for training. [README: Training](https://github.com/XinyueZhuXY/touch_in_the_wild#training-diffusionpolicies) · [Real-world deployment](https://github.com/XinyueZhuXY/touch_in_the_wild#realworld-deployment)
