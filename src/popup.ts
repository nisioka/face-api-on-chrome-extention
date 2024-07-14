import {
  createCanvasContext,
  encodeFloat32ArrayToString, faceDrawBox,
  getSingleFaceDescriptor,
  prepareFaceApi
} from "./wrapper-face-api.ts";
import {getUserSettings} from "./util.ts";


const userSettings = getUserSettings();
prepareFaceApi()

window.onload = async () => {
  const container = document.getElementById("container")
  if(!container) return;

  const setting = await userSettings.get().then((g) => {
    if (!g || !g.data) {
      g = {data: [{name: "慧", color: "red", faceDescriptor: {}}]}
    } else if (g.data.length === 0 || !g.data[0].faceDescriptor) {
      g.data.push({name: "慧", color: "red", faceDescriptor: {}})
    }
    userSettings.set(g)
    return g
  })
  console.log(setting)

  // input image file
  const record = container.appendChild(document.createElement("tr"));
  // const addButton = record.appendChild(document.createElement("button"));
  // addButton.append("+");
  // addButton.addEventListener("click", function () {
  //   this.parentElement?.appendChild(record.cloneNode(true));
  // })

  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = "image/*";
  record.appendChild(inputFile);
  const preview = record.appendChild(document.createElement("img"))
  preview.id = "preview";
  preview.alt = "";
  preview.width = 200;
  preview.height = 200;
  inputFile.addEventListener("change", function () {
    previewFile(this, preview);
  });

  const record2 = container.appendChild(document.createElement("tr"));
  // const addButton = record.appendChild(document.createElement("button"));
  // addButton.append("+");
  // addButton.addEventListener("click", function () {
  //   this.parentElement?.appendChild(record.cloneNode(true));
  // })

  const inputFile2 = document.createElement("input");
  inputFile2.type = "file";
  inputFile2.accept = "image/*";
  record2.appendChild(inputFile2);
  const preview2 = record2.appendChild(document.createElement("img"))
  preview2.id = "preview";
  preview2.alt = "";
  preview2.width = 200;
  preview2.height = 200;
  inputFile2.addEventListener("change", function () {
    previewFile(this, preview2);
  });
}

function previewFile(inputFile: HTMLInputElement, preview: HTMLImageElement) {
  if(!inputFile?.files || !preview) return;

  const fileData = new FileReader();
  fileData.readAsDataURL(inputFile?.files[0]);

  fileData.onload = (async function() {
    if(!fileData.result) return;

    let img: HTMLImageElement = new Image();
    img.src = fileData.result as string;
    img.onload = function () {
      const ctx = createCanvasContext(img);
      getSingleFaceDescriptor(img).then(faceDetector => {

        let fileName = ""
        if (inputFile?.files && inputFile?.files.length > 0 && inputFile?.files[0]?.name) {
          fileName = inputFile?.files[0]?.name
        }

        if (faceDetector) {
          userSettings.get().then((g) => {
            g.data[0].faceDescriptor[fileName] = encodeFloat32ArrayToString(faceDetector.descriptor)

            faceDrawBox(ctx, faceDetector.detection.box, g.data[0].color, g.data[0].name);
            preview.src = ctx.canvas.toDataURL();

            userSettings.set(g).then((s) => {
              console.log(s)
            })
          })
        }

      return new Promise((r) => {r(faceDetector)})
      })
    }
  });
}
