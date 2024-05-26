interface Rgba {
  red: number;
  green: number;
  blue: number;
  opacity: number;
}

/**
 * Utility method for taking an `<img>` element and removing the excess whitespace.
 * @param imageObject HTML image element to process
 * @returns Base64 data string of the cropped image's contents
 */
export const CropOutWhiteSpace = (imageObject: HTMLImageElement) => {
  const imgWidth = imageObject.width;
  const imgHeight = imageObject.height;
  var canvas = document.createElement('canvas');
  canvas.setAttribute("width", imgWidth + '');
  canvas.setAttribute("height", imgHeight + '');
  var context = canvas.getContext('2d');
  context!.drawImage(imageObject, 0, 0);
  var imageData = context!.getImageData(0, 0, imgWidth, imgHeight),
    data = imageData.data,
    getRBG = function (x: number, y: number): Rgba {
      var offset = imgWidth * y + x;
      return {
        red: data[offset * 4],
        green: data[offset * 4 + 1],
        blue: data[offset * 4 + 2],
        opacity: data[offset * 4 + 3]
      };
    },
    isWhite = function (rgb: Rgba) {
      // many images contain noise, as the white is not a pure #fff white
      return rgb.red > 200 && rgb.green > 200 && rgb.blue > 200;
    },
    scanY = function (fromTop: boolean) {
      var offset = fromTop ? 1 : -1;
      // loop through each row
      for (var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {
        // loop through each column
        for (var x = 0; x < imgWidth; x++) {
          var rgb = getRBG(x, y);
          if (!isWhite(rgb)) {
            if (fromTop) {
              return y;
            } else {
              return Math.min(y + 1, imgHeight);
            }
          }
        }
      }
      return null; // all image is white
    },
    scanX = function (fromLeft: boolean) {
      var offset = fromLeft ? 1 : -1;
      // loop through each column
      for (var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {
        // loop through each row
        for (var y = 0; y < imgHeight; y++) {
          var rgb = getRBG(x, y);
          if (!isWhite(rgb)) {
            if (fromLeft) {
              return x;
            } else {
              return Math.min(x + 1, imgWidth);
            }
          }
        }
      }
      return null; // all image is white
    };
  var cropTop = scanY(true) ?? 0,
    cropBottom = scanY(false) ?? 0,
    cropLeft = scanX(true) ?? 0,
    cropRight = scanX(false) ?? 0,
    cropWidth = cropRight - cropLeft,
    cropHeight = cropBottom - cropTop;
  canvas.setAttribute("width", cropWidth + '');
  canvas.setAttribute("height", cropHeight + '');
  canvas.getContext("2d")!.drawImage(imageObject,
    cropLeft, cropTop, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight);
  return canvas.toDataURL();
}

/**
 * Utility method that returns a functional signature result (in the event the tablet isn't working).
 */
export const GetSampleSignature = () => {
  return 'data:image/png;base64,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';
}