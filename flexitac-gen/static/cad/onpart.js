// The figure of the sensor on the part, the stacked card's right-hand figure in Gen by Surface (the user's request of
// 2026-11-05): the part in a matte light grey (the 3D view's, darkened by PART_LOOK.shade) and, outward from it, the
// bottom FPC, the film (velostat: satin black, over the taxel field) and the top FPC, each draped on the part's surface
// (web/cad/drape.js computes the sheets) and exploded along the sensor's mean normal, or assembled on it; each board
// shows its own art on both its sides (app.js "fpc:board-art", in the page's look): the bottom FPC its copper outward
// and its polyimide toward the part, the top FPC (turned over) its polyimide outward and its copper toward the film.
//
// three.js 0.186.1 as viewer.js, from its part grey (PART_RGB), under the studio both draw with (studio.js);
// main.js loads this module (import("./onpart.js")) once the 3D view has loaded, never in Rectangular mode.  One renderer
// for the page, made once (a WebGL context per build would at last cost the 3D view its own), transparent over the
// pane's light gradient (the pane is a .stacked-canvas lightbox: it stays light in dark mode), drawn on demand only: on a
// turn, a resize, a mode switch or a new drawing, no frame loop and no animation.  A drag turns it (no pan, no zoom: the
// wheel scrolls the page, a vertical swipe too), the arrow keys by KEY_TURN_DEG, a double click, 0 or Reset view bring
// it home (each mode its own: drape.js homeDirection; the Exploded home the left figure's as it opens, the user's
// decision of 2026-11-05), and the camera's up is the stack's normal (drape.js HOME_UP): a drag across turns the stack
// about it, a drag down tilts it toward the view from above, as the left figure's.  The textures follow the page's CSP
// (img-src 'self' data:): each board SVG becomes an image from a data: URL and then a canvas.
//
// The look (the user's feedback of 2026-11-05: light and shade, not only shadows; without real light the black film
// read as a hole cut out of the picture, so its surface wants a faint frosted reflection; the boards a very weak light;
// the whole as the finished sensor; built in the look lab of 2026-11-05 and carried onto this file; its lights, studio,
// tone mapping and warnings in studio.js since the user's request of 2026-11-05, which gave the 3D view the same look).
// It is kept in sections of its own, each a few functions:
//   - the lights (studio.js studioLights): a product render's bright studio hung on the camera (a turn turns the sensor
//     under fixed lights, as on a turntable): a hemisphere (a bright ceiling, a darker, cooler floor that models the
//     part's faces), a large key from the upper left (the left figure's light: its shadows fall to the lower right), a
//     rim from behind and a sheen lamp near the stack, fixed in the camera's frame;
//   - the environment (studio.js studioFor): a studio built in code (a grey room, softboxes and rim strips, prefiltered
//     by PMREMGenerator; no image: the CSP allows none) that the film and the boards mirror: reflections only (their
//     diffuse light is the lights', as the part's), turned with the camera; none where a device cannot draw it (no
//     half-float render targets) or three.js's shader text has changed: the sheets are then lit by the lights alone;
//   - the materials (partMaterial, filmMaterial, boardMaterial, bandMaterial): physically based, Khronos PBR Neutral
//     tone mapping (the art's colours kept, only highlights rolled off): the part a matte light grey, the film a satin
//     black with a frosted sheen at grazing angles and a lamp of its own (filmLit, filmLampAt: since the user's request
//     of 2026-11-05 a soft highlight at its top at the left figure's home; it reads as a sheet catching the light), the
//     boards their art under a satin coverlay whose weak reflection is tinted by the art (the copper seen through the
//     amber polyimide: a soft amber sweep, never a white veil); the sheets' outlines their art's alpha as coverage
//     (coverage, below);
//   - the edges (locator, bandOf, fitBand): each layer an edge band along its outline and cutouts, wound outward and
//     drawn from the front only, BAND.minPx deep on screen at least when exploded, and assembled each band down to the
//     layer under it (the three tile one stack edge that stands on the part);
//   - the contact shade (contactField, withContact): in Assembled, the stack's footprint baked once per drawing into a
//     small texture (a tight line where the stack meets the part and a soft halo round it, only on the part's surface
//     near the stack's underside) that darkens the part's light: no shadow map, nothing per frame.
// Every change to three.js's shader text goes through patched() (studio.js lookOf: this figure's own warnings), which
// warns once and leaves the shader as three.js wrote it when the text it looks for is gone (a later three.js), and the
// look falls back to a known state.

import * as THREE from "../vendor/three/three.module.js";
import {OrbitControls} from "../vendor/three/OrbitControls.js";
import {PART_RGB} from "./viewer.js";
import {lookOf, measure, studioLights, toneMap} from "./studio.js";
import {FOV_DEG, HOME_UP, frameView, homeDirection, texST} from "./drape.js";

// The film's outline is drawn this fine (px per mm) as the alpha of its texture.
const FILM_PX_PER_MM = 8;
// The arrow keys turn the view by this much (degrees), as the left figure's and the same way (ArrowLeft turns the stack
// as a drag to the left, ArrowUp as a drag up: since its up is the stack's normal, 2026-11-05; OrbitControls' own sense,
// the camera's way, before); a drag about as fast as its 0.4 degrees per pixel (OrbitControls turns a full circle over
// the pane's height times this).
const KEY_TURN_DEG = 5;
const ROTATE_SPEED = 0.6;
// A touch turns the view once it has gone this far across (CSS px) and more across than along; a vertical swipe is the
// page's scroll (touch-action pan-y) and turns nothing.
const TOUCH_SLOP_PX = 6;
// Texture texels that the alpha test drops (the board's outline is the art's edge).  The sheets' materials turn it into
// coverage (alphaToCoverage: the renderer's MSAA smooths the outlines, which an alpha test alone leaves in hard steps;
// the review of 2026-11-05), their colour replacing a covered sample's and their alpha never lowering it (below).
const ALPHA_TEST = 0.5;
// The transparent texels round the art take the colour of the art next to them, this many texels out, so the mipmaps
// of a board seen from afar keep its edge's colour instead of darkening it.
const BLEED_TEXELS = 4;
// The layers outward from the part (render: the order they are drawn in).
const LAYER_ORDER = {bottom: 1, film: 2, top: 3};
const DEG = Math.PI / 180;
// The checks' reads (pixels, probe only): the film's gradient in this many bands from its top to its foot, and a pixel
// darker or changed by this much (sRGB levels) counted as the contact shade's or the edge bands'.
const PROBE_BANDS = 6;
const PROBE_STEP = 8;

// The alpha test as coverage: the art's alpha over its edge a ramp one pixel wide centred on ALPHA_TEST (three.js's
// own steps from ALPHA_TEST up, half a pixel inside the edge and sharper), which the MSAA's samples then take.
const COVERAGE_FRAGMENT = `#ifdef USE_ALPHATEST
  diffuseColor.a = clamp( ( diffuseColor.a - alphaTest ) / max( fwidth( diffuseColor.a ), 1e-4 ) + 0.5, 0.0, 1.0 );
  if ( diffuseColor.a == 0.0 ) discard;
#endif`;

// -- The look: the lights and the environment ---------------------------------------------------------------------------
// studio.js (LIGHTS, STUDIO, TONE_EXPOSURE): this figure's look since the look lab of 2026-11-05, shared with the 3D view
// since the user's request of 2026-11-05 (every 3D drawing lit alike), moved there as they were.

// -- The look: the materials -------------------------------------------------------------------------------------------
// The part: a matte light grey (the 3D view's, viewer.js PART_RGB, times PART_LOOK.shade: under the studio's lights its
// faces toward the key would else melt into the pane's background).  The film: velostat's black (linear), satin (its
// roughness: the studio's softboxes and its own lamp as soft gradients on it), a frosted sheen at grazing angles
// (MeshPhysical sheen: on SwiftShader it cost no more than a plain MeshStandard film), so it reads as a sheet catching
// the light, not as a hole.  The boards: their art, the coverlay a satin dielectric (MeshStandard at
// BOARD_LOOK.roughness; a MeshPhysical clear coat cost SwiftShader about twice the boards' time) whose reflections (the
// studio's and the lights') are tinted BOARD_LOOK.tint of the way to the art's own hue: the copper and the gold under
// the amber polyimide give back an amber light, so the sweep of the softboxes over a board is a faint lighter amber, not
// a grey veil; BOARD_LOOK.gain lifts the art as the previews show it unlit.
//
// The film's own lamp (FILM_LAMP; the user's of 2026-11-05, 再调一下你说的黑色压阻膜, once the Exploded home had become the left
// figure's): the studio's back softbox and sheen lamp (studio.js) were set in the camera's frame for the home before,
// where the film's normal pointed up and to the left on screen (the camera's up was the world's y) and the film
// mirrored them near its top: sRGB 85 at its top to 54 at its foot on the UMI finger, 64 to 47 on the crank.  With the
// camera's up the stack's normal the film's normal points straight up on screen and the film mirrors the room between
// them: 44 to 38 and 39 to 35 (a flat unlit black reads 6.3), a black sheet again, nearly a hole.  The shared lights
// stay as they are: the sheen lamp moved to where the film now mirrors it lifted the boards' sweep too (the top FPC's
// median red at the Exploded home 207 to 216 on the UMI finger), and the film's studio turned 70 degrees about the line
// of sight (the old home's roll) lifted its level but left it flat (66 to 59: over a sheet that small the mirror
// direction turns some 4 degrees from its top to its foot, well inside the satin's blur).  A lamp of the film's own
// fixed in the camera's frame caught one part's film and missed another's (73 to 61 on the UMI finger, 46 to 40 on the
// I2RT YAM 1 mm, whose film lies right of the pane's middle, the others' left of it).  So the film's lamp (filmLit,
// filmLampAt) is a point light without falloff, FILM_LAMP.intensity, that only the film's shader takes (the boards, the
// part, the Assembled stack and the 3D view draw the same pixels as before), aimed for each drawing where the film seen
// from its Exploded home mirrors it just past its top edge on screen (FILM_LAMP.aim of the way from the film's middle
// sixth to its top sixth, there FILM_LAMP.out camera distances out along the mirror direction of the stack's normal),
// then hung on the camera as the studio's lights (a turn turns the film under it; it keeps its place in camera
// distances).  The film catches a soft highlight at its top that fades toward its foot, as at the old home, never a
// glossy spot (the satin's roughness kept); its envMapIntensity 1 (0.8 before) lifts the room it mirrors where the lamp
// does not reach.  Measured (2026-11-05, ?probe's film_bands at the Exploded home, 1440 px): 88 to 64 on the UMI
// finger, 74 to 47 on the crank, 84 to 42 on the soft finger; 99 to 70, 88 to 46 and 95 to 62 on the Library's I2RT YAM
// 1 mm, Trossen WidowX AI 2 mm and 13.8 mm tapered UMI tip; turned 15 degrees either way about the normal or 10 up or
// down, 36 on average at the least (tilted 10 degrees further from the normal: the film turned from its lamp and every
// softbox).
const PART_LOOK = {shade: 0.9, roughness: 0.6, metalness: 0};
const FILM_LOOK = {rgb: [0.014, 0.014, 0.016], roughness: 0.46, metalness: 0, specularIntensity: 1, sheen: 1, sheenRoughness: 0.5,
  sheenRGB: [0.07, 0.075, 0.085], envMapIntensity: 1};
