// Shrinks a photo on the client's phone before it is uploaded, so uploads are
// fast and storage stays small (free tier friendly).

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      // fall through to the <img> route
    }
  }
  return await new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a photo."));
    };
    img.src = url;
  });
}

export function checkImageFile(file, maxMb) {
  if (!file) return "Please choose a photo.";
  if (!file.type || file.type.indexOf("image/") !== 0) {
    return "Please choose a photo (JPG, PNG or HEIC).";
  }
  if (file.size > (maxMb || 20) * 1024 * 1024) {
    return "That photo is too large. Please choose one under " + (maxMb || 20) + " MB.";
  }
  return "";
}

export async function resizeToJpeg(file, options) {
  var opts = options || {};
  var maxSide = opts.maxSide || 1280;
  var quality = opts.quality || 0.85;
  var square = Boolean(opts.square);

  var bitmap = await loadBitmap(file);
  var sx = 0;
  var sy = 0;
  var cw = bitmap.width;
  var ch = bitmap.height;

  if (square) {
    var side = Math.min(cw, ch);
    sx = (cw - side) / 2;
    sy = (ch - side) / 2;
    cw = side;
    ch = side;
  }

  var scale = Math.min(1, maxSide / Math.max(cw, ch));
  var w = Math.max(1, Math.round(cw * scale));
  var h = Math.max(1, Math.round(ch * scale));

  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#11100f";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, sx, sy, cw, ch, 0, 0, w, h);
  if (bitmap.close) bitmap.close();

  var blob = await new Promise(function (resolve) {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) throw new Error("Could not prepare that photo. Please try another.");
  return blob;
}
