/**
 * Mirrors scripts/democracy-scale.cjs — continuous scale + flat regime colours (shared five-colour palette).
 */
(function (global) {
  "use strict";

  function clamp0100(v) {
    if (v == null || Number.isNaN(Number(v))) return 0;
    return Math.max(0, Math.min(100, Number(v)));
  }

  function categoryFromScore(score) {
    const s = clamp0100(score);
    if (s >= 80) return "Consolidated democracy";
    if (s >= 60) return "Electoral democracy";
    if (s >= 36) return "Initial stage democracy";
    return "No democracy";
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function lerpRgb(a, b, t) {
    const x = Math.max(0, Math.min(1, t));
    return "rgb(" + lerp(a[0], b[0], x) + ", " + lerp(a[1], b[1], x) + ", " + lerp(a[2], b[2], x) + ")";
  }

  /** Perceptual ease: steeper slope in the middle so nearby scores differ more (reduces “all the same blue”). */
  function smoothstep01(x) {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

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

  function decileFromScore(score) {
    return Math.min(9, Math.floor(clamp0100(score) / 10));
  }

  function contrastTextColor(rgbCss) {
    const m = String(rgbCss).match(/[\d.]+/g);
    if (!m || m.length < 3) return "#0f172a";
    var r = parseFloat(m[0]) / 255;
    var g = parseFloat(m[1]) / 255;
    var b = parseFloat(m[2]) / 255;
    var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.55 ? "#0f172a" : "#ffffff";
  }

  function linearGradientBackground() {
    var parts = [];
    for (var i = 0; i <= 10; i++) {
      var score = i === 10 ? 100 : i * 10;
      parts.push(colorFromScore(score) + " " + i * 10 + "%");
    }
    return "linear-gradient(to right, " + parts.join(", ") + ")";
  }

  function flatCategoryColor(category) {
    switch (category) {
      case "Consolidated democracy":
        return "rgb(0, 61, 91)";
      case "Electoral democracy":
        return "rgb(48, 99, 142)";
      case "Initial stage democracy":
        return "rgb(237, 174, 73)";
      case "No democracy":
        return "rgb(209, 73, 91)";
      default:
        return "rgb(209, 73, 91)";
    }
  }

  global.DGWScale = {
    clamp0100: clamp0100,
    categoryFromScore: categoryFromScore,
    colorFromScore: colorFromScore,
    decileFromScore: decileFromScore,
    contrastTextColor: contrastTextColor,
    linearGradientBackground: linearGradientBackground,
    flatCategoryColor: flatCategoryColor,
  };
})(typeof window !== "undefined" ? window : globalThis);
