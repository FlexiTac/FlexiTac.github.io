// The studio both 3D drawings of Gen by Surface are lit by: the 3D view of the part (viewer.js) and the sensor on the
// part beside the stacked view (onpart.js).  The look was built for the figure (the user's feedback of 2026-11-05: light
// and shade, not only shadows; without real light the black film read as a hole cut out of the picture, so a surface
// wants a faint frosted reflection; the boards a very weak light; built in the look lab of 2026-11-05) and then given to
// the 3D view as well (the user's of 2026-11-05: "you only added the new light and shade to the last 3D figure; add it
// to every 3D view"), so it moved here from onpart.js as it was: the figure draws the same pixels (the look lab's
// shoot.py, every shot against the code before the move: 0 px apart).  Each drawing keeps its own materials (onpart.js
// its part, film and boards; viewer.js its part, whose facets carry the meaning colours, and its markers, drawn unlit).
//   - the lights (LIGHTS, studioLights): a product render's bright studio hung on the camera (a turn turns the drawing
//     under fixed lights, as on a turntable): a hemisphere (a bright ceiling, a darker, cooler floor that models the
//     part's faces), a large key from the upper left (the stacked view's light: its shadows fall to the lower right), a
//     rim from behind and a sheen lamp, fixed in the camera's frame;
//   - the environment (STUDIO, studio, studioFor): a studio built in code (a grey room, softboxes and rim strips,
//     prefiltered by PMREMGenerator; no image: the CSP allows none) that a material mirrors: reflections only (its
//     diffuse light is the lights'), turned with the camera; none where a device cannot draw it (no half-float render
//     targets) or three.js's shader text has changed: the drawing is then lit by the lights alone;
//   - the tone mapping (toneMap): Khronos PBR Neutral, the colours kept, only highlights rolled off;
//   - the shader patches (lookOf: patched, reflectionsOnly): every change to three.js's shader text goes through
//     patched(), which warns once (each drawing its own warnings: "On the part: ...", "3D view: ...", each cause once)
//     and leaves the shader as three.js wrote it when the text it looks for is gone (a later three.js), so the look
//     falls back to a known state.
// No frame loop, no animation: each drawing renders on demand.  A render target made here (the studio) belongs to its
// renderer's context: a lost context's is dropped, never disposed, and made again when the context comes back (each
// drawing's webglcontextrestored).

import * as THREE from "../vendor/three/three.module.js";

// -- The lights ----------------------------------------------------------------------------------------------------------
// Linear RGB and intensities, directions in the camera's frame (x right, y up, z toward the viewer): toward each light.
// The hemisphere: its ceiling and its floor about the camera's up (the floor darker and a little cool: the part's faces
// turned down or away read as planes, not as the pane's grey); the key, high on the left in front; the rim, behind on
// the right (a thin light edge on the far side, the part's ribs turned from the key).  The sheen lamp: a point light
// without falloff at LIGHTS.lamp.at times the camera's distance (in front of the camera, beyond the sheets, up and to the
// left), where the sheets at the Exploded home mirror it near their top: a soft highlight runs down the film and fades,
// about sRGB 85 at its top to 40-55 at its foot (the studio's softboxes do the rest).  It stays there in the camera's
// frame whatever the mode or the turn (as every light here), so it never jumps on a mode switch or Reset.
export const LIGHTS = {
  sky: [1.75, 1.75, 1.75],
  ground: [0.66, 0.69, 0.75],
  key: {at: [-0.5, 0.65, 0.55], intensity: 1.25},
  rim: {at: [0.65, 0.4, -0.65], intensity: 0.9},
  lamp: {at: [-0.67, 0.56, -1.24], intensity: 0.3},
};
export const TONE_EXPOSURE = 1;

