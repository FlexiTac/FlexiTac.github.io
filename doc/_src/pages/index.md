---
title: Build with FlexiTac
sidebar_label: Introduction
layout: splash
description: An open-source platform for tactile robotics, from flexible sensor design to robot learning.
---

<p class="hero-sub">Build your first sensor, customize it for your robot, and bring touch into your learning pipeline.</p>
<p class="actions"><a class="btn primary" href="/doc/get-started/">Quickstart<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><a class="btn" href="/">Explore FlexiTac</a></p>

:::cards[flow]
#### Design | /flexitac-gen/ | grid
<img class="flow-card-img tall" src="/doc/assets/img/flexitac-xarm.webp" alt="Render of FlexiTac sensors on both soft fingers of an xArm gripper, with one finger's sensor layers peeled apart" width="423" height="720">
<p class="flow-card-title">FlexiTac on xArm</p>
<p>Design a sensor that fits your own robot.</p>
<p class="flow-card-act"><a class="btn primary" href="/flexitac-gen/">Open FlexiTac-Gen<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></p>
#### Build | /doc/get-started/ | layers
<img class="flow-card-img" src="/doc/assets/img/flexitac-exploded-card.webp" alt="Exploded view of a FlexiTac-V2 sensor: two laminating sheets, the top FPC, the black Velostat film and the bottom FPC" width="720" height="567">
<p class="flow-card-title">Build a sensor</p>
<p>Two flexible PCBs around a pressure-sensitive film. Under 3 minutes and about $4 in materials.</p>
<p class="flow-card-act"><a class="btn primary" href="/doc/get-started/">Start building<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></p>
#### Integrate | /doc/robot-learning/data-collection/ | robot
<div class="flow-card-pair photos"><figure><img src="/static/images/lerobot.jpg" alt="A FlexiTac sensor on the moving jaw of an SO-101 arm" width="635" height="635" loading="lazy"><figcaption>Teleoperation</figcaption></figure><figure><img src="/static/images/umi.jpg" alt="The Touch in the Wild handheld gripper with a FlexiTac sensor on each soft finger" width="897" height="900" loading="lazy"><figcaption>UMI data</figcaption></figure></div>
<p class="flow-card-title">Mount it and collect data</p>
<p>Teleoperate a robot with LeFlexiTac, or collect UMI data by hand with Touch in the Wild.</p>
<p class="flow-card-act"><a class="btn primary" href="/doc/robot-learning/data-collection/">Data collection<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></p>
#### Learn | /doc/robot-learning/imitation-learning/ | net
<p class="flow-card-title">Learn with touch</p>
<p>Collect tactile data and train policies, on real robots or in simulation.</p>
<ul class="flow-card-tags"><li><a href="/doc/robot-learning/data-collection/">Data collection</a></li><li><a href="/doc/robot-learning/tactile-representation/">Representation</a></li><li><a href="/doc/robot-learning/imitation-learning/">Imitation learning</a></li><li><a href="/doc/robot-learning/vla/">VLA</a></li><li><a href="/doc/robot-learning/reinforcement-learning/">Reinforcement learning</a></li><li><a href="/doc/robot-learning/pretraining/">Pretraining</a></li><li><a href="/doc/robot-learning/world-models/">World models</a></li></ul>
<p class="flow-card-act"><a class="btn primary" href="/doc/robot-learning/imitation-learning/">Start learning<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></p>
:::

<figure class="figure viewer3d" data-viewer3d data-src="/doc/assets/3d/flexitac-umi.glb" data-env="/doc/assets/3d/studio.hdr" data-shadow="0" data-orbit="334deg 70deg 0.40m" data-target="-0.008m 0.048m 0.013m" data-fov="13.6deg">
<div class="v3d-stage">
<img class="v3d-poster" src="/doc/assets/img/flexitac-umi-sandwich.webp" alt="Render of a FlexiTac sensor on the orange UMI soft fin-ray finger. The outer FPC and the black Velostat film peel back from the inner FPC; both FPC tails run out flat to the side, and the clear laminating sheets peel away with the stack." width="1600" height="900">
<button class="v3d-start" type="button" data-v3d-start><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>Rotate in 3D</button>
</div>
<div class="v3d-bar" hidden>
<label class="v3d-peel"><span>Assembled</span><input type="range" min="0" max="1" step="0.01" value="1" aria-label="Peel the layers apart" data-v3d-peel><span>Peeled</span></label>
<button class="v3d-reset" type="button" data-v3d-reset>Reset view</button>
</div>
<figcaption>A FlexiTac sensor on a UMI soft finger, peeled apart.</figcaption>
</figure>


:::cards
#### Hardware | /doc/get-started/fabricate/ | cpu
Fabricate and assemble your sensor.

#### Customization | /flexitac-gen/ | sliders
Design sensors for your robot.

#### Robot learning | /doc/robot-learning/data-collection/ | net
Collect data and train with touch.

#### Simulation | /doc/simulation/ | cube
Model tactile contact in simulation.
:::

<p class="more">Every repository, design file, paper and dataset: <a href="/doc/resources/">All resources →</a></p>

<hr>

<div class="section-head"><h2 id="community">Built by the community</h2><a href="https://binghao-huang.github.io/Awesome-FlexiTac/" target="_blank" rel="noopener">Explore &amp; contribute <span aria-hidden="true">→</span></a></div>

:::timeline
:::

:::community
<!-- Approved robots from "Share your robot" issues, oldest first. Each is a heading line
     "#### Robot name | https://project.link | /doc/assets/community/robot-name.webp" with a credit line under it.
     See "Feature a community robot" in doc/_src/README.md. -->
:::

<div class="share">
<a class="share-slot" href="https://github.com/FlexiTac/FlexiTac.github.io/issues/new?template=share-your-robot.yml" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg><b>Your robot</b><span>could be next</span></a>
<div class="share-copy">
<h2 id="share">Share your robot</h2>
<p>Built FlexiTac into your own gripper, hand or robot? Send it in. We review every submission, then feature it here with credit.</p>
<ol class="share-steps"><li>Submit</li><li>We review</li><li>Featured here</li></ol>
<p class="actions"><a class="btn primary" href="https://github.com/FlexiTac/FlexiTac.github.io/issues/new?template=share-your-robot.yml" target="_blank" rel="noopener">Submit your robot<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><a class="btn" href="https://discord.gg/6gw887Vxms" target="_blank" rel="noopener">Ask on Discord</a></p>
</div>
</div>
