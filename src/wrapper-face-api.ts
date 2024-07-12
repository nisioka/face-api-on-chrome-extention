import * as faceapi from "@vladmandic/face-api";

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

export const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({minConfidence: 0.4});

export function encodeFloat32ArrayToString(faceDescriptor: Float32Array) {
  return btoa(String.fromCharCode(...(new Uint8Array(faceDescriptor.buffer))));
}

export function decodeStringToFloat32Array(f32base64: string) {
  return new Float32Array(new Uint8Array([...atob(f32base64)].map(c => c.charCodeAt(0))).buffer);
}