const FILM_LAMP = {aim: 1.5, out: 0.3, intensity: 0.2};
const BOARD_LOOK = {gain: 1.22, roughness: 0.45, metalness: 0, envMapIntensity: 0.9, tint: 0.72};

// -- The look: the edges -----------------------------------------------------------------------------------------------
// A band along each outline (and cutout) from the sheet toward the part: exploded, the layer's thickness (BAND.mm) and
// BAND.minPx css px at least at the camera's distance (a 0.1 mm sheet would be a hairline); assembled, down to the layer
// under it (a board's to the part: its layer times the nest; the film's to the bottom board: one nest), so the three
// bands tile one stack edge that stands on the part.  Its side shaded as a side (its own normal, across the edge), the
// art's colour at the edge times BAND.shade.  The outline is found on the sheet's mesh in its texture's coordinates (the
// alpha test's edge), every BAND.step of a grid cell.
const BAND = {mm: {bottom: 0.11, film: 0.1, top: 0.11}, minPx: 2.5, shade: 0.82, step: 0.5};

// -- The look: the contact shade (Assembled) ---------------------------------------------------------------------------
// The stack's footprint seen along the normal, CONTACT.pxPerMm and CONTACT.maxPx on its longer side at most: blurred to
// CONTACT.coreMm (the dark line where the stack meets the part) and CONTACT.haloMm (the soft halo round it), with the
// height of the stack's underside (its sheets' facing cells, carried out past its edge), it darkens the part's light by
// CONTACT.strength (core, halo), CONTACT.most at most, where the part's surface lies at most CONTACT.reachMm below that
// height (a face well below the stack, or the part's far side, stays as lit) or no higher than the stack's top, fading
// over CONTACT.overMm above it (a part's overhang above the stack, a wall rising beside it: shaded near the stack only).
// Only the sheets' cells facing out (CONTACT.facing: the cosine to N, at least) make the footprint; the halo shades the
// part outside it only, the core from CONTACT.innerMm inside the rings' edge out (to the nearest texel, one at least),
// there where that edge faces the camera (the review of 2026-11-05: there the stack's edge band stands in view and the
// part meets its foot; on the Trossen WXAI sock, whose footprint ends a texel or so beyond the band's foot, a core
// outside the footprint only left a light line 2 device px wide between the band and its shade).  Not round a strip of
// cells turned from the normal inside the rings, nor along an edge facing away, whose band is culled: the part seen
// there inside the footprint, beside the soft finger's knuckle in its wrap, keeps no core.  Inside the footprint is
// where its halo is under CONTACT.insideHalo, and the edge's way out the halo's gradient.  Assembled only: exploded, the
// layers float clear of the part, as in a product's exploded render.
const CONTACT = {pxPerMm: 4, maxPx: 512, coreMm: 0.4, innerMm: 0.3, insideHalo: 0.08, haloMm: 2, reachMm: 2.5, overMm: 1, facing: 0.5,
  strength: [0.85, 0.4], most: 0.85};

function dispose(object) {
  object?.traverse?.(node => {
    node.geometry?.dispose();
    (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material?.dispose());
  });
}

async function raster(xml, [width, height], cutouts) {
  // An SVG document to a canvas through an image from a data: URL (a blob: URL or a fetch would break the CSP); the
  // board's cutouts punched out.
  const image = new Image(width, height);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.drawImage(image, 0, 0, width, height);
  if (cutouts?.length) {
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    for (const ring of cutouts) ring.forEach(([x, y], k) => (k ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.fill("evenodd");
    context.globalCompositeOperation = "source-over";
  }
  return canvas;
}

function filmCanvas(film, maxPx) {
  // The film's shape, white on transparent, over its grid's box in the base frame (y up: the canvas's top row is y1).
  const [x0, y0, x1, y1] = film.box;
  const k = Math.min(FILM_PX_PER_MM, maxPx / Math.max(x1 - x0, y1 - y0));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil((x1 - x0) * k));
  canvas.height = Math.max(1, Math.ceil((y1 - y0) * k));
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.beginPath();
  film.polygon.forEach(([x, y], index) => {
    const px = ((x - x0) / (x1 - x0)) * canvas.width; const py = ((y1 - y) / (y1 - y0)) * canvas.height;
    if (index) context.lineTo(px, py);
    else context.moveTo(px, py);
  });
  context.closePath();
  context.fill();
  return canvas;
}

function bled(canvas) {
  // The canvas's pixels (rows top first), its transparent ones next to the art given the art's colour (alpha kept 0).
  const {width, height} = canvas;
  const data = canvas.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, width, height).data;
  const pixels = new Uint8ClampedArray(data);
  let filled = new Uint8Array(width * height);
  for (let k = 0; k < width * height; k += 1) filled[k] = pixels[4 * k + 3] > 0 ? 1 : 0;
  for (let pass = 0; pass < BLEED_TEXELS; pass += 1) {
    const next = filled.slice();
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const k = y * width + x;
        if (filled[k]) continue;
        let r = 0; let g = 0; let b = 0; let n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx; const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height || !filled[yy * width + xx]) continue;
          const j = 4 * (yy * width + xx);
          r += pixels[j]; g += pixels[j + 1]; b += pixels[j + 2]; n += 1;
        }
        if (!n) continue;
        pixels[4 * k] = r / n; pixels[4 * k + 1] = g / n; pixels[4 * k + 2] = b / n;
        next[k] = 1;
      }
    }
    filled = next;
  }
  return {width, height, data, pixels};
}

// ==========================================================================================================================
// The look: shader patches
// ==========================================================================================================================

// The figure's warnings ("On the part: ...", each cause once), patched() through them, the studio's reflections-only
// patch and the studio itself (studio.js lookOf, as the 3D view has its own).
const {patched, reflections, reflectionsOnly, studioFor} = lookOf("On the part", {studied: "on-part studio",
  without: "the film and the boards are drawn"});

// The outlines' coverage (coverage, below): three.js's alpha test replaced by the ramp.
const COVERAGE_EDITS = [["#include <alphatest_fragment>", COVERAGE_FRAGMENT]];
// The boards' tint: their reflections, after the lights' and the studio's are summed (aomap_fragment comes next), turned
// toward the art's hue.
const TINT_EDITS = [["#include <aomap_fragment>", `{
		float boardPeak = max( max( diffuseColor.r, diffuseColor.g ), max( diffuseColor.b, 1e-4 ) );
		vec3 boardTint = mix( vec3( 1.0 ), diffuseColor.rgb / boardPeak, boardTintShare );
		reflectedLight.directSpecular *= boardTint;
		reflectedLight.indirectSpecular *= boardTint;
	}
	#include <aomap_fragment>`], ["#include <common>", "#include <common>\nuniform float boardTintShare;"]];
// The film's own lamp (FILM_LAMP): one more light, after the lights' and the studio's are gathered and before the
// indirect light is summed (lights_fragment_end), taken as three.js takes each of its own (RE_Direct: the physical
// material's specular, sheen and diffuse); filmLamp its place in the camera's frame, as the shader's geometryPosition.
const FILM_LAMP_EDITS = [["#include <lights_fragment_end>", `{
		IncidentLight filmLight;
		filmLight.direction = normalize( filmLamp - geometryPosition );
		filmLight.color = vec3( ${FILM_LAMP.intensity.toFixed(3)} );
		filmLight.visible = true;
		RE_Direct( filmLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#include <lights_fragment_end>`], ["#include <common>", "#include <common>\nuniform vec3 filmLamp;"]];
// The contact shade on the part: its world point (vContactWorld) and, before the output, its light darkened.
const CONTACT_VERTEX_EDITS = [["#include <common>", "#include <common>\nvarying vec3 vContactWorld;"],
  ["#include <worldpos_vertex>", "#include <worldpos_vertex>\n\tvContactWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;"]];
const CONTACT_FRAGMENT_EDITS = [["#include <common>", `#include <common>
varying vec3 vContactWorld;
uniform sampler2D contactMap;
uniform vec4 contactBox;
uniform vec4 contactZ;
uniform vec2 contactStep;
uniform vec2 contactStrength;`], ["#include <opaque_fragment>", `if ( contactStrength.x + contactStrength.y > 0.0 ) {
		vec2 contactUv = ( vContactWorld.xy - contactBox.xy ) / contactBox.zw;
		if ( all( greaterThan( contactUv, vec2( 0.0 ) ) ) && all( lessThan( contactUv, vec2( 1.0 ) ) ) ) {
			vec4 footprint = texture2D( contactMap, contactUv );
			float rise = vContactWorld.z - ( contactZ.x + footprint.b * contactZ.y );
			float within = rise > 0.0 ? 1.0 - smoothstep( contactZ.w, contactZ.w + ${CONTACT.overMm.toFixed(3)}, rise )
				: 1.0 - smoothstep( 0.4 * contactZ.z, contactZ.z, - rise );
			float core = footprint.r;
			float inside = 1.0 - smoothstep( 0.0, ${CONTACT.insideHalo.toFixed(3)}, footprint.g );
			if ( core > 0.0 && inside > 0.0 ) {
				vec2 outward = vec2( texture2D( contactMap, contactUv + vec2( contactStep.x, 0.0 ) ).g - texture2D( contactMap, contactUv - vec2( contactStep.x, 0.0 ) ).g,
					texture2D( contactMap, contactUv + vec2( 0.0, contactStep.y ) ).g - texture2D( contactMap, contactUv - vec2( 0.0, contactStep.y ) ).g );
				core *= mix( 1.0, smoothstep( 0.0, 1e-3, dot( outward, cameraPosition.xy - vContactWorld.xy ) ), inside );
			}
			float occlusion = ( contactStrength.x * core + contactStrength.y * footprint.g ) * within * footprint.a;
			outgoingLight *= 1.0 - clamp( occlusion, 0.0, ${CONTACT.most.toFixed(3)} );
		}
	}
	#include <opaque_fragment>`]];
