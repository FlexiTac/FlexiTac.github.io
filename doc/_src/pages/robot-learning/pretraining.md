---
title: Pretraining with touch
sidebar_label: Pretraining
status: pending
description: Learning tactile representations from large datasets.
---

:::note[Coming soon]
We're writing a full guide to this topic. Until then, Touch in the Wild's pretrained encoder and its data are available today.
:::

## Available today {#today}

### Touch in the Wild: a visuo-tactile encoder {#touch-in-the-wild}

Touch in the Wild pretrains a visuo-tactile encoder on its handheld demonstrations, then uses it to condition a [Diffusion Policy](/doc/robot-learning/imitation-learning/#touch-in-the-wild). Pretrain it on your own [recordings](/doc/robot-learning/data-collection/#umi) or on the [released dataset](https://huggingface.co/datasets/binghaohuang-robot/touch_in_the_wild-dataset), or start from the [pretrained checkpoint](https://huggingface.co/xinyue-zhu/pretrained_mae). The pretraining set alone is about 88 GB. [README: Pretraining](https://github.com/XinyueZhuXY/touch_in_the_wild#%E2%80%8Dpretraining-the-visuotactile-mae) · [Evaluate a checkpoint](https://github.com/XinyueZhuXY/touch_in_the_wild#evaluate-a-checkpoint)