// -- The environment -----------------------------------------------------------------------------------------------------
// The studio the sheets mirror, in the camera's frame as the lights.  The room: a sphere STUDIO.radius round the sensor,
// its radiance (linear) room.zenith overhead, room.horizon level and room.floor below, smooth between; the panels:
// rectangles of their size STUDIO.distance out toward `at`, facing the sensor, of their radiance: a back softbox up and
// to the left beyond the sensor, whose lower edge the film mirrors at the Exploded home (its upper half catches it, its
// lower half fades: a satin sheet's gradient; the boards beside it a faint sweep alike), the key's softbox up and to
// the left in front, whose lower edge the top FPC mirrors at the Assembled home (a soft sweep, lighter at its top), an
// overhead one, a dim fill and two tall rim strips behind either side (what the edges catch at a grazing angle).
// PMREMGenerator blurs them for each roughness (STUDIO.size px a cube face: a soft studio needs no more).
export const STUDIO = {
  room: {zenith: 0.5, horizon: 0.3, floor: 0.08},
  radius: 10,
  distance: 6,
  size: 128,
  panels: [
    {at: [-0.75, 0.6, -0.27], size: [6, 4], radiance: 1.6},   // back softbox
    {at: [-0.49, 0.78, 0.39], size: [6, 4], radiance: 1.2},   // key
    {at: [0.05, 1, 0.1], size: [7, 7], radiance: 0.6},        // overhead
    {at: [0.8, -0.15, 0.6], size: [4, 6], radiance: 0.35},    // fill
    {at: [-0.85, 0.25, -0.5], size: [1.2, 9], radiance: 1.6}, // rim, left
    {at: [0.85, 0.25, -0.5], size: [1.2, 9], radiance: 1.6},  // rim, right
  ],
};

// -- The shader patches --------------------------------------------------------------------------------------------------
// A material mirrors the studio and takes no diffuse light from it: three.js 0.186.1's lights_fragment_maps less its
// getIBLIrradiance line, put in place of that chunk in the material's fragment shader (both found once in the vendored
// three.js: tests/test_surface_web.py reads them there).
const REFLECTIONS_LABEL = "the studio's reflections (reflections only)";
const REFLECTIONS_EDITS = [["iblIrradiance += getIBLIrradiance( geometryNormal );", ""]];

/**
 * One drawing's look helpers (who: its name in its warnings, "On the part" or "3D view"; studied: its studio's User
 * Timing measure; without: what its warnings say is drawn without the studio): its warnings (warnOnce, each cause
 * once), patched() through them, the reflections-only shader text (REFLECTIONS_ONLY, null when three.js's text has
 * changed: a warning, once) and whether its anchor is in the standard material's fragment shader (reflections), the
 * fragment shader with it put in (reflectionsOnly), and its studio (studioFor).  Made once, as the drawing's module
 * loads.
 */
export function lookOf(who, {studied, without}) {
  const warned = new Set();
  function warnOnce(key, message) {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`${who}: ${message}`);
  }

  function patched(text, edits, label) {
    // three.js's shader text with each [find, replacement] of edits made, or null (and a warning, once) when one of them
    // is not found (a later three.js worded it otherwise): the caller then leaves that shader as three.js wrote it.
    let out = text;
    for (const [find, replacement] of edits) {
      if (!out.includes(find)) {
        warnOnce(label, `three.js's shader text "${find}" was not found: ${label} left out.`);
        return null;
      }
      out = out.replace(find, replacement);
    }
    return out;
  }

  // Whether the patch finds its text in this three.js (the standard and the physical materials' fragment shader is the
  // same, meshphysical_frag), checked once.
  const REFLECTIONS_ONLY = patched(THREE.ShaderChunk.lights_fragment_maps, REFLECTIONS_EDITS, REFLECTIONS_LABEL);
  const reflections = REFLECTIONS_ONLY !== null && patched(THREE.ShaderLib.physical.fragmentShader, [["#include <lights_fragment_maps>", ""]],
    REFLECTIONS_LABEL) !== null;

  function reflectionsOnly(fragment) {
    // A material's fragment shader mirroring the studio without its diffuse light (as three.js wrote it without the patch).
    if (!reflections) return fragment;
    return patched(fragment, [["#include <lights_fragment_maps>", REFLECTIONS_ONLY]], REFLECTIONS_LABEL) ?? fragment;
  }

  function studioFor(renderer) {
    // The studio, or null where it cannot be had: three.js's shader text changed (reflections), the device draws no
    // half-float render target (PMREMGenerator's), or making it failed.  Null leaves the drawing lit by the lights alone
    // (its diffuse light is the lights' in any case): the look degrades, nothing goes black.
    if (!reflections) return null;
    const extensions = renderer.extensions;
    if (!(extensions.has("EXT_color_buffer_float") || extensions.has("EXT_color_buffer_half_float"))) {
      warnOnce("studio", `this device draws no half-float render target: ${without} without the studio's reflections.`);
      return null;
    }
    const started = performance.now();
    let target = null;
    try {
      target = studio(renderer);
    } catch (error) {
      warnOnce("studio", `the studio's reflections could not be made (${error?.message || error}): ${without} without them.`);
      return null;
    }
    measure(studied, started);
    return target;
  }

  return {warnOnce, patched, REFLECTIONS_ONLY, reflections, reflectionsOnly, studioFor};
}

