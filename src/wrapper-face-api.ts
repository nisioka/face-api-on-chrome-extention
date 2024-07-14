import * as faceapi from "@vladmandic/face-api";
import {Box} from "@vladmandic/face-api";

export async function prepareFaceApi() {
  // download model
  if (!faceapi.nets.ssdMobilenetv1.params) {
    faceapi.nets.ssdMobilenetv1 = await faceapi.createSsdMobilenetv1(await faceapi.fetchNetWeights(chrome.runtime.getURL('/weights/ssd_mobilenetv1.weights')));
  }
  if (!faceapi.nets.faceLandmark68Net.params) {
    await faceapi.nets.faceLandmark68Net.load(await faceapi.fetchNetWeights(chrome.runtime.getURL('/weights/face_landmark_68_model.weights')))
  }
  if (!faceapi.nets.faceLandmark68TinyNet.params) {
    await faceapi.nets.faceLandmark68TinyNet.load(await faceapi.fetchNetWeights(chrome.runtime.getURL('/weights/face_landmark_68_tiny_model.weights')))
  }
  if (!faceapi.nets.faceRecognitionNet.params) {
    faceapi.nets.faceRecognitionNet = await faceapi.createFaceRecognitionNet(await faceapi.fetchNetWeights(chrome.runtime.getURL('/weights/face_recognition_model.weights')));
  }
}

const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({minConfidence: 0.4});

export function getSingleFaceDescriptor(htmlImageElement: HTMLImageElement) {
  return faceapi.detectSingleFace(htmlImageElement, faceDetectionOptions).withFaceLandmarks().withFaceDescriptor();
}

export function getAllFaceDescriptors(htmlImageElement: HTMLImageElement) {
  return faceapi.detectAllFaces(htmlImageElement, faceDetectionOptions).withFaceLandmarks().withFaceDescriptors();
}

export function encodeFloat32ArrayToString(faceDescriptor: Float32Array) {
  return btoa(String.fromCharCode(...(new Uint8Array(faceDescriptor.buffer))));
}

export function decodeStringToFloat32Array(f32base64Array: string[]) {
  const array = [] as Float32Array[]
  console.log(f32base64Array)
  for (const f32base64 of f32base64Array) {
    array.push(new Float32Array(new Uint8Array([...atob(f32base64)].map(c => c.charCodeAt(0))).buffer));
  }
  return array
}

export function createCanvasContext(htmlImageElement: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = htmlImageElement.naturalWidth;
  canvas.height = htmlImageElement.naturalHeight;
  console.log(htmlImageElement.src)

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context is not supported');
  }
  ctx.drawImage(htmlImageElement, 0, 0, htmlImageElement.naturalWidth, htmlImageElement.naturalHeight);

  return ctx
}

export function faceDrawBox(canvas: HTMLCanvasElement | CanvasRenderingContext2D, box: Box, boxColor?: string, label?: string, drawLabelOptions?: {fontSize: number}) {
  new faceapi.draw.DrawBox(box, {
    boxColor: boxColor ? boxColor : "red",
    label: label ? label : "",
    drawLabelOptions: drawLabelOptions ? drawLabelOptions : {fontSize: 10}
  }).draw(canvas);
}