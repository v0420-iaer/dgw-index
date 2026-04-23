/**
 * Democracy index: regime thresholds + colours.
 * Stages: Non-democratic 0–35; Transitional 36–59; Developed 60–79; Consolidated 80–100.
 * Palette: Amaranth #D1495B, Honey Bronze #EDAE49, Stormy Teal #00798C,
 * Baltic Blue #30638E, Yale Blue #003D5B — flat category hues + continuous ramp.
 * Keep data/democracy-scale.js aligned.
 */
"use strict";

function clamp0100(v) {
  if (v == null || Number.isNaN(Number(v))) return 0;
  return Math.max(0, Math.min(100, Number(v)));
}

/** Democracy stage labels — 0–35; 36–59; 60–79; 80–100 (see Indicators page). */
function categoryFromScore(score) {
  const s = clamp0100(score);
  if (s >= 80) return "Consolidated stage";
  if (s >= 60) return "Developed stage";
  if (s >= 36) return "Transitional stage";
  return "Non-democratic stage";
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function lerpRgb(a, b, t) {
  const x = Math.max(0, Math.min(1, t));
  return `rgb(${lerp(a[0], b[0], x)}, ${lerp(a[1], b[1], x)}, ${lerp(a[2], b[2], x)})`;
}

function smoothstep01(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/** Continuous score fill: Amaranth → honey → electoral (bright cyan → Baltic via smoothstep) → deeper navy. */
function colorFromScore(score) {
  const s = clamp0100(score);
  if (s >= 80) {
    const u = (s - 80) / 20;
    return lerpRgb([48, 99, 142], [0, 34, 56], u);
  }
  if (s >= 60) {
    const u = (s - 60) / 19;
    const t = smoothstep01(u);
    return lerpRgb([0, 168, 188], [48, 99, 142], t);
  }
  if (s >= 36) {
    const t = (s - 36) / 23;
    return lerpRgb([255, 240, 198], [186, 110, 30], t);
  }
  const t = s <= 0 ? 0 : s / 35;
  return lerpRgb([255, 218, 222], [202, 66, 88], t);
}

/** Decile index 0–9 for bands 0–9, 10–19, … , 90–100 */
function decileFromScore(score) {
  return Math.min(9, Math.floor(clamp0100(score) / 10));
}

function contrastTextColor(rgbCss) {
  const m = String(rgbCss).match(/[\d.]+/g);
  if (!m || m.length < 3) return "#0f172a";
  const r = parseFloat(m[0]) / 255;
  const g = parseFloat(m[1]) / 255;
  const b = parseFloat(m[2]) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 ? "#0f172a" : "#ffffff";
}

/** Full-width CSS background for 0–100 legend (samples every 10 points) */
function linearGradientBackground() {
  const parts = [];
  for (let i = 0; i <= 10; i++) {
    const score = i === 10 ? 100 : i * 10;
    parts.push(`${colorFromScore(score)} ${i * 10}%`);
  }
  return `linear-gradient(to right, ${parts.join(", ")})`;
}

/** One solid colour per stage (map “category” view, ranking table, badges). */
function flatCategoryColor(category) {
  switch (category) {
    case "Consolidated stage":
    case "Consolidated democracy":
      return "rgb(0, 61, 91)";
    case "Developed stage":
    case "Electoral democracy":
      return "rgb(48, 99, 142)";
    case "Transitional stage":
    case "Transitional":
    case "Transition":
      return "rgb(237, 174, 73)";
    case "Non-democratic stage":
    case "No democracy":
      return "rgb(209, 73, 91)";
    default:
      return "rgb(209, 73, 91)";
  }
}

module.exports = {
  clamp0100,
  categoryFromScore,
  colorFromScore,
  decileFromScore,
  contrastTextColor,
  linearGradientBackground,
  flatCategoryColor,
};