// -- The lights, the studio and the tone mapping ---------------------------------------------------------------------------

export function studioLights(scene, camera) {
  // The drawing's lights (LIGHTS): the directional ones and the lamp hung on the camera (each directional light's
  // target too, so its direction is the camera frame's), the camera in the scene so they are drawn; the hemisphere in
  // the scene, its up turned with the camera at each render (three.js takes a hemisphere's direction from its position).
  // place(distance): the lamp at its place for the camera's distance to its target; turn(): the hemisphere's up the
  // camera's, before each render.
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  hemisphere.color.setRGB(...LIGHTS.sky);
  hemisphere.groundColor.setRGB(...LIGHTS.ground);
  scene.add(hemisphere);
  for (const {at, intensity} of [LIGHTS.key, LIGHTS.rim]) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(...at).normalize();
    camera.add(light, light.target);
  }
  const lamp = new THREE.PointLight(0xffffff, LIGHTS.lamp.intensity, 0, 0);
  camera.add(lamp);
  scene.add(camera);
  return {
    place(distance) { lamp.position.set(...LIGHTS.lamp.at).multiplyScalar(distance); },
    turn() { hemisphere.position.set(0, 1, 0).applyQuaternion(camera.quaternion); },
  };
}

function studio(renderer) {
  // The studio's environment (STUDIO): a small scene of its own, rendered once to a cube and prefiltered for every
  // roughness by PMREMGenerator (a render target: made again when a lost context comes back).
  const room = new THREE.Scene();
  const sphere = new THREE.SphereGeometry(STUDIO.radius, 32, 16);
  const position = sphere.attributes.position;
  const colors = new Float32Array(3 * position.count);
  const {zenith, horizon, floor} = STUDIO.room;
  for (let k = 0; k < position.count; k += 1) {
    const y = position.getY(k) / STUDIO.radius;
    colors.fill(y >= 0 ? horizon + (zenith - horizon) * Math.sqrt(y) : horizon + (floor - horizon) * Math.sqrt(-y), 3 * k, 3 * k + 3);
  }
  sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  room.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
  for (const panel of STUDIO.panels) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...panel.size),
      new THREE.MeshBasicMaterial({color: new THREE.Color().setScalar(panel.radiance), side: THREE.DoubleSide}));
    mesh.position.set(...panel.at).normalize().multiplyScalar(STUDIO.distance);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  try {
    return pmrem.fromScene(room, 0.02, 0.1, 2 * STUDIO.radius, {size: STUDIO.size});
  } finally {
    pmrem.dispose();
    room.traverse(node => { node.geometry?.dispose(); node.material?.dispose(); });
  }
}

export function measure(name, started) {
  // A User Timing measure since ``started`` (the checks' and the cost's reads), which never fails what it measures: a
  // browser without User Timing Level 3's options throws here (the review of 2026-11-05: inside studioFor's try it had
  // thrown away a studio made).
  try {
    performance.measure?.(name, {start: started});
  } catch {
    // No measure; nothing else lost.
  }
}

export function toneMap(renderer) {
  // Khronos PBR Neutral at TONE_EXPOSURE: the colours below its knee kept (less a small offset in the darks), only the
  // highlights rolled off (a material with toneMapped false, a marker drawn in its own colour, goes past it).
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = TONE_EXPOSURE;
}
