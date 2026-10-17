import { NAIL_BASE_Y } from "@/lib/nailShapes";

// MediaPipe hand landmarks: fingertip and distal finger joint.
const FINGERS = [
  { tip: 4, joint: 3, thumb: true },
  { tip: 8, joint: 7 },
  { tip: 12, joint: 11 },
  { tip: 16, joint: 15 },
  { tip: 20, joint: 19 },
];

function hexToRgb(hex) {
  const h = String(hex || "#d9908c").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return { r: 217, g: 144, b: 140 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(c, to, amount) {
  return {
    r: Math.round(c.r + (to.r - c.r) * amount),
    g: Math.round(c.g + (to.g - c.g) * amount),
    b: Math.round(c.b + (to.b - c.b) * amount),
  };
}

function css(c, a) {
  return "rgba(" + c.r + "," + c.g + "," + c.b + "," + (a === undefined ? 1 : a) + ")";
}

function rng(seed) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleSkin(ctx, x, y, width, height) {
  try {
    const r = 3;
    const x0 = Math.max(0, Math.min(width - 1, Math.round(x) - r));
    const y0 = Math.max(0, Math.min(height - 1, Math.round(y) - r));
    const sw = Math.max(1, Math.min(r * 2, width - x0));
    const sh = Math.max(1, Math.min(r * 2, height - y0));
    const data = ctx.getImageData(x0, y0, sw, sh).data;
    let rr = 0, gg = 0, bb = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Ignore nearly transparent pixels if a browser supplies them.
      if (data[i + 3] < 16) continue;
      rr += data[i]; gg += data[i + 1]; bb += data[i + 2]; n += 1;
    }
    return n ? { r: Math.round(rr / n), g: Math.round(gg / n), b: Math.round(bb / n) } : null;
  } catch (e) {
    return null;
  }
}

/*
  Draws a salon-style colour/finish preview over detected hand landmarks.
  This remains a visual guide, not a measurement of a real nail appointment.
*/
export function drawNails(ctx, hands, width, height, opts) {
  if (!ctx || !Array.isArray(hands) || !opts || !opts.shape) return;
  const shape = opts.shape;
  const base = hexToRgb(opts.colour);
  const light = mix(base, { r: 255, g: 255, b: 255 }, 0.38);
  const dark = mix(base, { r: 0, g: 0, b: 0 }, 0.3);
  const white = { r: 255, g: 255, b: 255 };
  const gold = { r: 255, g: 222, b: 151 };

  // Sample the unpainted image first, so each cuticle fade matches its own finger.
  const skins = hands.map((lm) => FINGERS.map((f) => {
    const tip = lm && lm[f.tip];
    const joint = lm && lm[f.joint];
    if (!tip || !joint) return null;
    const tx = tip.x * width, ty = tip.y * height;
    const jx = joint.x * width, jy = joint.y * height;
    // A point just behind the fingertip, where the natural nail bed meets skin.
    return sampleSkin(ctx, jx + (tx - jx) * 0.58, jy + (ty - jy) * 0.58, width, height);
  }));

  hands.forEach((lm, handIndex) => {
    if (!lm) return;
    FINGERS.forEach((f, fingerIndex) => {
      if (f.thumb && !opts.includeThumb) return;
      const landmarkTip = lm[f.tip];
      const landmarkJoint = lm[f.joint];
      if (!landmarkTip || !landmarkJoint) return;

      const tip = { x: landmarkTip.x * width, y: landmarkTip.y * height };
      const joint = { x: landmarkJoint.x * width, y: landmarkJoint.y * height };
      const vx = tip.x - joint.x;
      const vy = tip.y - joint.y;
      const L = Math.hypot(vx, vy);
      if (!Number.isFinite(L) || L < 6) return;

      const ux = vx / L;
      const uy = vy / L;
      const baseDist = L * (0.62 - (Number(opts.shift) || 0));
      const bx = tip.x - ux * baseDist;
      const by = tip.y - uy * baseDist;
      const nailLen = L * 0.74 * (Number(opts.length) || 1) * (shape.lenFactor || 1);
      const nailWid = L * 0.6 * (Number(opts.size) || 1) * (f.thumb ? 1.12 : 1);
      const nailHeight = NAIL_BASE_Y - shape.tipY;
      if (nailLen <= 0 || nailWid <= 0 || nailHeight <= 0) return;

      const path = new Path2D(shape.d);
      const rand = rng(handIndex * 31 + fingerIndex * 7 + 5);
      const finish = opts.finish || "Gloss";
      const patterned = Boolean(opts.pattern && opts.pattern.image);

      ctx.save();
      ctx.translate(bx, by);
      // The nail template points upward (negative Y); rotate it into the finger axis.
      ctx.rotate(Math.atan2(ux, -uy));
      ctx.scale(nailWid / 40, nailLen / nailHeight);
      ctx.translate(-40, -NAIL_BASE_Y);

      // Soft contact shadow, restrained so it does not look like a sticker.
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = 3.2;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fill(path);
      ctx.restore();

      ctx.save();
      ctx.clip(path);

      if (patterned) {
        const img = opts.pattern.image;
        const zoom = Math.max(1, Number(opts.pattern.zoom) || 1.5);
        const targetRatio = 40 / (100 - shape.tipY);
        let sw = img.width / zoom;
        let sh = sw / targetRatio;
        if (sh > img.height / zoom) {
          sh = img.height / zoom;
          sw = sh * targetRatio;
        }
        const sx = Math.max(0, (img.width - sw) / 2);
        const sy = Math.max(0, (img.height - sh) / 2);
        ctx.drawImage(img, sx, sy, sw, sh, 18, shape.tipY - 2, 44, 104 - shape.tipY);
        // Keep the reference artwork visible while adding subtle dimensional shading.
        const shade = ctx.createLinearGradient(14, 20, 66, 80);
        shade.addColorStop(0, "rgba(255,255,255,0.12)");
        shade.addColorStop(0.48, "rgba(255,255,255,0)");
        shade.addColorStop(1, "rgba(0,0,0,0.14)");
        ctx.fillStyle = shade;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
      } else {
        const body = ctx.createLinearGradient(12, shape.tipY, 68, 100);
        body.addColorStop(0, css(mix(base, white, 0.22)));
        body.addColorStop(0.22, css(light));
        body.addColorStop(0.56, css(base));
        body.addColorStop(1, css(dark));
        ctx.fillStyle = body;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
      }

      // Blend the proximal nail edge into the sampled skin after laying down colour.
      const skin = skins[handIndex] && skins[handIndex][fingerIndex];
      if (skin) {
        const cuticle = ctx.createLinearGradient(0, NAIL_BASE_Y - 27, 0, NAIL_BASE_Y + 3);
        cuticle.addColorStop(0, css(skin, 0));
        cuticle.addColorStop(0.55, css(skin, 0.035));
        cuticle.addColorStop(1, css(skin, finish === "Matte" ? 0.22 : 0.32));
        ctx.fillStyle = cuticle;
        ctx.fillRect(10, NAIL_BASE_Y - 27, 60, 33);
      }

      if (finish === "Chrome") {
        const metal = ctx.createLinearGradient(14, shape.tipY, 66, 100);
        metal.addColorStop(0, css(mix(base, white, 0.86)));
        metal.addColorStop(0.16, css(mix(base, white, 0.34)));
        metal.addColorStop(0.34, "rgba(255,255,255,0.9)");
        metal.addColorStop(0.47, css(mix(base, { r: 15, g: 15, b: 18 }, 0.56)));
        metal.addColorStop(0.63, css(mix(base, white, 0.62)));
        metal.addColorStop(0.78, css(mix(base, { r: 20, g: 20, b: 24 }, 0.38)));
        metal.addColorStop(1, css(mix(base, white, 0.44)));
        ctx.globalAlpha = patterned ? 0.3 : 0.88;
        ctx.fillStyle = metal;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
        ctx.globalAlpha = 1;
      }

      if (finish === "Glitter" || finish === "Shimmer") {
        const count = finish === "Glitter" ? 84 : 28;
        for (let i = 0; i < count; i += 1) {
          const gx = 18 + rand() * 44;
          const gy = shape.tipY + rand() * (95 - shape.tipY);
          const radius = finish === "Glitter" ? 0.35 + rand() * 1.25 : 0.25 + rand() * 0.75;
          ctx.fillStyle = css(rand() > 0.58 ? white : gold, finish === "Glitter" ? 0.38 + rand() * 0.58 : 0.22 + rand() * 0.48);
          ctx.beginPath();
          ctx.arc(gx, gy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        if (finish === "Glitter") {
          ctx.fillStyle = "rgba(255,255,255,0.26)";
          ctx.fillRect(18, shape.tipY + 4, 44, 2);
        }
      }

      // Finish-specific specular reflection: a broad highlight for gel gloss,
      // a crisp reflection for chrome, and almost none for matte.
      const gloss = finish === "Matte" ? 0.035 : finish === "Chrome" ? 0.48 : finish === "Glitter" ? 0.22 : finish === "Shimmer" ? 0.3 : 0.58;
      const highlight = ctx.createLinearGradient(23, 0, 47, 0);
      highlight.addColorStop(0, "rgba(255,255,255,0)");
      highlight.addColorStop(0.36, "rgba(255,255,255," + gloss * 0.15 + ")");
      highlight.addColorStop(0.53, "rgba(255,255,255," + gloss * 0.8 + ")");
      highlight.addColorStop(0.72, "rgba(255,255,255," + gloss * 0.08 + ")");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(18, shape.tipY + 5, 44, 88 - shape.tipY);

      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255," + gloss + ")";
      ctx.lineWidth = finish === "Chrome" ? 2.8 : 3.4;
      ctx.beginPath();
      ctx.moveTo(29, 83);
      ctx.bezierCurveTo(27, 68, 29, 48, 32, shape.tipY + 14);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + gloss * 0.42 + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(36, 82);
      ctx.quadraticCurveTo(37, 66, 37, 58);
      ctx.stroke();

      // Gentle side shading gives the nail a curved surface rather than a flat fill.
      const sideShade = ctx.createLinearGradient(12, 0, 68, 0);
      sideShade.addColorStop(0, "rgba(0,0,0,0.18)");
      sideShade.addColorStop(0.18, "rgba(0,0,0,0.025)");
      sideShade.addColorStop(0.72, "rgba(255,255,255,0.035)");
      sideShade.addColorStop(1, "rgba(0,0,0,0.16)");
      ctx.fillStyle = sideShade;
      ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);

      ctx.restore();

      // Fine contour and a muted free-edge line to anchor the nail to the photo.
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = "rgba(0,0,0,0.32)";
      ctx.stroke(path);
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(255,255,255,0.26)";
      ctx.beginPath();
      ctx.moveTo(22, 91);
      ctx.quadraticCurveTo(40, 98, 58, 91);
      ctx.stroke();
      ctx.restore();
    });
  });
}
