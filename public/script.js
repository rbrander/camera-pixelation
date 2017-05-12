const DECIMAL_RADIX = 10;
// canvases
const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
const canvas3 = document.getElementById('canvas3');
const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');
const ctx3 = canvas3.getContext('2d');
const chkDrawCanvas1 = document.getElementById('chkDrawCanvas1');
const chkDrawCanvas2 = document.getElementById('chkDrawCanvas2');
const chkDrawCanvas3 = document.getElementById('chkDrawCanvas3');
// other elements
const video = document.getElementById('video');
const rangeBlockSize = document.getElementById('rangeBlockSize');
// buttons
const btnStartVideo = document.getElementById('btnStartVideo');
const btnStopVideo = document.getElementById('btnStopVideo');
// darkness
const darknessValues = Object.values(darknessCourier);
const minDarkness = Math.min(...darknessValues);
const maxDarkness = Math.max(...darknessValues);
const darknessRange = maxDarkness - minDarkness;

let mediaStream = null;
let blockSize = 10;

const getUserMediaMethod = () => (
  (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia
);
const hasGetUserMedia = () => !!getUserMediaMethod();

// Canvas methods
const update = (tick) => {};
const draw = (tick, tickDiff) => {
  const start = Date.now();

  // clear canvases
  // NOTE: this may not be needed, takes about a third of a millisecond to run
  ctx1.fillStyle = 'black';
  ctx1.fillRect(0, 0, canvas1.width, canvas1.height);
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  ctx3.clearRect(0, 0, canvas3.width, canvas3.height);

  // draw the video, if active
  if (!mediaStream) {
    ctx1.fillStyle = 'white';
    ctx1.font = '1.25rem Tahoma';
    ctx1.textBaseline = 'middle';
    ctx1.textAlign = 'center';
    ctx1.fillText('~ no video ~', canvas1.width / 2, canvas1.height / 2);
  }
  if (mediaStream) {
    // draw a copy of the current video frame on the first canvas
    if (chkDrawCanvas1.checked) {
      ctx1.drawImage(video, 0, 0, canvas1.width, canvas1.height);
    }

    // draw interpolation
    const imageWidth = canvas1.width;
    const imageHeight = canvas1.height;
    const imageData = ctx1.getImageData(0, 0, imageWidth, imageHeight);
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
            pixelGrayValues.push(gray);
          }
        }
        const avgGray = ~~(pixelGrayValues.reduce((avg, curr) => avg + curr) / pixelGrayValues.length);
        if (chkDrawCanvas2.checked) {
          ctx2.fillStyle = `rgb(${avgGray},${avgGray},${avgGray})`;
          ctx2.fillRect(xOffset, yOffset, blockSizeX, blockSizeY);
        }

        if (chkDrawCanvas3.checked) {
          // draw the letters
          ctx3.fillStyle = 'black';
          ctx3.font = blockSize+'px Courier';
          ctx3.textBaseline = 'top';

          // find the char with matching darkness
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

    // display times
    ctx1.font = "20px Arial";
    ctx1.fillStyle = 'white';
    ctx1.strokeStyle = 'black';
    ctx1.textAlign = 'left';
    ctx1.textBaseline = 'top';

    const end = Date.now();
    const time = `draw took ${~~(end-start)} ms`;
    ctx1.strokeText(time, 20, 20);
    ctx1.fillText(time, 20, 20);

    const timeDiff = `frame took ${~~tickDiff} ms`
    ctx1.strokeText(timeDiff, 20, 50);
    ctx1.fillText(timeDiff, 20, 50);

    const fps = `frames per second ${~~(1000/tickDiff)}`
    ctx1.strokeText(fps, 20, 80);
    ctx1.fillText(fps, 20, 80);
  }
};

let lastTick = 0;
const loop = (tick) => {
  const tickDiff = tick - lastTick;
  lastTick = tick;
  update(tick);
  draw(tick, tickDiff);
  requestAnimationFrame(loop);
};

const stopVideo = () => {
  if (video) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
    video.src = '';
    btnStartVideo.disabled = false;
    btnStopVideo.disabled = true;
  }
};

const startVideo = () => {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      video.src = window.URL.createObjectURL(stream);
      video.onloadedmetadata = (e) => {
        mediaStream = stream;
        console.log('videoWidth: ', video.videoWidth);
        console.log('videoHeight: ', video.videoHeight);
      };
      video.play();
      btnStartVideo.disabled = true;
      btnStopVideo.disabled = false;
    })
    .catch(console.error);
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
  // setup events to track active dragging on the range input
  rangeBlockSize.addEventListener('mouseup', () => { isMouseDown = false; });
  rangeBlockSize.addEventListener('mousedown', () => { isMouseDown = true; });
  rangeBlockSize.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      blockSize = parseInt(e.target.value, DECIMAL_RADIX);
    }
  });
};
init();