// Whether each patch finds its text in this three.js (the standard material's shaders: the part, the boards and the film
// are all drawn by them; the film's is the physical material's, the same text), checked once, as the module loads.
const PATCHES = {
  reflections,
  tint: patched(THREE.ShaderLib.standard.fragmentShader, TINT_EDITS, "the boards' tinted reflections") !== null,
  contact: patched(THREE.ShaderLib.standard.vertexShader, CONTACT_VERTEX_EDITS, "the contact shade") !== null
    && patched(THREE.ShaderLib.standard.fragmentShader, CONTACT_FRAGMENT_EDITS, "the contact shade") !== null,
  filmLamp: patched(THREE.ShaderLib.physical.fragmentShader, FILM_LAMP_EDITS, "the film's lamp") !== null,
};

function coverage(material) {
  material.alphaToCoverage = true;
  // A covered sample takes the sheet's colour and keeps the larger alpha: an opaque layer or the part behind an outline
  // stays opaque there (the fragment's alpha is the coverage ramp's, written as it was it let the pane's grey through
  // round every outline over another layer, about 23 %; the review of 2026-11-05), the empty pane gets the ramp's.  The
  // sheets are drawn after the part and back to front (render), so what lies behind an outline is there first.  The
  // look's edits (reflective) come after this one.
  Object.assign(material, {blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.ZeroFactor,
    blendEquationAlpha: THREE.MaxEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor});
  material.onBeforeCompile = shader => {
    shader.fragmentShader = patched(shader.fragmentShader, COVERAGE_EDITS, "the outlines' coverage") ?? shader.fragmentShader;
  };
  material.customProgramCacheKey = () => "on-part-coverage";
  return material;
}

// ==========================================================================================================================
// The look: the materials
// ==========================================================================================================================

function partMaterial(contact) {
  // The part: PART_LOOK, both sides (an STL's facets may face either way), drawn a little behind the sheets that lie on
  // it (polygon offset); the contact shade (withContact) when three.js's text allows it.
  const {shade, ...look} = PART_LOOK;
  const material = new THREE.MeshStandardMaterial({color: new THREE.Color(...PART_RGB).multiplyScalar(shade), ...look, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  return PATCHES.contact ? withContact(material, contact) : material;
}

function reflective(material, look, tint) {
  // A sheet's material (its outline's coverage already set: coverage's edit first) mirroring the studio
  // (look.environment: its envMap, turned with the camera by look.rotation), its diffuse light the lights' alone; a
  // board's reflections tinted toward the art (tint, its share).  Without the studio the same material lit by the lights
  // alone.
  const kind = tint === null ? "film" : "board";
  const covered = material.onBeforeCompile;
  material.envMap = look.environment?.texture || null;
  material.envMapRotation = look.rotation;
  const uniforms = {boardTintShare: {value: tint ?? 0}};
  material.onBeforeCompile = (shader, renderer) => {
    covered.call(material, shader, renderer);
    let fragment = shader.fragmentShader;
    fragment = reflectionsOnly(fragment);
    if (tint !== null && PATCHES.tint) {
      const tinted = patched(fragment, TINT_EDITS, "the boards' tinted reflections");
      if (tinted !== null) { fragment = tinted; Object.assign(shader.uniforms, uniforms); }
    }
    shader.fragmentShader = fragment;
  };
  material.customProgramCacheKey = () => `on-part-coverage-${kind}`;
  return material;
}

function filmMaterial(map, look) {
  // Velostat (FILM_LOOK): satin black, a frosted sheen, the studio's reflections and its own lamp (filmLit); its outline
  // the map's alpha.
  const {rgb, sheenRGB, ...film} = FILM_LOOK;
  return filmLit(reflective(coverage(new THREE.MeshPhysicalMaterial({color: new THREE.Color(...rgb), map, alphaTest: ALPHA_TEST, side: THREE.DoubleSide, ...film,
    sheenColor: new THREE.Color(...sheenRGB)})), look, null), look);
}

function filmLit(material, look) {
  // The film's own lamp (FILM_LAMP_EDITS) after the studio's edits (reflective's first), at look.filmLamp (place() hangs
  // it, filmLampAt aims it).  Where three.js's text has changed, the film as before the lamp (one warning): lit by the
  // lights and the studio alone.
  const reflected = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    reflected.call(material, shader, renderer);
    const lit = PATCHES.filmLamp ? patched(shader.fragmentShader, FILM_LAMP_EDITS, "the film's lamp") : null;
    if (lit !== null) { shader.fragmentShader = lit; shader.uniforms.filmLamp = look.filmLamp; }
  };
  return material;
}

function boardMaterial(map, side, look) {
  // One side of a board (BOARD_LOOK): its art under a satin coverlay, the studio's reflections tinted by the art.
  const {gain, tint, ...board} = BOARD_LOOK;
  return reflective(coverage(new THREE.MeshStandardMaterial({map, color: new THREE.Color(gain, gain, gain), alphaTest: ALPHA_TEST, side, ...board})),
    look, tint);
}

function bandMaterial(map) {
  // A layer's edge band: a board's the art at its edge (its outward side's) times BAND.shade, the film's its black;
  // drawn from the front only (bandOf winds each band outward: the far side's are culled).
  if (!map) return new THREE.MeshStandardMaterial({color: new THREE.Color(...FILM_LOOK.rgb), roughness: FILM_LOOK.roughness, side: THREE.FrontSide});
  return new THREE.MeshStandardMaterial({map, color: new THREE.Color().setScalar(BOARD_LOOK.gain * BAND.shade), roughness: BOARD_LOOK.roughness,
    side: THREE.FrontSide});
}

// ==========================================================================================================================
// The look: the edges
// ==========================================================================================================================

function locator(sheet) {
  // Where a texture point (s, t) lies on the sheet's mesh: the triangle holding it and its barycentric weights, or null
  // off the mesh.  The triangles kept in a grid over the texture, one grid cell of the sheet a bucket.
  const {uvs, index} = sheet;
  let ds = Infinity; let dt = Infinity;
  for (let k = 0; k < Math.min(index.length, 600); k += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = index[k + e]; const b = index[k + ((e + 1) % 3)];
      const s = Math.abs(uvs[2 * a] - uvs[2 * b]); const t = Math.abs(uvs[2 * a + 1] - uvs[2 * b + 1]);
      if (s > 1e-7) ds = Math.min(ds, s);
      if (t > 1e-7) dt = Math.min(dt, t);
    }
  }
  if (!Number.isFinite(ds) || !Number.isFinite(dt)) return null;
  const buckets = new Map();
  const key = (i, j) => i * 65536 + j;
  for (let k = 0; k < index.length; k += 3) {
    let s0 = Infinity; let s1 = -Infinity; let t0 = Infinity; let t1 = -Infinity;
    for (let e = 0; e < 3; e += 1) {
      const v = index[k + e];
      s0 = Math.min(s0, uvs[2 * v]); s1 = Math.max(s1, uvs[2 * v]); t0 = Math.min(t0, uvs[2 * v + 1]); t1 = Math.max(t1, uvs[2 * v + 1]);
    }
    for (let i = Math.floor(s0 / ds); i <= Math.floor(s1 / ds); i += 1) {
      for (let j = Math.floor(t0 / dt); j <= Math.floor(t1 / dt); j += 1) {
        const bucket = buckets.get(key(i, j));
        if (bucket) bucket.push(k);
        else buckets.set(key(i, j), [k]);
      }
    }
  }
  const find = (s, t) => {
    const list = buckets.get(key(Math.floor(s / ds), Math.floor(t / dt)));
    if (!list) return null;
    for (const k of list) {
      const [a, b, c] = [index[k], index[k + 1], index[k + 2]];
      const ax = uvs[2 * a]; const ay = uvs[2 * a + 1];
      const bx = uvs[2 * b] - ax; const by = uvs[2 * b + 1] - ay; const cx = uvs[2 * c] - ax; const cy = uvs[2 * c + 1] - ay;
      const px = s - ax; const py = t - ay;
      const det = bx * cy - by * cx;
      if (Math.abs(det) < 1e-18) continue;
      const wb = (px * cy - py * cx) / det; const wc = (bx * py - by * px) / det; const wa = 1 - wb - wc;
      if (wa >= -1e-6 && wb >= -1e-6 && wc >= -1e-6) return [a, b, c, wa, wb, wc];
    }
    return null;
  };
  return {find, ds, dt};
}

function taxelsOn(sheet, points) {
  // The checks' taxels on a board's sheet (probe only): each texture point (drape.js probes: a taxel's centre on the
  // board's art) as its triangle and barycentric weights on the mesh, those off it left out.
  const where = points?.length ? locator(sheet) : null;
  return where ? points.map(([s, t]) => where.find(s, t)).filter(Boolean) : [];
}

function ringsOf(sheet) {
  // A layer's outline and cutouts in its texture's coordinates (hole: a cutout): a board's from its SVG (drape.js
  // texST), the film's polygon over its box.
  if (!sheet.art) {
    const [x0, y0, x1, y1] = sheet.box;
    return [{hole: false, ring: sheet.polygon.map(([x, y]) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)])}];
  }
  const st = ring => ring.map(([sx, sy]) => texST(sheet.art, sx, sy));
  return [{hole: false, ring: st(sheet.rings.outline)}, ...sheet.rings.cutouts.map(ring => ({hole: true, ring: st(ring)}))];
}

