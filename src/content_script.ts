import * as faceapi from "@vladmandic/face-api";

async function init() {
  // download model
  if (!faceapi.nets.ssdMobilenetv1.params) {
    faceapi.nets.ssdMobilenetv1 = await faceapi.createSsdMobilenetv1(await faceapi.fetchNetWeights(chrome.runtime.getURL('/weights/ssd_mobilenetv1.weights')));
  }

  const imageAll = new ImageAll();
  await imageAll.run(document.body);
}

setTimeout(() => {
  init();
}, 1000);

class ImageAll {
  private result: { urls: string[]; types: string[]; allFaces: any; sizes: { width: number, height: number }[]; elements: HTMLImageElement[] };
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
    let res: { [key: string]: any} = {};

    const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({minConfidence: 0.4});

    for (let index = 0; index < _urls.length; index++) {
      const url = _urls[index];
      if (!res[url]) {
        let imgNew = await this.loadImgFromHTTP(url);
        res[url] = await faceapi.detectAllFaces(imgNew, faceDetectionOptions);
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
    let allFaces: any = this.result.allFaces,
        imgs = this.result.elements,
        urls = this.result.urls,
        types = this.result.types;

    if(!allFaces || !imgs || !urls || !types){
      return
    }

    for (let index = 0; index < imgs.length; index++) {
      const img = imgs[index];
      let imgNew = await this.loadImgFromHTTP(urls[index]),
          ctx = this.createCanvas(imgNew);
      let detections = allFaces[urls[index]];

      for (let j = 0; j < detections.length; j++) {
        let box = detections[j]._box;
        ctx.strokeStyle = 'red';
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
    let child = _parent.firstChild;

    while (child !== _parent.lastChild) {
      if (child.nodeType === 1) {
        let exRes = await this.extractBgUrl(child);

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
  };

  async extractBgUrl(_element: Element) {
    let bgStr = window.getComputedStyle(_element).getPropertyValue("background-image");
    if (bgStr !== "none") {
      let res = bgStr.split("(")[1].split(")")[0].replace(/["']/ig, '');
      if (res !== 'url' && !res.match('undefined')) {

        let img: HTMLImageElement = await this.loadImgFromHTTP(res),
            w = img.naturalWidth,
            h = img.naturalHeight;
        if (this.isImgMatch(w, h, res)) {
          return {url: res, img: img};
        }
      }
    }
  };

  getImgElement() {
    let imgs = document.images;

    for (let i = 0; i < imgs.length; i++) {
      let img = imgs[i],
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
    return new Promise<HTMLImageElement>((resolve) => {

      fetch(_url, {method: "GET"}).then(response => {
        response.arrayBuffer().then(blob => {
          let base64 = btoa(
              new Uint8Array(blob)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          let str = 'data:image/png;base64,' + base64;
          let img = this.loadImg(str);
          resolve(img);
        })
      }).catch((e) => {
        console.error('Error:', e);
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
        h = _img.naturalHeight,
        canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2d context is not supported');
    }
    ctx.drawImage(_img, 0, 0, w, h);

    return ctx
  }
}









