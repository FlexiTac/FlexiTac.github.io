---
title: Learning with FlexiTac
sidebar_label: Overview
description: From tactile observations to contact-aware robot policies.
---

<script>(function(){var m={"#leflexitac":"/doc/robot-learning/data-collection/#teleoperation","#touch-in-the-wild":"/doc/robot-learning/data-collection/#umi","#mount":"/doc/robot-learning/data-collection/#tips","#research":"/doc/robot-learning/tactile-representation/#3d"},t=m[location.hash];if(t)location.replace(t);})();</script>

These pages take you from a working sensor to a policy that uses touch. Each topic starts from open code that already runs with FlexiTac. You need a sensor whose heatmap follows your finger, as at the end of the [Quickstart](/doc/get-started/).

<div class="lpanel">
<h2 id="map">Data sources</h2>
<div class="lp-row3">
<a href="/doc/robot-learning/data-collection/#teleoperation"><b>Teleoperation</b><span>LeFlexiTac</span></a>
<a href="/doc/robot-learning/data-collection/#umi"><b>Handheld UMI</b><span>Touch in the Wild</span></a>
<a href="/doc/simulation/"><b>Simulation</b><span>Isaac Sim</span></a>
</div>
<p class="lp-down" aria-hidden="true">↓</p>
<div class="lp-rep">
<a class="lp-rep-h" href="/doc/robot-learning/tactile-representation/">Tactile representation</a>
<p><a href="/doc/robot-learning/tactile-representation/#2d">2D tactile maps</a> · <a href="/doc/robot-learning/tactile-representation/#3d">3D tactile points</a> · <a href="/doc/robot-learning/tactile-representation/#2d">Multimodal features</a></p>
</div>
<p class="lp-down" aria-hidden="true">↓</p>
<div class="lp-grid2">
<a href="/doc/robot-learning/imitation-learning/"><b>Imitation learning</b><span>ACT · Diffusion Policy</span></a>
<a href="/doc/robot-learning/vla/"><b>VLA</b><span>Pi0.5 · SmolVLA</span></a>
<a href="/doc/simulation/#vt-refine"><b>Reinforcement learning</b><span>VT-Refine</span></a>
<a href="/doc/robot-learning/pretraining/"><b>Pretraining</b><span>Visuo-tactile MAE</span></a>
</div>
<hr>
<h2 id="workflows">Choose a research workflow</h2>
<ul class="lp-flows">
<li><a href="/doc/robot-learning/data-collection/#teleoperation"><span class="lp-ic"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2v3.3"/><circle cx="12" cy="2.6" r=".9" fill="currentColor" stroke="none"/><rect x="5" y="6.5" width="14" height="10.5" rx="3.2"/><circle cx="9.4" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><circle cx="14.6" cy="11.6" r="1.25" fill="currentColor" stroke="none"/><path d="M2.8 10.2v3.4M21.2 10.2v3.4M9 20.8h6M12 17v3.8"/></svg></span><span><b>Train your first tactile policy</b><span>LeFlexiTac · SO-101 · ACT</span></span></a></li>
<li><a href="/doc/robot-learning/pretraining/#touch-in-the-wild"><span class="lp-ic"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.67h17M3.5 14.33h17M7.75 5v14M12 5v14M16.25 5v14"/></svg></span><span><b>Work with existing tactile datasets</b><span>Touch in the Wild · VT-Refine</span></span></a></li>
<li><a href="/doc/simulation/"><span class="lp-ic"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/></svg></span><span><b>Learn with simulated touch</b><span>Isaac Sim · RL fine-tuning</span></span></a></li>
</ul>
</div>
<p class="lp-note">A concept map: not every data source, representation and learning method combine directly.</p>
