chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'detectAllFaces_background') {
    getResult(request.imgurls).then(sendResponse);
  }
  return true;
});

const faceDetectionOptions = new faceapi.SsdMobilenetv1Options(
    {minConfidence: 0.4});

if (!faceapi.nets.ssdMobilenetv1.params) {
  setTimeout(downloadModel, 500);
} else {
  console.log('models ready', faceapi.nets)
}

async function downloadModel() {
  if (!faceapi.nets.ssdMobilenetv1.params) {
    faceapi.nets.ssdMobilenetv1 = await faceapi.createSsdMobilenetv1(
        await faceapi.fetchNetWeights(
            chrome.runtime.getURL('/weights/ssd_mobilenetv1.weights')));
  }
}

const imageAll = new ImageAll();
let result = {};

async function getResult(_urls) {

  let res = {};

  for (let index = 0; index < _urls.length; index++) {
    const url = _urls[index];
    console.log(result[url]);
    if (!result[url]) {
      let imgNew = await imageAll.loadImgFromHTTP(url);
      let detections = await faceapi.detectAllFaces(imgNew,
          faceDetectionOptions);
      console.log(detections);
      result[url] = detections;
      res[url] = detections;
    } else {
      res[url] = result[url];
    }
  }

  return res;
}