function bandOf(sheet) {
  // A layer's edge band: each ring taken every BAND.step of a grid cell onto the sheet's mesh (its exploded and
  // assembled points and its normal there, barycentrically, so the band lies on the drawn sheet at the alpha test's
  // edge), in runs where it lies on the mesh; each ring turned so that its band faces away from the material (the
  // base frame is counter-clockwise seen from outside, drape.js gridSheet: an outline counter-clockwise, a cutout
  // clockwise, then the band's triangles face outward, and the far side's are culled).  Its depth is set by fitBand
  // (it depends on the mode and the camera's distance).  Also the rings' assembled points (the contact shade's
  // footprint: {hole, points}).
  const where = locator(sheet);
  if (!where) return null;
  const points = [];
  const runs = [];
  const footprint = [];
  for (const {hole, ring} of ringsOf(sheet)) {
    if (!ring || ring.length < 3) continue;
    let dense = [];
    for (let k = 0; k < ring.length; k += 1) {
      const [s0, t0] = ring[k]; const [s1, t1] = ring[(k + 1) % ring.length];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(s1 - s0) / (BAND.step * where.ds), Math.abs(t1 - t0) / (BAND.step * where.dt))));
      for (let n = 0; n < steps; n += 1) dense.push([s0 + ((s1 - s0) * n) / steps, t0 + ((t1 - t0) * n) / steps]);
    }
    let hits = dense.map(([s, t]) => where.find(s, t));
    // The ring's turn in the base frame (the area of its points on the mesh): reversed where it would face inward.
    let area = 0; let last = null;
    for (const hit of [...hits, hits.find(Boolean)]) {
      if (!hit) continue;
      const [a, b, c, wa, wb, wc] = hit;
      const p = [0, 1].map(axis => wa * sheet.base[2 * a + axis] + wb * sheet.base[2 * b + axis] + wc * sheet.base[2 * c + axis]);
      if (last) area += last[0] * p[1] - p[0] * last[1];
      last = p;
    }
    if ((area > 0) === hole) { dense = dense.reverse(); hits = hits.reverse(); }
    const found = hits.filter(Boolean);
    if (found.length >= 3) {
      footprint.push({hole, points: found.map(([a, b, c, wa, wb, wc]) => [0, 1, 2].map(axis =>
        wa * sheet.assembled[3 * a + axis] + wb * sheet.assembled[3 * b + axis] + wc * sheet.assembled[3 * c + axis]))});
    }
    const all = hits.every(Boolean);
    // Runs of points on the mesh, a closed ring when every point is; else each run starts after a miss.
    const start = all ? 0 : Math.max(0, hits.findIndex(hit => !hit));
    let run = null;
    const first = runs.length;
    for (let n = 0; n < dense.length; n += 1) {
      const m = (start + n) % dense.length;
      if (!hits[m]) { run = null; continue; }
      if (!run) { run = {first: points.length, count: 0, closed: false}; runs.push(run); }
      points.push({st: dense[m], hit: hits[m]});
      run.count += 1;
    }
    if (all && runs.length > first) runs[runs.length - 1].closed = true;
  }
  const runsKept = runs.filter(run => run.count >= 2);
  if (!runsKept.length) return {geometry: null, footprint};
  const m = points.length;
  const surface = {exploded: new Float32Array(3 * m), assembled: new Float32Array(3 * m)};
  const normals = new Float32Array(3 * m);
  const uvs = new Float32Array(4 * m);
  points.forEach(({st, hit}, k) => {
    const [a, b, c, wa, wb, wc] = hit;
    for (const [mode, array] of [["exploded", sheet.positions], ["assembled", sheet.assembled]]) {
      for (let axis = 0; axis < 3; axis += 1) surface[mode][3 * k + axis] = wa * array[3 * a + axis] + wb * array[3 * b + axis] + wc * array[3 * c + axis];
    }
    let length = 0;
    for (let axis = 0; axis < 3; axis += 1) {
      normals[3 * k + axis] = wa * sheet.normals[3 * a + axis] + wb * sheet.normals[3 * b + axis] + wc * sheet.normals[3 * c + axis];
      length += normals[3 * k + axis] ** 2;
    }
    length = Math.sqrt(length) || 1;
    for (let axis = 0; axis < 3; axis += 1) normals[3 * k + axis] /= length;
    uvs.set(st, 4 * k); uvs.set(st, 4 * k + 2);
  });
  // Two vertices a point (on the sheet, and the band's depth toward the part), two triangles a step: (top i, bottom i,
  // top j) faces (bottom - top) x (j - i) = (-n) x t, outward for a counter-clockwise ring.
  const triangles = [];
  for (const run of runsKept) {
    const last = run.closed ? run.count : run.count - 1;
    for (let n = 0; n < last; n += 1) {
      const i = run.first + n; const j = run.first + ((n + 1) % run.count);
      triangles.push(2 * i, 2 * i + 1, 2 * j, 2 * j, 2 * i + 1, 2 * j + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * m), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(6 * m), 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(triangles);
  return {geometry, surface, normals, runs: runsKept, count: m, depth: 0, mode: null, footprint};
}

function bandDepth(sheet, mode, nest, mmPerPx) {
  // A layer's band depth (mm): assembled down to the layer under it, exploded its thickness and BAND.minPx at least.
  if (mode === "assembled") return (sheet.art ? sheet.layer || 1 : 1) * nest;
  return Math.max(BAND.mm[sheet.layer === 2 ? "film" : sheet.layer === 1 ? "bottom" : "top"] || 0.1, BAND.minPx * mmPerPx);
}

function fitBand(band, mode, depth) {
  // The band's vertices for the mode at this depth, and its normals: across the edge (the edge's direction crossed with
  // the sheet's normal, as the triangles are wound), the same on both its rows.  In its own buffers, in place.
  if (!band?.geometry || (band.mode === mode && Math.abs(band.depth - depth) < 1e-6)) return;
  band.mode = mode;
  band.depth = depth;
  const top = band.surface[mode]; const n = band.normals;
  const position = band.geometry.attributes.position.array; const normal = band.geometry.attributes.normal.array;
  for (let k = 0; k < band.count; k += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      position[6 * k + axis] = top[3 * k + axis];
      position[6 * k + 3 + axis] = top[3 * k + axis] - depth * n[3 * k + axis];
    }
  }
  for (const run of band.runs) {
    for (let r = 0; r < run.count; r += 1) {
      const k = run.first + r;
      const next = run.first + (run.closed ? (r + 1) % run.count : Math.min(run.count - 1, r + 1));
      const prev = run.first + (run.closed ? (r - 1 + run.count) % run.count : Math.max(0, r - 1));
      const t = [0, 1, 2].map(axis => top[3 * next + axis] - top[3 * prev + axis]);
      // (bottom - top) x (next - top) = (-n) x t: the triangles' own normal.
      const side = [-(n[3 * k + 1] * t[2] - n[3 * k + 2] * t[1]), -(n[3 * k + 2] * t[0] - n[3 * k] * t[2]), -(n[3 * k] * t[1] - n[3 * k + 1] * t[0])];
      const length = Math.hypot(...side) || 1;
      for (let axis = 0; axis < 3; axis += 1) { normal[6 * k + axis] = side[axis] / length; normal[6 * k + 3 + axis] = side[axis] / length; }
    }
  }
  band.geometry.attributes.position.needsUpdate = true;
  band.geometry.attributes.normal.needsUpdate = true;
  band.geometry.computeBoundingSphere();
}

// ==========================================================================================================================
// The look: the contact shade (Assembled)
// ==========================================================================================================================

function boxBlur(source, width, height, radius) {
  // Three passes of a box blur ``radius`` texels across and up (a Gaussian's likeness); outside the texture is 0.
  if (radius < 1) return Float32Array.from(source);
  const a = Float32Array.from(source); const b = new Float32Array(a.length);
  const span = 2 * radius + 1;
  for (let pass = 0; pass < 3; pass += 1) {
    for (let y = 0; y < height; y += 1) {
      let sum = 0;
      for (let x = -radius; x <= radius; x += 1) if (x >= 0 && x < width) sum += a[y * width + x];
      for (let x = 0; x < width; x += 1) {
        b[y * width + x] = sum / span;
        const out = x - radius; const into = x + radius + 1;
        if (out >= 0) sum -= a[y * width + out];
        if (into < width) sum += a[y * width + into];
      }
    }
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let y = -radius; y <= radius; y += 1) if (y >= 0 && y < height) sum += b[y * width + x];
      for (let y = 0; y < height; y += 1) {
        a[y * width + x] = sum / span;
        const out = y - radius; const into = y + radius + 1;
        if (out >= 0) sum -= b[out * width + x];
        if (into < height) sum += b[into * width + x];
      }
    }
  }
  return a;
}

function eroded(cover, width, height, radius) {
  // The footprint less ``radius`` texels round its edge: each texel the least of the square round it (a row's, then a
  // column's; outside the texture is 0).
  const rows = new Float32Array(cover.length); const out = new Float32Array(cover.length);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    let least = 1;
    for (let dx = -radius; dx <= radius; dx += 1) least = Math.min(least, x + dx < 0 || x + dx >= width ? 0 : cover[y * width + x + dx]);
    rows[y * width + x] = least;
  }
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    let least = 1;
    for (let dy = -radius; dy <= radius; dy += 1) least = Math.min(least, y + dy < 0 || y + dy >= height ? 0 : rows[(y + dy) * width + x]);
    out[y * width + x] = least;
  }
  return out;
}

