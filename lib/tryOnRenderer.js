import { NAIL_BASE_Y } from "@/lib/nailShapes";

// MediaPipe: fingertip + joint below it
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
  if (Number.isNaN(n)) return { r: 217, g: 144, b: 140 };
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
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws realistic nails on detected hands.
 * opts: { shape, finish, colour, size, length, shift, includeThumb, pattern: { image, zoom }|null }
 */
export function drawNails(ctx, hands, width, height, opts) {
  const shape = opts.shape;
  if (!shape || !shape.d) return;

  const base = hexToRgb(opts.colour);
  const light = mix(base, { r: 255, g: 255, b: 255 }, 0.28);
  const dark = mix(base, { r: 0, g: 0, b: 0 }, 0.28);
  const white = { r: 255, g: 255, b: 255 };
  const gold = { r: 246, g: 223, b: 160 };

  // Sample skin near each nail for cuticle blend
  const skins = hands.map(function (lm) {
    return FINGERS.map(function (f) {
      try {
        const tip = { x: lm[f.tip].x * width, y: lm[f.tip].y * height };
        const joint = { x: lm[f.joint].x * width, y: lm[f.joint].y * height };
        const px = Math.round(joint.x - (tip.x - joint.x) * 0.3);
        const py = Math.round(joint.y - (tip.y - joint.y) * 0.3);
        const r = 3;
        const x0 = Math.max(0, Math.min(width - 2 * r, px - r));
        const y0 = Math.max(0, Math.min(height - 2 * r, py - r));
        const data = ctx.getImageData(x0, y0, 2 * r, 2 * r).data;
        let rr = 0,
          gg = 0,
          bb = 0,
          n = 0;
        for (let i = 0; i < data.length; i += 4) {
          rr += data[i];
          gg += data[i + 1];
          bb += data[i + 2];
          n += 1;
        }
        return n ? { r: Math.round(rr / n), g: Math.round(gg / n), b: Math.round(bb / n) } : null;
      } catch (e) {
        return null;
      }
    });
  });

  hands.forEach(function (lm, handIndex) {
    FINGERS.forEach(function (f, fingerIndex) {
      if (f.thumb && !opts.includeThumb) return;

      const tip = { x: lm[f.tip].x * width, y: lm[f.tip].y * height };
      const joint = { x: lm[f.joint].x * width, y: lm[f.joint].y * height };
      const vx = tip.x - joint.x;
      const vy = tip.y - joint.y;
      const L = Math.hypot(vx, vy);
      if (L < 8) return;

      const ux = vx / L;
      const uy = vy / L;

      // Nail base sits back from the tip along the finger axis
      const baseDist = 0.58 * L - (opts.shift || 0) * L;
      const bx = tip.x - ux * baseDist;
      const by = tip.y - uy * baseDist;

      const lenFactor = shape.lenFactor || 1;
      const nailLen = L * 0.7 * (opts.length || 1) * lenFactor;
      const nailWid = L * 0.52 * (opts.size || 1) * (f.thumb ? 1.1 : 1);
      const nailHeight = NAIL_BASE_Y - shape.tipY;

      const path = new Path2D(shape.d);
      const seed = handIndex * 31 + fingerIndex * 7 + 5;
      const rand = rng(seed);

      ctx.save();
      ctx.translate(bx, by);
      // Align nail so tip points toward fingertip
      ctx.rotate(Math.atan2(ux, -uy));
      ctx.scale(nailWid / 40, nailLen / nailHeight);
      ctx.translate(-20, -NAIL_BASE_Y); // shape is 40 wide centered on x=40 → shift so origin is left edge? keep centered
      ctx.translate(-20, 0); // path coords: x 20–60 centered on 40

      // Soft contact shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = css(base, 0.95);
      ctx.fill(path);
      ctx.restore();

      ctx.save();
      ctx.clip(path);

      // --- Base fill ---
      if (opts.pattern && opts.pattern.image) {
        const img = opts.pattern.image;
        // Cover-fit the design into the nail box (x 20–60, y tipY–96)
        const nailW = 40;
        const nailH = NAIL_BASE_Y - shape.tipY + 4;
        const destX = 20;
        const destY = shape.tipY - 2;
        const zoom = Math.max(1.1, Math.min(2.5, opts.pattern.zoom || 1.4));

        // Source crop centered, cover aspect
        const targetRatio = nailW / nailH;
        let sw = img.width / zoom;
        let sh = sw / targetRatio;
        if (sh > img.height / zoom) {
          sh = img.height / zoom;
          sw = sh * targetRatio;
        }
        const sx = Math.max(0, (img.width - sw) / 2);
        const sy = Math.max(0, (img.height - sh) / 2);

        // Subtle base polish under design so gaps don't look empty
        const under = ctx.createLinearGradient(40, shape.tipY, 40, NAIL_BASE_Y);
        under.addColorStop(0, css(light));
        under.addColorStop(1, css(base));
        ctx.fillStyle = under;
        ctx.fillRect(18, shape.tipY - 2, 44, nailH + 4);

        try {
          ctx.drawImage(img, sx, sy, sw, sh, destX, destY, nailW, nailH);
        } catch (e) {
          // fall through to solid if draw fails
          ctx.fillStyle = css(base);
          ctx.fillRect(18, shape.tipY - 2, 44, nailH + 4);
        }
      } else {
        // Smooth solid polish
        const body = ctx.createLinearGradient(40, shape.tipY, 40, NAIL_BASE_Y);
        body.addColorStop(0, css(light));
        body.addColorStop(0.45, css(base));
        body.addColorStop(1, css(dark));
        ctx.fillStyle = body;
        ctx.fillRect(18, shape.tipY - 2, 44, NAIL_BASE_Y - shape.tipY + 6);
      }

      const finish = opts.finish || "Gloss";

      // Chrome
      if (finish === "Chrome") {
        const metal = ctx.createLinearGradient(22, shape.tipY, 58, NAIL_BASE_Y);
        metal.addColorStop(0, "rgba(255,255,255,0.55)");
        metal.addColorStop(0.35, css(mix(base, white, 0.35), 0.85));
        metal.addColorStop(0.55, css(mix(base, { r: 40, g: 40, b: 50 }, 0.25), 0.9));
        metal.addColorStop(0.75, css(mix(base, white, 0.4), 0.85));
        metal.addColorStop(1, "rgba(255,255,255,0.25)");
        ctx.globalAlpha = opts.pattern && opts.pattern.image ? 0.35 : 0.85;
        ctx.fillStyle = metal;
        ctx.fillRect(18, shape.tipY - 2, 44, NAIL_BASE_Y - shape.tipY + 6);
        ctx.globalAlpha = 1;
      }

      // Glitter
      if (finish === "Glitter") {
        for (let i = 0; i < 55; i += 1) {
          const gx = 22 + rand() * 36;
          const gy = shape.tipY + rand() * (NAIL_BASE_Y - shape.tipY - 4);
          const r = 0.4 + rand() * 1.0;
          ctx.fillStyle = css(rand() > 0.45 ? white : gold, 0.5 + rand() * 0.45);
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shimmer
      if (finish === "Shimmer") {
        const sheen = ctx.createLinearGradient(22, shape.tipY, 58, NAIL_BASE_Y);
        sheen.addColorStop(0, "rgba(255,255,255,0.28)");
        sheen.addColorStop(0.5, "rgba(255,255,255,0)");
        sheen.addColorStop(1, "rgba(255,255,255,0.12)");
        ctx.fillStyle = sheen;
        ctx.fillRect(18, shape.tipY - 2, 44, NAIL_BASE_Y - shape.tipY + 6);
      }

      // Gloss highlight line
      const gloss =
        finish === "Matte" ? 0.05 : finish === "Chrome" ? 0.42 : finish === "Glitter" ? 0.28 : 0.48;
      if (gloss > 0.06) {
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255,255,255," + gloss + ")";
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(30, 88);
        ctx.lineTo(30, shape.tipY + (NAIL_BASE_Y - shape.tipY) * 0.32);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255," + gloss * 0.5 + ")";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(35, 90);
        ctx.lineTo(35, 84);
        ctx.stroke();
      }

      // Cuticle fade into skin
      const skin = skins[handIndex][fingerIndex];
      if (skin) {
        const fade = ctx.createLinearGradient(0, NAIL_BASE_Y - 18, 0, NAIL_BASE_Y + 4);
        fade.addColorStop(0, css(skin, 0));
        fade.addColorStop(0.55, css(skin, 0.25));
        fade.addColorStop(1, css(skin, 0.55));
        ctx.fillStyle = fade;
        ctx.fillRect(18, NAIL_BASE_Y - 18, 44, 26);
      }

      ctx.restore();

      // Thin defined edge
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.stroke(path);
      ctx.restore();
    });
  });
}
