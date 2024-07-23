import {FaceDetection} from "@vladmandic/face-api";
import {
  createCanvasContext,
  faceDrawBox,
  getAllFaceDescriptors, getFaceMatcher,
  prepareFaceApi
} from "./wrapper-face-api.ts";
import {getUserSettingBucket} from "./util.ts";

setTimeout(init, 1000);

async function init() {
  await prepareFaceApi();

  const imageAll = new ImageAll();
  await imageAll.run(document.body);
}

class ImageAll {
  private result: {
    urls: string[];
    types: ("element-image" | "background-image")[];
    allFaces: { [key: string]: { detection: FaceDetection, descriptor: Float32Array }[] };
    elements: HTMLImageElement[]
  };

  constructor() {
    this.result = {
      elements: [],
      urls: [],
      types: [],
      allFaces: {}
    }
  };

  async detectAllFaces(urls: string[], images: HTMLImageElement[]) {
    let res: { [key: string]: any } = {};

    for (let index = 0; index < urls.length; index++) {
      const url = urls[index];
      if (!res[url]) {
        res[url] = await getAllFaceDescriptors(images[index]);
      }
    }

    return res;
  }

  async run(dom: any) {
    this.setImageElement();
    await this.setBackgroundImageElement(dom);

    this.result.allFaces = await this.detectAllFaces(this.result.urls, this.result.elements);
    await this.drawFaceMatchImages();
  };

  async drawFaceMatchImages() {
    const allFaces: any = this.result.allFaces,
        imgElements = this.result.elements,
        urls = this.result.urls,
        types = this.result.types;

    if (!allFaces || !imgElements || !urls || !types) {
      return
    }

    const userSettings = await getUserSettingBucket().get();
    const matcher = getFaceMatcher(userSettings.data);

    for (let index = 0; index < imgElements.length; index++) {
      // 画像1枚毎に、顔検出結果からマッチングを行い、枠を描画する。
      const img = imgElements[index],
          faceImage = allFaces[urls[index]],
          ctx = createCanvasContext(img),
          drawCandidate = {} as { [name: string]: { distance: number, box: any } };

      for (let j = 0; j < faceImage.length; j++) {
        const match = matcher.findBestMatch(faceImage[j].descriptor);
        if (match.label === 'unknown') {
          continue
        }

        // 画像1枚に一致する顔は一つとして、最も似ている(distanceが小さい)ものを選択する。
        if(drawCandidate[match.label]) {
          if (drawCandidate[match.label].distance > match.distance) {
            drawCandidate[match.label] = {distance: match.distance, box: faceImage[j].detection.box}
          }
        } else {
          drawCandidate[match.label] = {distance: match.distance, box: faceImage[j].detection.box}
        }
      }

      for (let name in drawCandidate) {
        faceDrawBox(ctx.canvas, drawCandidate[name].box, userSettings.data.find((v) => v.name === name)?.color, name);
      }
      if (types[index] === 'element-image') {
        img.src = ctx.canvas.toDataURL();
      } else if (types[index] === 'background-image') {
        img.style.setProperty("background-image", "url(" + ctx.canvas.toDataURL() + ")");
      }
    }

  }

  setImageElement() {
    const imgElements = document.images;

    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i],
          w = img.naturalWidth,
          h = img.naturalHeight,
          url = img.src;

      if (w > 100 && h > 100) {
        this.pushResult(img, url, "element-image");
      }
    }
  }

  async setBackgroundImageElement(parent: any) {
    let child = parent.firstChild;

    while (child !== parent.lastChild) {
      if (child.nodeType === 1) {
        const exRes = await this.extractBackgroundImage(child);

        if (exRes && exRes.url) {
          this.pushResult(exRes.img, exRes.url, "background-image");
        }
        await this.setBackgroundImageElement(child);
      }

      child = child.nextSibling;
    }
  }

  async extractBackgroundImage(element: Element) {
    const bgStr = window.getComputedStyle(element).getPropertyValue("background-image");
    if (bgStr !== "none") {
      const backgroundUrl = bgStr.replace(/^url\("|"\)/g, '')
      if (backgroundUrl !== "") {

        const img: HTMLImageElement = await this.createImageElementViaHTTP(backgroundUrl),
            w = img.naturalWidth,
            h = img.naturalHeight;
        if (w > 100 && h > 100) {
          return {url: backgroundUrl, img: img};
        }
      }
    }
  }

  pushResult(imageElement: HTMLImageElement, url: string, types: ("element-image" | "background-image")) {
    this.result.elements.push(imageElement);
    this.result.urls.push(url);
    this.result.types.push(types);
  }

  async createImageElementViaHTTP(url: string) {
    return new Promise<HTMLImageElement>((resolve) => {

      fetch(url, {method: "GET"}).then(response => {
        response.arrayBuffer().then(blob => {
          const base64 = btoa(
              new Uint8Array(blob)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const img: HTMLImageElement = new Image();
          img.src = 'data:image/png;base64,' + base64;
          img.onload = function () {
            resolve(img);
          };
        })
      }).catch((e) => {
        console.error('Error:', e);
      });
    });
  }

}