function contactField(sheets, footprints, nest) {
  // The stack's footprint seen along the normal (the world's x and y): each sheet's rings filled (a board's cutouts left
  // open, and only where a cell facing out lies), blurred to the core and the halo; the height of its underside (each
  // sheet's assembled cells facing out (CONTACT.facing: the cosine of their normal's angle to N, at least), less
  // its layer's nest: the part's surface under it, the lowest kept), carried out past the edge as far as the halo and the
  // reach go (two sweeps, each texel the nearest known one's).  A texture over the box {x0, y0, width, height} (mm): r the
  // core (from CONTACT.innerMm inside the footprint's edge out: the part beside the stack's edge, see CONTACT; the shader
  // keeps it inside only on an edge facing the camera), g the halo (outside the footprint only: where the stack lies it
  // hides the part, and where the part hides it, a bulge the drape passes through, the part's surface is no shadow's),
  // b the height over [z0, z0 + span], a 1 where the height is known; and its size in texels.
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const {points} of footprints.flat()) for (const [x, y] of points) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (!(x1 > x0 && y1 > y0)) return null;
  const margin = 2 * CONTACT.haloMm + CONTACT.reachMm;
  x0 -= margin; y0 -= margin; x1 += margin; y1 += margin;
  const k = Math.min(CONTACT.pxPerMm, CONTACT.maxPx / Math.max(x1 - x0, y1 - y0));
  const width = Math.max(2, Math.ceil((x1 - x0) * k)); const height = Math.max(2, Math.ceil((y1 - y0) * k));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", {willReadFrequently: true});
  context.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);  // a canvas row per texture row, y up the texture
  context.fillStyle = "#fff";
  for (const rings of footprints) {
    context.beginPath();
    for (const {points} of rings) points.forEach(([x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.fill("evenodd");
  }
  const pixels = context.getImageData(0, 0, width, height).data;
  const cover = new Float32Array(width * height);
  for (let t = 0; t < cover.length; t += 1) cover[t] = pixels[4 * t + 3] / 255;
  // The underside's height: each sheet's facing triangles (assembled) laid on the texels, the lowest kept.
  const lift = new Float32Array(width * height).fill(Infinity);
  for (const sheet of sheets) {
    const p = sheet.assembled; const index = sheet.index; const drop = (sheet.layer || 1) * nest; const normals = sheet.normals;
    for (let t = 0; t < index.length; t += 3) {
      const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
      if (normals[3 * a + 2] + normals[3 * b + 2] + normals[3 * c + 2] < 3 * CONTACT.facing) continue;
      const ax = (p[3 * a] - x0) * k; const ay = (p[3 * a + 1] - y0) * k; const bx = (p[3 * b] - x0) * k; const by = (p[3 * b + 1] - y0) * k;
      const cx = (p[3 * c] - x0) * k; const cy = (p[3 * c + 1] - y0) * k;
      const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (!det) continue;
      const left = Math.max(0, Math.floor(Math.min(ax, bx, cx))); const right = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx)));
      const low = Math.max(0, Math.floor(Math.min(ay, by, cy))); const high = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy)));
      for (let y = low; y <= high; y += 1) for (let x = left; x <= right; x += 1) {
        const sx = x + 0.5; const sy = y + 0.5;
        const wa = ((by - cy) * (sx - cx) + (cx - bx) * (sy - cy)) / det;
        const wb = ((cy - ay) * (sx - cx) + (ax - cx) * (sy - cy)) / det;
        const wc = 1 - wa - wb;
        if (wa < -1e-3 || wb < -1e-3 || wc < -1e-3) continue;
        const z = wa * p[3 * a + 2] + wb * p[3 * b + 2] + wc * p[3 * c + 2] - drop;
        if (z < lift[y * width + x]) lift[y * width + x] = z;
      }
    }
  }
  // The footprint only where a facing cell lies (a wrap's cells round the part's end, seen edge on along the normal,
  // would else lay their outline over the part's surface beyond the stack's edge); the core's band inside the edge
  // along the rings' own edge only (the outline less its erosion), not round a strip of cells turned from the normal
  // inside it (the wrap's beside the soft finger's knuckle: the part seen there keeps no core).
  const inner = eroded(cover, width, height, Math.max(1, Math.round(CONTACT.innerMm * k)));
  for (let t = 0; t < cover.length; t += 1) if (!Number.isFinite(lift[t])) cover[t] = 0;
  // Carried out past the edge: two sweeps (down and up the texture), each texel taking the height of its nearest known
  // neighbour's source (a chamfer distance), as far as the halo and the reach still show.
  const far = Math.ceil(margin * k);
  const distance = new Float32Array(width * height);
  for (let t = 0; t < lift.length; t += 1) distance[t] = Number.isFinite(lift[t]) ? 0 : Infinity;
  const sweep = (steps, y0s, y1s, dy, x0s, x1s, dx) => {
    for (let y = y0s; y !== y1s; y += dy) for (let x = x0s; x !== x1s; x += dx) {
      const t = y * width + x;
      for (const [sx, sy, cost] of steps) {
        const xx = x + sx; const yy = y + sy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const d = distance[yy * width + xx] + cost;
        if (d < distance[t]) { distance[t] = d; lift[t] = lift[yy * width + xx]; }
      }
    }
  };
  sweep([[-1, 0, 1], [0, -1, 1], [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2]], 0, height, 1, 0, width, 1);
  sweep([[1, 0, 1], [0, 1, 1], [1, 1, Math.SQRT2], [-1, 1, Math.SQRT2]], height - 1, -1, -1, width - 1, -1, -1);
  let z0 = Infinity; let z1 = -Infinity;
  for (let t = 0; t < lift.length; t += 1) if (distance[t] <= far) { z0 = Math.min(z0, lift[t]); z1 = Math.max(z1, lift[t]); }
  if (!(z1 >= z0)) return null;
  z0 -= 1; z1 += 1;
  const [core, halo] = [CONTACT.coreMm, CONTACT.haloMm].map(mm => boxBlur(cover, width, height, Math.max(1, Math.round(mm * k))));
  const data = new Uint8Array(4 * width * height);
  for (let t = 0; t < cover.length; t += 1) {
    const known = distance[t] <= far;
    data[4 * t] = Math.round(255 * Math.max(0, core[t] - Math.min(cover[t], inner[t])));
    data[4 * t + 1] = Math.round(255 * Math.max(0, halo[t] - cover[t]));
    data[4 * t + 2] = known ? Math.round((255 * (lift[t] - z0)) / (z1 - z0)) : 0;
    data[4 * t + 3] = known ? 255 : 0;
  }
  const map = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = false;
  map.needsUpdate = true;
  return {map, box: [x0, y0, width / k, height / k], z: [z0, z1 - z0], size: [width, height]};
}

function withContact(material, contact) {
  // The part's material with the contact shade (CONTACT_*_EDITS, its uniforms contact's: a blank map and no strength
  // until a stack is assembled); as three.js wrote it if its text has changed.
  material.onBeforeCompile = shader => {
    const vertex = patched(shader.vertexShader, CONTACT_VERTEX_EDITS, "the contact shade");
    const fragment = patched(shader.fragmentShader, CONTACT_FRAGMENT_EDITS, "the contact shade");
    if (vertex === null || fragment === null) return;
    Object.assign(shader.uniforms, contact);
    shader.vertexShader = vertex;
    shader.fragmentShader = fragment;
  };
  material.customProgramCacheKey = () => "on-part-contact";
  return material;
}

/**
 * Create the figure in `host` (its canvas over the pane, hidden until drawn); throws when WebGL is unavailable.  probe:
 * the checks' reads of the drawn pixels (faces, pixels below: each a render and a gl.readPixels, which stalls the GPU),
 * off for a visitor (main.js: the page's ?probe).  stage: null (Gen by Surface, main.js, passes none: the figure is as it
 * was) or the Library's (web/cad/library_view.js with web/cad/library_stage.js, the user's request of 2026-11-05: each
 * sensor's page in the Library a 3D view, the grippers whole; docs/LIBRARY_VIEW.md), a function (internals, figure) ->
 * the view, called once here: internals are the figure's own objects, and it may set view.homes ({exploded, assembled}:
 * each mode's direction toward the camera, else drape.js homeDirection) and add to the scene.
 */
