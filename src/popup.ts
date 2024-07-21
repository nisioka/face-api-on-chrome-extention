import {
  createCanvasContext,
  encodeFloat32ArrayToString, faceDrawBox,
  getSingleFaceDescriptor,
  prepareFaceApi
} from "./wrapper-face-api.ts";
import {
  colors,
  FaceImageSource,
  getFaceImageBucket,
  getUserSettingBucket,
  selectableColors,
  UserSettings
} from "./util.ts";


const userSettings = getUserSettingBucket();
const faceImage = getFaceImageBucket();
prepareFaceApi()

function createDomRecord(container: HTMLElement, setting: UserSettings, faceImages: FaceImageSource, index: number) {
  // input image file
  const record = container.appendChild(document.createElement("div"));
  const color = setting.data[index].color || selectableColors[index];
  record.style.border = color + " solid 2px";
  record.style.margin = "1px";

  record.appendChild(document.createElement("div")).appendChild(document.createTextNode((index + 1) + "人目"))

  const nameLabel = record.appendChild(document.createElement("label"));
  nameLabel.append("名前");
  const nameInput = nameLabel.appendChild(document.createElement("input"));
  nameInput.type = "text";
  nameInput.value = setting.data[index].name || "";
  nameInput.addEventListener("change", function () {
    userSettings.get().then((g) => {
      g.data[index].name = this.value
      userSettings.set(g)
    })
  })

  const colorLabel = record.appendChild(document.createElement("label"));
  colorLabel.append("色");
  const colorSelect = colorLabel.appendChild(document.createElement("select"));
  colorSelect.appendChild(new Option("赤", "red", color === "red", color === "red"));
  colorSelect.appendChild(new Option("青", "blue", color === "blue", color === "blue"));
  colorSelect.appendChild(new Option("緑", "green", color === "green", color === "green"));
  colorSelect.appendChild(new Option("紫", "purple", color === "purple", color === "purple"));
  colorSelect.appendChild(new Option("橙", "orange", color === "orange", color === "orange"));
  colorSelect.appendChild(new Option("黒", "black", color === "black", color === "black"));
  colorSelect.addEventListener("change", function () {
    const selected = this.value as colors;
    if(selected){
      record.style.borderColor = selected.toString();
    }
    userSettings.get().then((g) => {
      g.data[index].color = selected
      userSettings.set(g)
    })
  })

  const imageChoice = record.appendChild(document.createElement("div"));
  imageChoice.style.columnCount = "2";

  const fileNames = Object.keys(setting.data[index].faceDescriptor = setting.data[index].faceDescriptor || {});
  for(let i = 0; i < 2; i++) {
    const imageView = imageChoice.appendChild(document.createElement("div"));
    const inputFile = imageView.appendChild(document.createElement("input"));
    inputFile.type = "file";
    inputFile.accept = "image/*";
    const preview = imageView.appendChild(document.createElement("img"))
    preview.width = 100;
    preview.height = 100;
    if(fileNames.length > i && fileNames[i] && faceImages[fileNames[i]]){
      preview.src = faceImages[fileNames[i]];
    }
    imageView.appendChild(document.createTextNode(fileNames[i] || ""));

    inputFile.addEventListener("change", function () {
      previewFile(this, preview, index);
    });
  }
}

window.onload = async () => {
  const container = document.getElementById("container")
  if(!container) return;

  const setting = await userSettings.get().then((g) => {
    if (!g || !g.data) {
      g = {
        data: [
          {name: "", color: null, faceDescriptor: {}},
          {name: "", color: null, faceDescriptor: {}},
          {name: "", color: null, faceDescriptor: {}}
        ]
      } as UserSettings
    } else if (g.data.length === 0 || !g.data[0].faceDescriptor) {
      g.data.push({name: "", color: null, faceDescriptor: {}})
      g.data.push({name: "", color: null, faceDescriptor: {}})
      g.data.push({name: "", color: null, faceDescriptor: {}})
    }
    userSettings.set(g).then((s) => {console.log(s)})
    return g
  })
  const faceImages = await faceImage.get().then((g) => {
    if (!g) {
      g = {}
    }
    faceImage.set(g).then((s) => {console.log(s)})
    return g
  })

  createDomRecord(container, setting, faceImages, 0);
  createDomRecord(container, setting, faceImages, 1);
  createDomRecord(container, setting, faceImages, 2);

}

function previewFile(inputFile: HTMLInputElement, preview: HTMLImageElement, index: number) {
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
            g.data[index].faceDescriptor[fileName] = encodeFloat32ArrayToString(faceDetector.descriptor)

            faceDrawBox(ctx, faceDetector.detection.box, g.data[index].color, g.data[index].name);
            preview.src = ctx.canvas.toDataURL();

            userSettings.set(g)
          })
          faceImage.get().then(g => {
            g[fileName] = ctx.canvas.toDataURL()
            faceImage.set(g)
          })
        }

      return new Promise((r) => {r(faceDetector)})
      })
    }
  });
}
