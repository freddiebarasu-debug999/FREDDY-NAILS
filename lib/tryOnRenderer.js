import { NAIL_BASE_Y } from "@/lib/nailShapes";

// MediaPipe hand landmarks: [fingertip, joint just below it]
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

/*
  Draws the chosen design on every detected nail.
  opts: {
    shape, finish, colour (hex), size, length, shift, includeThumb,
    pattern: { image, zoom } | null
  }
*/
export function drawNails(ctx, hands, width, height, opts) {
  const shape = opts.shape;
  const base = hexToRgb(opts.colour);
  const light = mix(base, { r: 255, g: 255, b: 255 }, 0.32);
  const dark = mix(base, { r: 0, g: 0, b: 0 }, 0.34);
  const white = { r: 255, g: 255, b: 255 };
  const gold = { r: 246, g: 223, b: 160 };

  // Skin colour just behind each nail, taken from the untouched photo,
  // so the cuticle edge can blend into the finger.
  const skins = hands.map(function (lm) {
    return FINGERS.map(function (f) {
      try {
        const tip = { x: lm[f.tip].x * width, y: lm[f.tip].y * height };
        const joint = { x: lm[f.joint].x * width, y: lm[f.joint].y * height };
        const px = Math.round(joint.x - (tip.x - joint.x) * 0.35);
        const py = Math.round(joint.y - (tip.y - joint.y) * 0.35);
        const r = 4;
        const x0 = Math.max(0, Math.min(width - 2 * r, px - r));
        const y0 = Math.max(0, Math.min(height - 2 * r, py - r));
        const data = ctx.getImageData(x0, y0, 2 * r, 2 * r).data;
        let rr = 0, gg = 0, bb = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          rr += data[i]; gg += data[i + 1]; bb += data[i + 2]; n += 1;
        }
        return { r: Math.round(rr / n), g: Math.round(gg / n), b: Math.round(bb / n) };
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
      if (L < 6) return;

      const ux = vx / L;
      const uy = vy / L;

      // nail base sits about 62% of the way back from the tip
      const baseDist = 0.62 * L - opts.shift * L;
      const bx = tip.x - ux * baseDist;
      const by = tip.y - uy * baseDist;

      const nailLen = L * 0.74 * opts.length * shape.lenFactor;
      const nailWid = L * 0.6 * opts.size * (f.thumb ? 1.12 : 1);
      const nailHeight = NAIL_BASE_Y - shape.tipY;

      const path = new Path2D(shape.d);
      const seed = handIndex * 31 + fingerIndex * 7 + 5;
      const rand = rng(seed);

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(ux, -uy));
      ctx.scale(nailWid / 40, nailLen / nailHeight);
      ctx.translate(-40, -NAIL_BASE_Y);

      // soft shadow so the nail sits on the finger
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 1.5;
      ctx.fillStyle = css(base);
      ctx.fill(path);
      ctx.restore();

      ctx.save();
      ctx.clip(path);

      // base colour or the client's own design as a pattern
      if (opts.pattern && opts.pattern.image) {
        const img = opts.pattern.image;
        const zoom = Math.max(1, opts.pattern.zoom || 1.5);
        const targetRatio = 40 / (100 - shape.tipY);
        let sw = img.width / zoom;
        let sh = sw / targetRatio;
        if (sh > img.height / zoom) {
          sh = img.height / zoom;
          sw = sh * targetRatio;
        }
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 18, shape.tipY - 2, 44, 104 - shape.tipY);
      } else {
        const body = ctx.createLinearGradient(40, shape.tipY, 40, 100);
        body.addColorStop(0, css(mix(base, white, 0.14)));
        body.addColorStop(0.55, css(base));
        body.addColorStop(1, css(dark));
        ctx.fillStyle = body;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
      }

      const finish = opts.finish;

      if (finish === "Chrome") {
        const metal = ctx.createLinearGradient(20, shape.tipY, 60, 100);
        metal.addColorStop(0, css(mix(base, white, 0.75)));
        metal.addColorStop(0.3, css(mix(base, white, 0.2)));
        metal.addColorStop(0.55, css(mix(base, { r: 0, g: 0, b: 0 }, 0.45)));
        metal.addColorStop(0.8, css(mix(base, white, 0.5)));
        metal.addColorStop(1, css(mix(base, { r: 0, g: 0, b: 0 }, 0.25)));
        ctx.globalAlpha = opts.pattern && opts.pattern.image ? 0.4 : 0.92;
        ctx.fillStyle = metal;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
        ctx.globalAlpha = 1;
      }

      if (finish === "Glitter") {
        for (let i = 0; i < 70; i += 1) {
          const gx = 20 + rand() * 40;
          const gy = shape.tipY + rand() * (96 - shape.tipY);
          const r = 0.5 + rand() * 1.1;
          ctx.fillStyle = css(rand() > 0.5 ? white : gold, 0.55 + rand() * 0.45);
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (finish === "Shimmer") {
        const sheen = ctx.createLinearGradient(20, shape.tipY, 60, 100);
        sheen.addColorStop(0, "rgba(255,255,255,0.32)");
        sheen.addColorStop(0.5, "rgba(255,255,255,0)");
        sheen.addColorStop(1, "rgba(255,255,255,0.14)");
        ctx.fillStyle = sheen;
        ctx.fillRect(10, shape.tipY - 2, 60, 110 - shape.tipY);
        for (let i = 0; i < 20; i += 1) {
          const gx = 20 + rand() * 40;
          const gy = shape.tipY + rand() * (96 - shape.tipY);
          ctx.fillStyle = "rgba(255,255,255," + (0.5 + rand() * 0.5) + ")";
          ctx.beginPath();
          ctx.arc(gx, gy, 0.5 + rand() * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // gloss highlights (strong, soft or none)
      const gloss =
        finish === "Matte" ? 0.07 : finish === "Chrome" ? 0.5 : finish === "Glitter" ? 0.3 : 0.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,255,255," + gloss + ")";
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(29, 86);
      ctx.lineTo(29, shape.tipY + (96 - shape.tipY) * 0.35);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255," + gloss * 0.55 + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(36, 90);
      ctx.lineTo(36, 82);
      ctx.stroke();

      // soften the cuticle edge into the skin
      const skin = skins[handIndex][fingerIndex];
      if (skin) {
        const fade = ctx.createLinearGradient(0, NAIL_BASE_Y - 22, 0, NAIL_BASE_Y + 6);
        fade.addColorStop(0, css(skin, 0));
        fade.addColorStop(1, css(skin, 0.6));
        ctx.fillStyle = fade;
        ctx.fillRect(10, NAIL_BASE_Y - 22, 60, 32);
      }

      ctx.restore();

      // thin edge so the nail looks defined
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.stroke(path);
      ctx.restore();
    });
  });
}