export function createOnPartView(host, {onViewChange = () => {}, onContext = () => {}, probe = false, stage = null} = {}) {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  toneMap(renderer);
  const canvas = renderer.domElement;
  canvas.className = "on-part-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.hidden = true;
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV_DEG, 1, 0.1, 10000);
  // The camera's up the stack's normal (drape.js HOME_UP; the world's y, the field's, until the user's decision of
  // 2026-11-05: the left figure's roll was out of its reach), set before OrbitControls takes it as the axis it turns about.
  camera.up.set(...HOME_UP);
  const lights = studioLights(scene, camera);
  // The sheets' look: the studio (null without it) and its rotation, the camera's (shared by the sheets' materials); the
  // film's lamp, its place in the camera's frame (place, filmLampAt).
  const look = {environment: studioFor(renderer), rotation: new THREE.Euler(), filmLamp: {value: new THREE.Vector3()}};
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = ROTATE_SPEED;
  // Grab over the figure, grabbing while it turns, as the left figure (OrbitControls writes its cursor inline: "auto"
  // had overridden styles.css's grab, the review of 2026-11-05).
  controls.cursorStyle = "grab";
  // A vertical swipe scrolls the page on a touch screen; a drag across turns the view (OrbitControls set "none").
  canvas.style.touchAction = "pan-y";
  // And turns it only once it goes across (the review of 2026-11-06): the browser takes a swipe for the page's scroll
  // after a few pointermoves (then pointercancel), which OrbitControls had turned the view by, so on a phone one vertical
  // swipe over a gripper tilted it edge-on and a second showed it from below.  A touch's moves are held back from
  // OrbitControls (it listens on the document; the pointer is captured to the canvas) until it has gone TOUCH_SLOP_PX
  // across and more across than along; then the turn catches up from where the touch began.
  const touch = {id: null, x: 0, y: 0, across: false};
  canvas.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch" && touch.id === null) Object.assign(touch, {id: event.pointerId, x: event.clientX, y: event.clientY, across: false});
  });
  canvas.addEventListener("pointermove", event => {
    if (event.pointerType !== "touch" || event.pointerId !== touch.id || touch.across) return;
    const across = Math.abs(event.clientX - touch.x); const along = Math.abs(event.clientY - touch.y);
    if (across >= TOUCH_SLOP_PX && across > along) touch.across = true;
    else event.stopPropagation();
  });
  const touchEnd = event => { if (event.pointerId === touch.id) touch.id = null; };
  canvas.addEventListener("pointerup", touchEnd);
  canvas.addEventListener("pointercancel", touchEnd);
  const maxTexturePx = Math.min(4096, renderer.capabilities.maxTextureSize || 4096);
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  // The contact shade's uniforms, shared by the part's shader (a blank map, no strength, until a stack is assembled).
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
  blank.needsUpdate = true;
  const contact = {contactMap: {value: blank}, contactBox: {value: new THREE.Vector4(0, 0, 1, 1)},
    contactZ: {value: new THREE.Vector4(0, 1, CONTACT.reachMm, 0)}, contactStep: {value: new THREE.Vector2(0, 0)},
    contactStrength: {value: new THREE.Vector2(0, 0)}};
  const partLook = partMaterial(contact);
  const view = {stack: null, mode: "exploded", moved: false, draws: 0, serial: 0, size: [0, 0], lost: false,
    part: null, partPositions: null, sheets: null, textures: [], info: null, pixels: null, sheetsMode: null, contact: null, shadeOff: false, taxels: null,
    centre: null, filmAim: null};

  let frame = 0;
  function render() {
    // The sheets after the part (its group order 0) and back to front as the camera sees them: the layers go outward
    // along the world's z, so from outside the bottom FPC first, from the part's side the top FPC first (each sheet's
    // edge band in its group).  The studio turns with the camera (three.js looks it up through this rotation's inverse:
    // in the camera's frame), the hemisphere's up is the camera's; the contact shade in Assembled only (shadeOff: the
    // checks' read of the part without it).
    if (view.lost) return;
    const outside = camera.position.z >= controls.target.z;
    view.sheets?.children.forEach(group => { group.renderOrder = outside ? LAYER_ORDER[group.userData.sheet] : 4 - LAYER_ORDER[group.userData.sheet]; });
    look.rotation.setFromQuaternion(camera.quaternion);
    lights.turn();
    if (view.mode === "assembled" && view.contact && !view.shadeOff) contact.contactStrength.value.set(...CONTACT.strength);
    else contact.contactStrength.value.set(0, 0);
    renderer.render(scene, camera);
  }
  function requestRender() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; render(); });
  }
  const homeVector = () => new THREE.Vector3(...(view.homes?.[view.mode] || homeDirection(view.mode)));
  const turned = () => camera.position.clone().sub(controls.target).normalize().angleTo(homeVector()) > 1e-6;
  controls.addEventListener("change", () => { view.moved = turned(); requestRender(); });
  controls.addEventListener("end", () => onViewChange());

  function fitBands(distance) {
    // Each layer's edge band for the mode (bandDepth: BAND.minPx deep on screen at least when exploded; the pane's height
    // spans the lens's height at the target's distance).
    const mmPerPx = (2 * distance * Math.tan((FOV_DEG * DEG) / 2)) / Math.max(1, view.size[1]);
    const nest = view.stack?.nest_mm || 0.25;
    view.sheets?.children.forEach(group => {
      const {band, data} = group.userData;
      fitBand(band, view.mode, bandDepth(data, view.mode, nest, mmPerPx));
    });
  }
  function filmFace() {
    // Assembled, the film lies between the boards, and both cover its face from either side (its field lies inside both
    // outlines): its face is not drawn there (on SwiftShader its shader, alpha-tested under the top FPC, cost 8 to 17 ms
    // a frame for nothing); its edge band stays.
    const film = view.sheets?.children.find(group => group.userData.sheet === "film");
    if (film) film.children[0].visible = view.mode !== "assembled";
  }
  function ensureContact() {
    // The contact shade's footprint, made on the first Assembled of a drawing and kept until the next drawing
    // (clearSheets); false where the stack has none (no facing cell, no known height), so it is not made again at each
    // Assembled (35-60 ms of JS for the same nothing, the review of 2026-11-05).
    if (view.contact !== null || view.mode !== "assembled" || !view.sheets || !PATCHES.contact) return;
    const started = performance.now();
    const groups = view.sheets.children;
    const field = contactField(groups.map(group => group.userData.data), groups.map(group => group.userData.band?.footprint || []).filter(rings => rings.length),
      view.stack.nest_mm || 0.25);
    measure("on-part contact", started);
    view.contact = field || false;
    if (!field) return;
    contact.contactMap.value = field.map;
    contact.contactBox.value.set(...field.box);
    contact.contactStep.value.set(2 / field.size[0], 2 / field.size[1]);  // two texels: the halo's gradient (the edge's way out)
    contact.contactZ.value.set(field.z[0], field.z[1], CONTACT.reachMm, 3 * (view.stack.nest_mm || 0.25));
  }
  function place(keep) {
    // The camera at its home (or, turned, in its own direction) where it frames the sheets (drape.js frameView); the
    // edge bands fitted to its distance, the lamp at its place in the camera's frame.
    const home = view.stack?.home?.[view.mode];
    const [width, height] = view.size;
    if (!home || !(width > 0 && height > 0)) return;
    const direction = keep && view.moved ? camera.position.clone().sub(controls.target).normalize() : homeVector();
    const {target, distance} = frameView(home, direction.toArray(), width / height, camera.up.toArray());
    controls.target.set(...target);
    camera.position.copy(controls.target).addScaledVector(direction, distance);
    // Near and far round everything, the part's box with it (its depth resolution stays far finer than the layers' gaps).
    const reach = home.rAll + new THREE.Vector3(...home.centre).distanceTo(controls.target);
    camera.near = Math.max(1, distance - reach);
    camera.far = distance + reach;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.update();
    fitBands(distance);
    lights.place(distance);
    look.filmLamp.value.copy(filmLampAt(width / height)).multiplyScalar(distance);
    view.moved = keep && view.moved;
  }
  function filmLampAt(aspect) {
    // The film's lamp (FILM_LAMP) in the camera's frame, in camera distances, aimed from the Exploded home at this aspect
    // (drape.js frameView, the camera's up HOME_UP): the film's points (its exploded positions) in that camera's frame,
    // ranked by their height on screen (y / -z); A, FILM_LAMP.aim of the way from the mean of the middle sixth to the
    // mean of the top sixth (past 1: beyond the film's top edge); the lamp FILM_LAMP.out camera distances from A along
    // the mirror direction there of the stack's normal (HOME_UP), so the film mirrors it just past its top.  Kept for the
    // drawing and the aspect (a turn keeps it: hung on the camera, the film turns under it).
    if (view.filmAim?.stack === view.stack && view.filmAim.aspect === aspect) return view.filmAim.at;
    const z = new THREE.Vector3(...homeDirection("exploded"));
    const {target, distance} = frameView(view.stack.home.exploded, z.toArray(), aspect, HOME_UP);
    const up = new THREE.Vector3(...HOME_UP);
    const x = up.clone().cross(z).normalize(); const y = z.clone().cross(x);
    const eye = new THREE.Vector3(...target).addScaledVector(z, distance);
    const p = view.stack.sheets.film.positions; const count = p.length / 3;
    const seen = new Float64Array(p.length); const order = new Uint32Array(count);
    const v = new THREE.Vector3();
    for (let k = 0; k < count; k += 1) {
      v.set(p[3 * k], p[3 * k + 1], p[3 * k + 2]).sub(eye);
      seen[3 * k] = v.dot(x); seen[3 * k + 1] = v.dot(y); seen[3 * k + 2] = v.dot(z);
      order[k] = k;
    }
    order.sort((a, b) => seen[3 * b + 1] / -seen[3 * b + 2] - seen[3 * a + 1] / -seen[3 * a + 2]);
    const mean = (from, to) => {
      const sum = new THREE.Vector3(); const end = Math.max(from + 1, to);
      for (let r = from; r < end; r += 1) sum.add(v.fromArray(seen, 3 * order[r]));
      return sum.divideScalar(end - from);
    };
    const middle = mean(Math.floor((5 * count) / 12), Math.floor((7 * count) / 12)); const top = mean(0, Math.floor(count / 6));
    const aim = middle.clone().lerp(top, FILM_LAMP.aim);
    const normal = new THREE.Vector3(up.dot(x), up.dot(y), up.dot(z));
    const toCamera = aim.clone().negate().normalize();
    const mirror = normal.clone().multiplyScalar(2 * normal.dot(toCamera)).sub(toCamera);
    const at = aim.addScaledVector(mirror, FILM_LAMP.out * distance).divideScalar(distance);
    view.filmAim = {stack: view.stack, aspect, at};
    return at;
  }
  function resize() {
    const width = host.clientWidth; const height = host.clientHeight;
    if (!(width > 0 && height > 0) || (width === view.size[0] && height === view.size[1])) return;
    view.size = [width, height];
    renderer.setSize(width, height, false);
    place(true);
    requestRender();
  }
  new ResizeObserver(resize).observe(host);

  function texture(source) {
    // A bled canvas as a texture: rows bottom first (t up, as the sheets' uv), sRGB, mipmapped.
    const flipped = new Uint8Array(source.pixels.length);
    const row = 4 * source.width;
    for (let y = 0; y < source.height; y += 1) flipped.set(source.pixels.subarray(y * row, (y + 1) * row), (source.height - 1 - y) * row);
    const map = new THREE.DataTexture(flipped, source.width, source.height, THREE.RGBAFormat);
    map.colorSpace = THREE.SRGBColorSpace;
    map.generateMipmaps = true;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.anisotropy = anisotropy;
    map.needsUpdate = true;
    return map;
  }
  function sheetMesh(sheet, outwardMap, inwardMap, name) {
    // Its own positions, the mode's copied in (setMode copies the other's into the same buffer, drawn dynamic: a new
    // attribute per toggle left its GL buffer to the garbage collector, the review of 2026-11-05, and made the reflective
    // sheets vanish on SwiftShader, the look lab of 2026-11-05).  Children: the face(s), then the edge band.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(view.mode === "assembled" ? sheet.assembled : sheet.positions), 3)
      .setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("normal", new THREE.BufferAttribute(sheet.normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(sheet.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(sheet.index, 1));
    geometry.computeBoundingSphere();
    const group = new THREE.Group();
    const band = bandOf(sheet);
    group.userData = {sheet: name, data: sheet, band};
    if (!inwardMap) group.add(new THREE.Mesh(geometry, filmMaterial(outwardMap, look)));
    else {
      // The outward face (front: counter-clockwise seen from outside) and the inward one, each with its own side's art.
      for (const [map, side] of [[outwardMap, THREE.FrontSide], [inwardMap, THREE.BackSide]]) group.add(new THREE.Mesh(geometry, boardMaterial(map, side, look)));
    }
    if (band?.geometry) {
      const edge = new THREE.Mesh(band.geometry, bandMaterial(inwardMap ? outwardMap : null));
      edge.userData.edgeBand = true;
      group.add(edge);
    }
    return group;
  }
  function clearSheets(lost = false) {
    // The sheets taken down, disposed; lost: only dropped (what a lost context drew: see webglcontextrestored).
    if (view.sheets) { scene.remove(view.sheets); if (!lost) dispose(view.sheets); }
    if (!lost) view.textures.forEach(map => map.dispose());
    view.sheets = null;
    view.textures = [];
    if (view.contact && !lost) view.contact.map.dispose();
    view.contact = null;
    contact.contactMap.value = blank;
  }
  function clearPart(lost = false) {
    if (view.part) { scene.remove(view.part); if (!lost) view.part.geometry.dispose(); }
    view.part = null;
    view.partPositions = null;
  }
  function setPart(positions, matrix) {
    if (view.partPositions !== positions) {
      clearPart();
      // The STL's own positions (file units, no copy); the matrix takes them to the figure's frame.
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      view.part = new THREE.Mesh(geometry, partLook);
      view.part.matrixAutoUpdate = false;
      view.partPositions = positions;
      scene.add(view.part);
    }
    view.part.matrix.fromArray(matrix);
    view.part.matrixWorldNeedsUpdate = true;
  }

  function sample(source, points) {
    // The art's RGBA at each texture point (s, t) (t up: the canvas row (1 - t) of its height).
    return points.map(([s, t]) => {
      const x = Math.min(source.width - 1, Math.max(0, Math.floor(s * source.width)));
      const y = Math.min(source.height - 1, Math.max(0, Math.floor((1 - t) * source.height)));
      const k = 4 * (y * source.width + x);
      return [source.data[k], source.data[k + 1], source.data[k + 2], source.data[k + 3]];
    });
  }
  function faces(first) {
    // Each board's sheet drawn alone from the camera as it is, and the colour where the first taxel lies on it: what
    // faces the camera there (from home, its outward side).  In the same task as the render (no buffer kept).
    if (!probe || !first || !view.sheets || !(view.size[0] > 0)) return null;
    const gl = renderer.getContext();
    const buffer = renderer.getDrawingBufferSize(new THREE.Vector2());
    const out = {};
    for (const name of ["bottom", "top"]) {
      const point = first[name]?.[view.mode];
      if (!point) continue;
      view.sheets.children.forEach(group => { group.visible = group.userData.sheet === name; });
      if (view.part) view.part.visible = false;
      render();
      const projected = new THREE.Vector3(...point).project(camera);
      const x = Math.round(((projected.x + 1) / 2) * buffer.x); const y = Math.round(((projected.y + 1) / 2) * buffer.y);
      const pixel = new Uint8Array(4);
      if (x >= 0 && y >= 0 && x < buffer.x && y < buffer.y) gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      out[name] = [...pixel];
    }
    view.sheets.children.forEach(group => { group.visible = true; });
    if (view.part) view.part.visible = true;
    render();
    return out;
  }

  function cameraRead() {
    // The camera as it is (probe only: the checks' comparison with the left figure, the user's decision of 2026-11-05):
    // its tilt off the stack's normal and its spin about it (OrbitControls' polar and azimuthal angles about the camera's
    // up, degrees: the left figure's ORBIT_HOME at the Exploded home); axes, the screen directions (x right, y down) of the
    // bottom FPC's SVG x and y (the world's x and -y) and of N by the camera's rotation alone, as the left figure's
    // composed CSS rotation gives its own; and screen, the field's centre in the mode drawn (drape.js centreProbes)
    // through the lens, CSS px of the pane (where each figure's perspective shows too).  No render, no read of the GPU.
    if (!probe || !view.stack) return null;
    const r3 = number => Math.round(number * 1e3) / 1e3; const r6 = number => Math.round(number * 1e6) / 1e6;
    const points = view.centre?.[view.mode]; const [width, height] = view.size;
    camera.updateMatrixWorld();
    const inverse = camera.quaternion.clone().invert();
    const axis = vector => { const seen = new THREE.Vector3(...vector).applyQuaternion(inverse); return [r6(seen.x), r6(-seen.y)]; };
    const screen = points && width > 0 ? Object.fromEntries(Object.entries(points).map(([name, point]) => {
      const projected = new THREE.Vector3(...point).project(camera);
      return [name, [r3(((projected.x + 1) / 2) * width), r3(((1 - projected.y) / 2) * height)]];
    })) : null;
    return {tilt_deg: r3(controls.getPolarAngle() / DEG), spin_deg: r3(controls.getAzimuthalAngle() / DEG),
      axes: {x: axis([1, 0, 0]), y: axis([0, -1, 0]), n: axis([0, 0, 1])}, screen};
  }

  function pixels() {
    // What the drawing shows as it is (probe only): the drawn pixels (alpha above 0) on the buffer's outermost rows and
    // columns, edge_px (a part or a sheet cut off by the pane), and the undrawn rows and columns round the drawing on each
    // side, margin_px [left, top, right, bottom]; the part drawn alone, the pixels it covers whole that the whole drawing
    // leaves in part transparent, seam_px (the pane seen through a sheet's outline over the part); the film drawn alone,
    // its face's outline's pixels (drawn, next to an undrawn one, or drawn in part) and the share of them drawn in part,
    // film_soft (antialiased: an alpha test alone leaves none; without its edge band, whose own edges the MSAA smooths in
    // any case).  The look's (the look lab of 2026-11-05): the film's face drawn alone, the mean sRGB level of its covered
    // pixels in PROBE_BANDS bands from its top to its foot, film_bands (a satin sheet's gradient: the flat unlit black of
    // before read as a hole); each board's faces drawn alone, the median RGB of their covered pixels, board_median
    // {bottom, top}, and of those at the taxels' centres, taxel_median {bottom, top} (the bottom FPC's ENIG pads, which
    // its polyimide round them outnumbers); the part drawn alone again without the contact shade, its pixels the shade darkens by PROBE_STEP or
    // more, contact_px, and by how much at most, contact_max, and of the part's pixels along the stack's edge (no sheet
    // over them, one next to them) the share it darkens so, contact_edge (Assembled only: the line where the stack meets
    // the part, which a light line between the two had left out); the drawing without the edge bands, the
    // pixels they change by more than PROBE_STEP, band_px; studio, whether the sheets mirror the studio (studioFor); the
    // sheets drawn alone, the share of their covered pixels the whole drawing shows as they are (within PROBE_STEP),
    // sheets_seen (the rest hidden by the part in front of them: a whole gripper's other finger and body had hidden all but
    // a sliver of the stack, the review of 2026-11-06).  Device pixels, in the same task as the renders.
    if (!probe || !view.sheets || !(view.size[0] > 0)) return null;
    const gl = renderer.getContext();
    const {x: width, y: height} = renderer.getDrawingBufferSize(new THREE.Vector2());
    const read = () => {
      render();
      const data = new Uint8Array(4 * width * height);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return data;
    };
    const sheetsShown = keep => view.sheets.children.forEach(group => { group.visible = keep(group.userData.sheet); });
    const bandsShown = shown => view.sheets.traverse(node => { if (node.userData.edgeBand) node.visible = shown; });
    const alpha = (data, x, y) => data[4 * (y * width + x) + 3];
    const all = read();
    let edge = 0;
    for (let x = 0; x < width; x += 1) edge += (alpha(all, x, 0) > 0) + (alpha(all, x, height - 1) > 0);
    for (let y = 1; y < height - 1; y += 1) edge += (alpha(all, 0, y) > 0) + (alpha(all, width - 1, y) > 0);
    let [left, low, right, high] = [width, height, -1, -1];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!alpha(all, x, y)) continue;
        left = Math.min(left, x); right = Math.max(right, x); low = Math.min(low, y); high = Math.max(high, y);
      }
    }
    // Rows bottom first (gl.readPixels): the top margin is above the highest drawn row.
    const margin = right < 0 ? null : [left, height - 1 - high, width - 1 - right, low];
    let seam = 0; let contactPx = 0; let contactMax = 0; let edgePx = 0; let edgeShaded = 0;
    if (view.part) {
      sheetsShown(() => false);
      const part = read();
      for (let k = 3; k < part.length; k += 4) seam += part[k] === 255 && all[k] < 255;
      view.shadeOff = true;
      const plain = read();
      view.shadeOff = false;
      for (let k = 0; k < part.length; k += 4) {
        if (part[k + 3] !== 255 || plain[k + 3] !== 255) continue;
        const darker = (plain[k] + plain[k + 1] + plain[k + 2] - part[k] - part[k + 1] - part[k + 2]) / 3;
        contactPx += darker >= PROBE_STEP;
        contactMax = Math.max(contactMax, darker);
      }
      // The part's pixels along the stack's edge: drawn whole, the same in the whole drawing (no sheet over them), next to
      // one a sheet or a band changes.
      const uncovered = k => all[k] === part[k] && all[k + 1] === part[k + 1] && all[k + 2] === part[k + 2] && all[k + 3] === part[k + 3];
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const k = 4 * (y * width + x);
          if (part[k + 3] !== 255 || plain[k + 3] !== 255 || !uncovered(k) || (uncovered(k - 4) && uncovered(k + 4) && uncovered(k - 4 * width) && uncovered(k + 4 * width))) continue;
          edgePx += 1;
          edgeShaded += (plain[k] + plain[k + 1] + plain[k + 2] - part[k] - part[k + 1] - part[k + 2]) / 3 >= PROBE_STEP;
        }
      }
      view.part.visible = false;
    }
    sheetsShown(() => true);
    const alone = read();
    let sheetsPx = 0; let seenPx = 0;
    for (let k = 0; k < alone.length; k += 4) {
      if (alone[k + 3] !== 255) continue;
      sheetsPx += 1;
      seenPx += Math.max(Math.abs(alone[k] - all[k]), Math.abs(alone[k + 1] - all[k + 1]), Math.abs(alone[k + 2] - all[k + 2])) <= PROBE_STEP;
    }
    bandsShown(false);
    sheetsShown(name => name === "film");
    const film = read();
    let outline = 0; let soft = 0;
    const rows = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const a = alpha(film, x, y);
        if (!a) continue;
        const partial = a < 255;
        if (partial || !alpha(film, x - 1, y) || !alpha(film, x + 1, y) || !alpha(film, x, y - 1) || !alpha(film, x, y + 1)) {
          outline += 1;
          soft += partial;
        }
        if (!partial) rows.push(y, (film[4 * (y * width + x)] + film[4 * (y * width + x) + 1] + film[4 * (y * width + x) + 2]) / 3);
      }
    }
    // The film's bands from its top (rows bottom first: its highest row) to its foot.
    let filmBands = null;
    if (rows.length) {
      let top = -1; let foot = height;
      for (let k = 0; k < rows.length; k += 2) { top = Math.max(top, rows[k]); foot = Math.min(foot, rows[k]); }
      const levels = new Float64Array(PROBE_BANDS); const counts = new Float64Array(PROBE_BANDS);
      for (let k = 0; k < rows.length; k += 2) {
        const band = Math.min(PROBE_BANDS - 1, Math.floor(((top - rows[k]) / Math.max(1, top - foot + 1)) * PROBE_BANDS));
        levels[band] += rows[k + 1]; counts[band] += 1;
      }
      filmBands = [...levels].map((level, band) => (counts[band] ? Math.round((level / counts[band]) * 10) / 10 : null));
    }
    const medianOf = (data, at) => {
      // The median of each channel over the covered pixels (at: their offsets in data; all of them when null).
      const histograms = [0, 1, 2].map(() => new Uint32Array(256));
      let n = 0;
      const add = k => {
        if (data[k + 3] !== 255) return;
        n += 1;
        for (let channel = 0; channel < 3; channel += 1) histograms[channel][data[k + channel]] += 1;
      };
      if (at) at.forEach(add);
      else for (let k = 0; k < data.length; k += 4) add(k);
      return n ? histograms.map(histogram => {
        let seen = 0;
        for (let level = 0; level < 256; level += 1) { seen += histogram[level]; if (2 * seen >= n) return level; }
        return 255;
      }) : null;
    };
    const median = {}; const taxelMedian = {};
    for (const name of ["bottom", "top"]) {
      sheetsShown(sheet => sheet === name);
      const data = read();
      median[name] = medianOf(data, null);
      const p = view.sheets.children.find(group => group.userData.sheet === name).children[0].geometry.getAttribute("position").array;
      const at = (view.taxels?.[name] || []).map(([a, b, c, wa, wb, wc]) => {
        const point = new THREE.Vector3(...[0, 1, 2].map(axis => wa * p[3 * a + axis] + wb * p[3 * b + axis] + wc * p[3 * c + axis])).project(camera);
        const x = Math.round(((point.x + 1) / 2) * width - 0.5); const y = Math.round(((point.y + 1) / 2) * height - 0.5);
        return x >= 0 && y >= 0 && x < width && y < height ? 4 * (y * width + x) : -1;
      }).filter(k => k >= 0);
      taxelMedian[name] = medianOf(data, at);
    }
    sheetsShown(() => true);
    if (view.part) view.part.visible = true;
    const bare = read();
    bandsShown(true);
    let bands = 0;
    for (let k = 0; k < bare.length; k += 4) {
      bands += Math.max(Math.abs(bare[k] - all[k]), Math.abs(bare[k + 1] - all[k + 1]), Math.abs(bare[k + 2] - all[k + 2]), Math.abs(bare[k + 3] - all[k + 3])) > PROBE_STEP;
    }
    render();
    return {edge_px: edge, margin_px: margin, seam_px: seam, film_outline_px: outline, film_soft: outline ? Math.round((soft / outline) * 1e6) / 1e6 : null,
      film_bands: filmBands, board_median: median, taxel_median: taxelMedian, contact_px: contactPx, contact_max: Math.round(contactMax * 10) / 10,
      contact_edge: edgePx ? Math.round((edgeShaded / edgePx) * 1e3) / 1e3 : null, band_px: bands,
      sheets_seen: sheetsPx ? Math.round((seenPx / sheetsPx) * 1e3) / 1e3 : null, studio: Boolean(look.environment), buffer: [width, height]};
  }

  /**
   * Draw a stack (drape.js buildStack) with its art ("fpc:board-art"), in the mode setMode last set (a click of the
   * mode while the art loads holds: the review of 2026-11-05): resolves to {samples {row, column: RGBA at the probes'
   * texture points on each board's copper side}, faces {bottom, top: RGBA drawn at the first taxel}, pixels, texture_px,
   * vertices}, or null when a later show or clear came first (whatever it made is disposed).
   */
  async function show({stack, positions, probes}) {
    const serial = (view.serial += 1);
    const names = ["bottom", "top"];
    const rasters = await Promise.all(names.flatMap(name => {
      const sheet = stack.sheets[name];
      return [raster(sheet.art.front, sheet.art.px, sheet.cutouts), raster(sheet.art.back, sheet.art.px, sheet.cutouts)];
    }));
    if (serial !== view.serial) return null;
    const sources = rasters.map(bled);
    const film = bled(filmCanvas(stack.sheets.film, maxTexturePx));
    const maps = [...sources, film].map(texture);
    clearSheets();
    view.textures = maps;
    view.stack = stack;
    const [bottomFront, bottomBack, topFront, topBack] = maps;
    const group = new THREE.Group();
    group.add(sheetMesh(stack.sheets.bottom, bottomFront, bottomBack, "bottom"), sheetMesh(stack.sheets.film, maps[4], null, "film"),
      sheetMesh(stack.sheets.top, topBack, topFront, "top"));
    view.sheets = group;
    view.sheetsMode = view.mode;
    view.taxels = probe ? {bottom: taxelsOn(stack.sheets.bottom, probes?.[stack.bottomKey]), top: taxelsOn(stack.sheets.top, probes?.[stack.topKey])} : null;
    view.centre = probe ? probes?.centre || null : null;
    scene.add(group);
    setPart(positions, stack.partMatrix);
    filmFace();
    ensureContact();
    canvas.hidden = false;
    view.size = [0, 0];
    resize();
    place(true);
    view.draws += 1;
    const samples = {};
    for (const key of ["row", "column"]) samples[key] = sample(sources[key === stack.bottomKey ? 0 : 2], probes?.[key] || []);
    const result = {samples, faces: faces(probes?.first), texture_px: {[stack.bottomKey]: stack.sheets.bottom.art.px, [stack.topKey]: stack.sheets.top.art.px},
      vertices: {bottom: stack.sheets.bottom.count, film: stack.sheets.film.count, top: stack.sheets.top.count}};
    view.pixels = pixels();
    view.info = result;
    render();
    return result;
  }
  function clear({part = false, keep = null, lost = false} = {}) {
    // The sheets taken down (their contact shade with them); the part too when asked or when it is not ``keep``'s (the
    // STL now loaded: the part of a file no longer loaded is not held, the review of 2026-11-05); lost: both dropped,
    // not disposed (a lost context's, webglcontextrestored).
    view.serial += 1;
    clearSheets(lost);
    if (part || lost || (view.partPositions && view.partPositions !== keep)) clearPart(lost);
    view.stack = null;
    view.filmAim = null;
    view.pixels = null;
    view.sheetsMode = null;
    view.taxels = null;
    view.centre = null;
    canvas.hidden = true;
  }
  function setMode(mode) {
    // Exploded or assembled: the other positions copied into the sheets' buffers (their edge bands' too, by place: in
    // place, never a new attribute), the film's face shown or not (filmFace), the contact shade made on the first
    // Assembled; the camera keeps a turned direction, else goes to the mode's home.
    view.mode = mode === "assembled" ? "assembled" : "exploded";
    view.sheets?.children.forEach(group => {
      const sheet = group.userData.data;
      const geometry = group.children[0].geometry;
      const attribute = geometry.getAttribute("position");
      attribute.copyArray(view.mode === "assembled" ? sheet.assembled : sheet.positions);
      attribute.needsUpdate = true;
      geometry.computeBoundingSphere();
    });
    if (view.sheets) view.sheetsMode = view.mode;
    filmFace();
    ensureContact();
    place(true);
    view.pixels = pixels();
    requestRender();
  }
  function reset() {
    view.moved = false;
    place(false);
    requestRender();
  }

  host.addEventListener("keydown", event => {
    if (!view.stack || event.altKey || event.ctrlKey || event.metaKey) return;
    // As a drag that way (KEY_TURN_DEG): the left figure's ArrowLeft turns its spin up, ArrowUp its tilt.
    const turn = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
    if (!turn && event.key !== "0") return;
    event.preventDefault();
    if (!turn) reset();
    else if (turn[0]) controls.rotateLeft(turn[0] * KEY_TURN_DEG * DEG);
    else controls.rotateUp(turn[1] * KEY_TURN_DEG * DEG);
    onViewChange();
  });
  host.addEventListener("dblclick", () => {
    if (!view.stack) return;
    reset();
    onViewChange();
  });
  canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); view.lost = true; onContext(false); });
  canvas.addEventListener("webglcontextrestored", () => {
    // What the lost context drew is dropped, never disposed: three.js has made its state again for the restored context
    // (its own listener runs first), and a dispose now has it delete the lost context's GL objects in the new one
    // (Chrome's "WebGL: INVALID_OPERATION: delete: object does not belong to this context", 32 of them and 8 of
    // deleteVertexArray after one loss, the review of 2026-11-05); the garbage collector takes their JS side.  The studio
    // (a render target, lost with the context) made again (or not, studioFor) for the sheets drawn next; the sheets and
    // the part made again as main.js draws the figure again (onContext(true)); the blank map and the part's material
    // upload and compile again as they are drawn.
    look.environment = studioFor(renderer);
    clear({lost: true});
    view.lost = false;
    onContext(true);
  });

  const figure = {
    maxTexturePx, show, clear, reset, setMode,
    info: () => ({moved: view.moved, draws: view.draws, mode: view.mode, lost: view.lost, shown: Boolean(view.stack), pixels: view.pixels || null,
      drawnMode: view.sheetsMode, camera: cameraRead()}),
  };
  return stage ? stage({scene, camera, controls, renderer, canvas, look, partLook, view, place, render, requestRender, filmMaterial}, figure) : figure;
}
