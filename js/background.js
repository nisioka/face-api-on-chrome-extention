// import * as faceapi from './face-api.min.js';
try {
  importScripts('face-api.js', 'imageAllExchange.js');
} catch (e) {
  console.log(e)
} finally {
  const env = {
    Canvas: OffscreenCanvas,
    createCanvasElement: () => {
      return new OffscreenCanvas(480, 270);
    },
    fetch: () => {
      return {status: 200};
    }
  }
  faceapi.env.setEnv(env);

  faceapi.env.monkeyPatch(env);
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'detectAllFaces_background') {
    getResult(request.imgurls).then(sendResponse);
  }
  return true;
});

console.log(faceapi)
if (!faceapi.nets.ssdMobilenetv1.params) {
  setTimeout(downloadModel, 500);
}

async function downloadModel() {
  if (!faceapi.nets.ssdMobilenetv1.params) {
    faceapi.nets.ssdMobilenetv1 = await faceapi.createSsdMobilenetv1(
        await faceapi.fetchNetWeights(
            chrome.runtime.getURL('/weights/ssd_mobilenetv1.weights')));
  }
}

async function getResult(_urls) {
  let res = {};
  if(!faceapi){
    return res;
  }
  const imageAll = new ImageAll();
  let result = {};

  const faceDetectionOptions = new faceapi.SsdMobilenetv1Options(
      {minConfidence: 0.4});

  for (let index = 0; index < _urls.length; index++) {
    const url = _urls[index];
    if (!result[url]) {
      let imgNew = await imageAll.loadImgFromHTTP(url);
      let detections = await faceapi.detectAllFaces(imgNew,
          faceDetectionOptions);
      result[url] = detections;
      res[url] = detections;
    } else {
      res[url] = result[url];
    }
  }

  return res;
}



