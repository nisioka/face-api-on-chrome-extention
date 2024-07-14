import * as faceapi from "@vladmandic/face-api";
import {FaceDetection} from "@vladmandic/face-api";
import {
  createCanvasContext,
  decodeStringToFloat32Array, faceDrawBox,
  getAllFaceDescriptors,
  prepareFaceApi
} from "./wrapper-face-api.ts";
import {getUserSettings} from "./util.ts";

setTimeout(init, 1000);

async function init() {
  await prepareFaceApi();

  const imageAll = new ImageAll();
  await imageAll.run(document.body);
}

class ImageAll {
  private result: {
    urls: string[];
    types: string[];
    allFaces: { [key: string]: { detection: FaceDetection, descriptor: Float32Array }[] };
    sizes: { width: number, height: number }[];
    elements: HTMLImageElement[]
  };

  constructor() {
    this.result = {
      elements: [],
      urls: [],
      types: [],
      sizes: [],
      allFaces: {}
    }
  };

  async detectAllFaces(_urls: string[]) {
    let res: { [key: string]: any } = {};

    for (let index = 0; index < _urls.length; index++) {
      const url = _urls[index];
      if (!res[url]) {
        const imgNew = await this.loadImgFromHTTP(url);
        res[url] = await getAllFaceDescriptors(imgNew);
      }
    }

    return res;
  }

  async run(_dom: any) {
    this.getImgElement();
    await this.traversal(_dom);

    this.result.allFaces = await this.detectAllFaces(this.result.urls);
    await this.exchangeImages();
  };

  async exchangeImages() {
    const allFaces: any = this.result.allFaces,
        imgElements = this.result.elements,
        urls = this.result.urls,
        types = this.result.types;

    if (!allFaces || !imgElements || !urls || !types) {
      return
    }

    const userSettings = await getUserSettings().get();
    const descriptors = decodeStringToFloat32Array(Object.values(userSettings.data[0].faceDescriptor));
    const labeledDescriptor = new faceapi.LabeledFaceDescriptors(userSettings.data[0].name, descriptors);

    for (let index = 0; index < imgElements.length; index++) {
      const img = imgElements[index],
          imgNew = await this.loadImgFromHTTP(urls[index]),
          ctx = createCanvasContext(imgNew);
      const faceImage = allFaces[urls[index]];

      for (let j = 0; j < faceImage.length; j++) {
        const matcher = new faceapi.FaceMatcher(labeledDescriptor, 0.6);
        const match = matcher.findBestMatch(faceImage[j].descriptor);
        console.log(match.valueOf())
        if (match.label === 'unknown') {
          continue
        }

        faceDrawBox(ctx.canvas, faceImage[j].detection.box, userSettings.data[0].color, match.label);
      }

      if (types[index] === 'element-image') {
        img.src = ctx.canvas.toDataURL();
      } else if (types[index] === 'background-image') {
        img.style.setProperty("background-image", "url(" + ctx.canvas.toDataURL() + ")");
      }
    }
  }

  async traversal(_parent: any) {
    let child = _parent.firstChild;

    while (child !== _parent.lastChild) {
      if (child.nodeType === 1) {
        const exRes = await this.extractBgUrl(child);

        if (exRes && exRes.url) {
          this.pushResult(child, exRes.url, "background-image", {
            width: exRes.img.naturalWidth,
            height: exRes.img.naturalHeight
          });
        }
        await this.traversal(child);
      }

      child = child.nextSibling;
    }
  }

  async extractBgUrl(_element: Element) {
    const bgStr = window.getComputedStyle(_element).getPropertyValue("background-image");
    if (bgStr !== "none") {
      const res = bgStr.split("(")[1].split(")")[0].replace(/["']/ig, '');
      if (res !== 'url' && !res.match('undefined')) {

        const img: HTMLImageElement = await this.loadImgFromHTTP(res),
            w = img.naturalWidth,
            h = img.naturalHeight;
        if (this.isImgMatch(w, h, res)) {
          return {url: res, img: img};
        }
      }
    }
  }

  getImgElement() {
    const imgElements = document.images;

    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i],
          w = img.naturalWidth,
          h = img.naturalHeight,
          url = img.src;

      if (this.isImgMatch(w, h, url)) {

        this.pushResult(img, url, "element-image", {
          width: w,
          height: h
        });

      }
    }
  }

  isImgMatch(_w: number, _h: number, _url: string) {
    return (_w !== 0 && _h !== 0 && _w > 10 && !_url.match('.svg'));
  }

  pushResult(_e: HTMLImageElement, _u: string, _t: string, _s: { width: number, height: number }) {
    this.result.urls.push(_u);
    this.result.elements.push(_e);
    this.result.types.push(_t);
    this.result.sizes.push(_s);
  }

  async loadImgFromHTTP(_url: string) {
    return new Promise<HTMLImageElement>((resolve) => {

      fetch(_url, {method: "GET"}).then(response => {
        response.arrayBuffer().then(blob => {
          const base64 = btoa(
              new Uint8Array(blob)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const str = 'data:image/png;base64,' + base64;
          resolve(this.loadImg(str));
        })
      }).catch((e) => {
        console.error('Error:', e);
      });
    });
  }

  async loadImg(_url: string) {
    return new Promise<HTMLImageElement>((resolve) => {
      const img: HTMLImageElement = new Image();
      img.src = _url;
      img.onload = function () {
        resolve(img);
      };
    });
  }
}









