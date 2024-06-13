class ImageAll {
  constructor(_detectAllFacesFn) {
    this.detectAllFacesFn = _detectAllFacesFn;
    this.result = {
      elements: [],
      urls: [],
      types: [],
      sizes: [],
      allFaces: {}
    }
  };

  async run(_dom) {
    await this.get(_dom);
    this.updateFacesResult(await this.detectAllFacesFn(this.result.urls));
    await this.exChangeImages();
  };

  updateFacesResult(_allFaces) {
    this.result.allFaces = _allFaces;
  };

  async get(_parent) {
    let that = this;
    that.getImgElement();

    await that.traversal(_parent);
  };

  async exChangeImages() {
    let that = this;
    let allFaces = this.result.allFaces;

    let imgs = this.result.elements,
        urls = this.result.urls,
        types = this.result.types;

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
        img.style["background-image"] = "url(" + ctx.canvas.toDataURL() + ")";
      }

    }
  };

  async traversal(_parent) {
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

  async extractBgUrl(_element) {
    let that = this;
    let bgStr = window.getComputedStyle(_element)["background-image"];
    if (bgStr !== "none") {
      let res = bgStr.split("(")[1].split(")")[0].replace(/["']/ig, '');
      if (res !== 'url' && !res.match('undefined')) {

        let img = await that.loadImgFromHTTP(res);
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

  isImgMatch(_w, _h, _url) {
    return !!(_w !== 0 & _h !== 0 & _w > 10 && !_url.match('.svg'));
  };

  pushResult(_e, _u, _t, _s) {

    this.result.urls.push(_u);
    this.result.elements.push(_e);
    this.result.types.push(_t);
    this.result.sizes.push(_s);

  };

  async loadImgFromHTTP(_url) {
    let that = this;

    return new Promise((resolve) => {

      let url = _url;
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'arraybuffer';
      xhr.open("GET", url, true);
      xhr.send();

      xhr.onload = async function () {
        let blob = this.response;
        let base64 = btoa(
            new Uint8Array(blob)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        //btoa(String.fromCharCode.apply(null, new Uint8Array(blob)))
        let str = 'data:image/png;base64,' + base64;
        let img = await that.loadImg(str);
        resolve(img);
      };
    });

  };

  async loadImg(_url) {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = _url;
      img.onload = function () {
        resolve(img);
      };
    });
  };

  createCanvas(_img) {
    let w = _img.naturalWidth,
        h = _img.naturalHeight;

    let c = document.createElement('canvas');
    c.width = w;
    c.height = h;

    let ctx = c.getContext('2d');
    ctx.drawImage(_img, 0, 0, w, h);

    return ctx
  };
}









