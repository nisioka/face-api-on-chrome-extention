import * as faceapi from "@vladmandic/face-api";

async function detectAllFaces_background(_urls: string[]) {
  return getResult(_urls);
}

async function init() {
  const imageAll = new ImageAll(detectAllFaces_background);

  await imageAll.run(document.body);
}

setTimeout(() => {
  init();
}, 1000);

async function getResult(_urls: string[]) {
  let res: { [key: string]: any} = {};
  if (!faceapi) {
    return res;
  }
  const imageAll = new ImageAll(detectAllFaces_background);
  let result: { [key: string]: any } = {};

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

class ImageAll {
  private readonly detectAllFacesFn: any;
  private result: { urls: string[]; types: string[]; allFaces: any; sizes: { width: number, height: number }[]; elements: HTMLImageElement[] };
  constructor(_detectAllFacesFn: any) {
    this.detectAllFacesFn = _detectAllFacesFn;
    this.result = {
      elements: [],
      urls: [],
      types: [],
      sizes: [],
      allFaces: {}
    }
  };

  async run(_dom: any) {
    await this.get(_dom);
    this.updateFacesResult(await this.detectAllFacesFn(this.result.urls));
    await this.exChangeImages();
  };

  updateFacesResult(_allFaces: any) {
    this.result.allFaces = _allFaces;
  };

  async get(_parent: any) {
    let that = this;
    that.getImgElement();

    await that.traversal(_parent);
  };

  async exChangeImages() {
    let that = this;
    let allFaces: any = this.result.allFaces;

    let imgs = this.result.elements,
        urls = this.result.urls,
        types = this.result.types;

    if(!allFaces || !imgs || !urls || !types){
      return
    }

    for (let index = 0; index < imgs.length; index++) {
      const img = imgs[index];
      let imgNew = await that.loadImgFromHTTP(urls[index]),
          ctx = that.createCanvas(imgNew);
      let detections = allFaces[urls[index]];

      for (let j = 0; j < detections.length; j++) {
        let box = detections[j]._box;
        ctx.strokeRect(box._x, box._y, box._width, box._height);
      }

      if (types[index] === 'element-image') {
        img.src = ctx.canvas.toDataURL();
      } else if (types[index] === 'background-image') {
        img.style.setProperty("background-image",   "url(" + ctx.canvas.toDataURL() + ")");
      }

    }
  };

  async traversal(_parent: any) {
    let that = this;
    let parent = _parent;
    let child = parent.firstChild;

    while (child !== parent.lastChild) {

      if (child.nodeType === 1) {

        let exRes = await that.extractBgUrl(child);

        if (exRes && exRes.url) {
          that.pushResult(child, exRes.url, "background-image", {
            width: exRes.img.naturalWidth,
            height: exRes.img.naturalHeight
          });
        }
        await that.traversal(child);
      }

      child = child.nextSibling;
    }
  };

  async extractBgUrl(_element: Element) {
    let that = this;
    let bgStr = window.getComputedStyle(_element).getPropertyValue("background-image");
    if (bgStr !== "none") {
      let res = bgStr.split("(")[1].split(")")[0].replace(/["']/ig, '');
      if (res !== 'url' && !res.match('undefined')) {

        let img: HTMLImageElement = await that.loadImgFromHTTP(res);
        let w = img.naturalWidth,
            h = img.naturalHeight;
        if (that.isImgMatch(w, h, res)) {
          return {url: res, img: img};
        }
      }
    }
  };

  getImgElement() {
    let that = this;
    let imgs = document.images;

    for (let i = 0; i < imgs.length; i++) {
      let img = imgs[i];
      let w = img.naturalWidth,
          h = img.naturalHeight,
          url = img.src;

      if (that.isImgMatch(w, h, url)) {

        that.pushResult(img, url, "element-image", {
          width: w,
          height: h
        });

      }
    }
  };

  isImgMatch(_w: number, _h: number, _url: string) {
    return (_w !== 0 && _h !== 0 && _w > 10 && !_url.match('.svg'));
  };

  pushResult(_e: HTMLImageElement, _u: string, _t: string, _s: { width: number, height: number }) {

    this.result.urls.push(_u);
    this.result.elements.push(_e);
    this.result.types.push(_t);
    this.result.sizes.push(_s);

  };

  async loadImgFromHTTP(_url: string) {
    let that = this;

    return new Promise<HTMLImageElement>((resolve) => {

      fetch(_url, {method: "GET"}).then(response => {
        response.arrayBuffer().then(blob => {
          let base64 = btoa(
              new Uint8Array(blob)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          //btoa(String.fromCharCode.apply(null, new Uint8Array(blob)))
          let str = 'data:image/png;base64,' + base64;
          let img = that.loadImg(str);
          resolve(img);
        })
      });
    });
  };

  async loadImg(_url: string) {
    return new Promise<HTMLImageElement>((resolve) => {
      let img: HTMLImageElement = new Image();
      img.src = _url;
      img.onload = function () {
        resolve(img);
      };
    });
  }

  createCanvas(_img: HTMLImageElement) {
    let w = _img.naturalWidth,
        h = _img.naturalHeight;

    let c = document.createElement('canvas');
    c.width = w;
    c.height = h;

    let ctx = c.getContext('2d');
    if (!ctx) {
      throw new Error('2d context is not supported');
    }
    ctx.drawImage(_img, 0, 0, w, h);

    return ctx
  }
}









