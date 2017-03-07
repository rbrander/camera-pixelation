const DECIMAL_RADIX = 10;
const canvas = document.getElementById('canvas');
const canvas2 = document.getElementById('canvas2');
const canvas3 = document.getElementById('canvas3');
const ctx = canvas.getContext('2d');
const ctx2 = canvas2.getContext('2d');
const ctx3 = canvas3.getContext('2d');
const video = document.getElementById('video');
const rangeBlockSize = document.getElementById('rangeBlockSize');
const btnStartVideo = document.getElementById('btnStartVideo');
const btnStopVideo = document.getElementById('btnStopVideo');
let mediaStream = null;
let blockSize = 10;

const getUserMediaMethod = () => (
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia
);
const hasGetUserMedia = () => !!getUserMediaMethod();

// Canvas methods
const update = (tick) => {};
const draw = (tick) => {
  // clear canvases
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx3.clearRect(0, 0, canvas3.width, canvas3.height);

  // draw the video, if active
  if (!mediaStream) {
    ctx.fillStyle = 'white';
    ctx.font = '1.25rem Tahoma';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('~ no video ~', canvas.width / 2, canvas.height / 2);
  }
  if (mediaStream) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // draw interpolation


    const imageWidth = canvas.width;
    const imageHeight = canvas.height;
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    const data = imageData.data;

    const numXBlocks = Math.ceil(imageWidth / blockSize);
    const numYBlocks = Math.ceil(imageHeight / blockSize);
    for (let blockX = 0; blockX < numXBlocks; blockX++) {
      for (let blockY = 0; blockY < numYBlocks; blockY++) {
        let pixelGrayValues = [];
        const xOffset = blockX * blockSize;
        const yOffset = blockY * blockSize;
        const blockSizeX = xOffset + blockSize < canvas2.width ? blockSize : canvas2.width - xOffset;
        const blockSizeY = yOffset + blockSize < canvas2.height ? blockSize : canvas2.height - yOffset;
        for (let blockPixelX = 0; blockPixelX < blockSizeX; blockPixelX++) {
          for (let blockPixelY = 0; blockPixelY < blockSizeY; blockPixelY++) {
            const x = xOffset + blockPixelX;
            const y = yOffset + blockPixelY;
            const offset = ((imageWidth * y) + x) * 4;
            const red = data[offset];
            const green = data[offset + 1];
            const blue = data[offset + 2];
            const alpha = data[offset + 3];
            const gray = ~~((red + green + blue) / 3);
            // todo rgb getimagedata
            pixelGrayValues.push(gray);
          }
        }
        const avgGray = ~~(pixelGrayValues.reduce((avg, curr) => avg + curr) / pixelGrayValues.length);
        ctx2.fillStyle = `rgb(${avgGray},${avgGray},${avgGray})`;
        ctx2.fillRect(xOffset, yOffset, blockSizeX, blockSizeY);

        // draw the letters
        ctx3.fillStyle = 'black';
        ctx3.font = blockSize+'px Courier';
        ctx3.textBaseline = 'top';

        // find the char with matching darkness
        // const darkness = ~~(((255-avgGray) / 255) * 100);
        const darknessValues = Object.values(darknessCourier);
        const minDarkness = Math.min(...darknessValues);
        const maxDarkness = Math.max(...darknessValues);
        const darknessRange = maxDarkness - minDarkness;
        const darkness = ~~(((255 - avgGray) / 255) * darknessRange) + minDarkness;

        const foundKey = Object.keys(darknessCourier).reduce(
          (result, letter) =>
            (result ? result :
              (darknessCourier[letter] === darkness ? letter : result)
            )
          , null);
        if (foundKey) {
          const charWidth = ctx3.measureText(foundKey).width;
          const charXOffset = ~~((blockSize - charWidth + 1) / 2);
          ctx3.fillText(foundKey, xOffset + charXOffset, yOffset);
        } else {
          ctx3.fillStyle = `rgb(${avgGray+128},${avgGray+128},${avgGray+128})`
          ctx3.fillRect(xOffset, yOffset, blockSize, blockSize);
        }
      }
    }

  }
};


const loop = (tick) => {
  update(tick);
  draw(tick);
  requestAnimationFrame(loop);
};

const stopVideo = () => {
  if (video) {
    mediaStream.getTracks()[0].stop();
    mediaStream = null;
    video.src = '';
    btnStartVideo.disabled = false;
    btnStopVideo.disabled = true;
  }
};

const startVideo = () => {
  if (hasGetUserMedia()) {
    const getMedia = getUserMediaMethod().bind(navigator);
    const success = (localMediaStream) => {
      video.src = window.URL.createObjectURL(localMediaStream);
      video.onloadedmetadata = (e) => {
        mediaStream = localMediaStream;
      };
    };
    getMedia({ video: true }, success, console.error);
    btnStartVideo.disabled = true;
    btnStopVideo.disabled = false;
  }
};

const onBlockSizeChange = (e) => { blockSize = parseInt(e.target.value, DECIMAL_RADIX); };

// App start
let isMouseDown = false;
const init = () => {
  if (hasGetUserMedia()) {
    startVideo();
    requestAnimationFrame(loop);
  } else {
    alert('getUserMedia() is not supported in your browser');
  }
  rangeBlockSize.addEventListener('change', onBlockSizeChange);

  rangeBlockSize.addEventListener('mouseup', () => { isMouseDown = false; });
  rangeBlockSize.addEventListener('mousedown', () => { isMouseDown = true; });
  rangeBlockSize.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      blockSize = parseInt(e.target.value, DECIMAL_RADIX);
    }
  });
};
init();


// obtained from https://en.wikipedia.org/wiki/Courier_(typeface)
const darknessCourier = {
  'a': 21,
  'b': 25,
  'c': 18,
  'd': 25,
  'e': 24,
  'f': 19,
  'g': 28,
  'h': 24,
  'i': 14,
  'j': 15,
  'k': 25,
  'l': 16,
  'm': 30,
  'n': 21,
  'o': 20,
  'p': 27,
  'q': 27,
  'r': 18,
  's': 21,
  't': 17,
  'u': 19,
  'v': 17,
  'w': 25,
  'x': 20,
  'y': 21,
  'z': 21,

  'A': 25,
  'B': 29,
  'C': 21,
  'D': 26,
  'E': 29,
  'F': 25,
  'G': 27,
  'H': 31,
  'I': 18,
  'J': 19,
  'K': 28,
  'L': 20,
  'M': 36,
  'N': 24,
  'O': 20,
  'P': 25,
  'Q': 28,
  'R': 30,
  'S': 28,
  'T': 24,
  'U': 27,
  'V': 22,
  'W': 30,
  'X': 26,
  'Y': 23,
  'Z': 24,

  '`': 02,
  '1': 16,
  '2': 19,
  '3': 20,
  '4': 23,
  '5': 23,
  '6': 23,
  '7': 16,
  '8': 26,
  '9': 23,
  '0': 24,
  '-': 06,
  '=': 12,
  '~': 09,
  '!': 09,
  '@': 36,
  '#': 30,
  '$': 26,
  '%': 20,
  '^': 07,
  '&': 24,
  '*': 21,
  '(': 13,
  ')': 13,
  '_': 09,
  '+': 13,

  '[': 17,
  ']': 17,
  '\\': 08,
  ';': 11,
  '\'': 04,
  ',': 07,
  '.': 04,
  '/': 08,
  '{': 16,
  '}': 16,
  '|': 13,
  ':': 08,
  '"': 08,
  '<': 09,
  '>': 09,
  '?': 13,
};
