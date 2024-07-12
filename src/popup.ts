import * as faceapi from "@vladmandic/face-api";
import {getBucket} from "@extend-chrome/storage";
import {encodeFloat32ArrayToString, faceDetectionOptions, prepareFaceApi} from "./wrapper-face-api.ts";

export interface UserSettings {
  enable: boolean;
  data: {
    name: string;
    faceDescriptor: string;
  }[]
}

const bucket = getBucket<UserSettings>("user_settings", "sync");
prepareFaceApi()

window.onload = async () => {
  const container = document.getElementById("container")
  if(!container) return;

  const setting = await bucket.get();
  console.log(setting)

  // ON/OFF radio button
  const onLabel = document.createElement("label")
  const onRadio = onLabel.appendChild(document.createElement("input"))
  onLabel.appendChild(document.createTextNode("ON"));
  const offLabel = document.createElement("label")
  const offRadio = offLabel.appendChild(document.createElement("input"))
  offLabel.appendChild(document.createTextNode("OFF"));

  onRadio.type = "radio";
  onRadio.name = "enable";
  onRadio.value = "true";
  onRadio.addEventListener("change", function () {
    changeOnOffListener(this);
  })
  offRadio.type = "radio";
  offRadio.name = "enable";
  offRadio.value = "false";
  offRadio.addEventListener("change", function () {
    changeOnOffListener(this);
  })
  if(setting.enable) {
    onRadio.checked = true;
    offRadio.checked = false;
  } else {
    onRadio.checked = false;
    offRadio.checked = true;
  }
  container.appendChild(onLabel).appendChild(offLabel);

  // input image file
  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = "image/*";
  container.appendChild(inputFile);
  const preview = container.appendChild(document.createElement("img"))
  preview.id = "preview";
  preview.alt = "";
  preview.width = 200;
  preview.height = 200;
  inputFile.addEventListener("change", function () {
    previewFile(this, preview);
  });
}

function changeOnOffListener(radioElement: HTMLInputElement) {
  bucket.set({enable: radioElement.value === "true"}).then((s) => {
    console.log(s)
  });
}

function previewFile(inputFile: HTMLInputElement, preview: HTMLImageElement) {
  if(!inputFile?.files || !preview) return;

  const fileData = new FileReader();
  fileData.readAsDataURL(inputFile?.files[0]);
  fileData.onload = (async function() {
    if(!fileData.result) return;
    preview.setAttribute("src", fileData.result.toString());

    let img: HTMLImageElement = new Image();
    img.src = fileData.result as string;

    faceapi.detectSingleFace(img, faceDetectionOptions).withFaceLandmarks().withFaceDescriptor()
    .then(faceDetector => {
      console.log(faceDetector)

      if (faceDetector) {
        bucket.set({
          data: [{
            name: "test",
            faceDescriptor: encodeFloat32ArrayToString(faceDetector.descriptor)
          }]
        }).then((s) => {
          console.log(s)
        })
        return new Promise((r) => {r(faceDetector)})
      } else {
        return new Promise((_, d) => {d(faceDetector)})
      }
    });
  });
}
