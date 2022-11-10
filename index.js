const fs = require("fs");
const sharp = require("sharp");
const {
  getDocument,
  OPS,
  GlobalWorkerOptions,
} = require("pdfjs-dist/legacy/build/pdf.js");
const pdfjsWorker = require("pdfjs-dist/legacy/build/pdf.worker.entry");
const { jsPDF } = require("jspdf");

const doDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sharpsFromPdf(src, options = {}) {
  const { sharpOptions, delay = -1, handler = () => {} } = options;

  GlobalWorkerOptions.workerSrc = options.workerSrc ? pdfjsWorker : "";

  // doc
  const docTask = getDocument(src);
  docTask.onProgress = ({ loaded, total }) => {
    if (loaded <= total) handler("loading", { loaded, total });
  };
  const doc = await docTask.promise;
  const pages = doc._pdfInfo.numPages;
  handler("loaded", { pages });

  // images
  const images = [];
  for (let p = 0; p < pages; p++) {
    const page = await doc.getPage(p + 1);
    const ops = await page.getOperatorList();
    const pageImages = ops.fnArray.length;

    for (let i = 0; i < pageImages; i++) {
      try {
        if (
          ops.fnArray[i] === OPS.paintJpegXObject ||
          ops.fnArray[i] === OPS.paintImageXObject ||
          ops.fnArray[i] === OPS.paintInlineImageXObject
        ) {
          const name = ops.argsArray[i][0];
          const img = await page.objs.get(name);
          const { width, height, kind } = img;
          const size = img.data.length;
          const channels = size / width / height;
          const image = sharp(img.data, {
            ...sharpOptions,
            raw: { width, height, channels },
          });
          const item = {
            name,
            kind,
            width,
            height,
            channels,
            size,
            image,
            pages,
            pageIndex: p,
            pageImages,
            pageImageIndex: i,
          };
          images.push(item);
          handler("image", item);
          if (delay >= 0) await doDelay(delay);
        } else {
          handler("skip", {
            pages,
            pageIndex: p,
            pageImages,
            pageImageIndex: i,
          });
        }
      } catch (error) {
        handler("error", {
          pages,
          pageIndex: p,
          pageImages,
          pageImageIndex: i,
          error,
        });
      }
    }
  }
  handler("done", images);
  return images;
}

function isSharp(image) {
  return image && typeof image.metadata === "function";
}

async function sharpsToPdf(images, output, options = {}) {
  const {
    pdfOptions: po = {},
    imageOptions: io = {},
    autoSize = false,
    init,
  } = options;

  const doc = new jsPDF({ ...po, unit: "pt" });
  // init handler
  init && init({ doc, pages, pageWidth, pageHeight });

  let pageWidth = doc.internal.pageSize.getWidth();
  let pageHeight = doc.internal.pageSize.getHeight();

  const pages = images.length;

  doc.deletePage(1);

  for (let index = 0; index < images.length; index++) {
    let item = images[index];
    if (isSharp(item)) item = { image: item };
    const { image, options: _io = {} } = item;
    if (!isSharp(image)) continue;

    const o = { ...io, ..._io };
    const fit = _io.fit || (io.fit && _io.fit !== false);
    const margin = o.margin || 0;

    // imageData
    const { data, info } = await image.toBuffer({ resolveWithObject: true });

    // addPage
    const pageFormat = autoSize
      ? [info.width + margin, info.height + margin]
      : po.format || "a4";
    const orientation = autoSize
      ? info.width > info.height
        ? "l"
        : "p"
      : po.orientation || "p";
    doc.addPage(pageFormat, orientation);

    // page width/height
    if (autoSize) {
      pageWidth = info.width + margin;
      pageHeight = info.height + margin;
    }

    // image format
    const format = o.format || (await image.metadata()).format.toUpperCase();
    if (!format) continue;
    if (o.format) image.toFormat(o.format.toLowerCase());

    // image width/height
    let width, height;
    if (autoSize) {
      width = info.width;
      height = info.height;
    } else {
      const scale = fit
        ? Math.min(pageWidth / info.width, pageHeight / info.height)
        : 1;
      width = o.width || info.width * scale;
      height = o.height || info.height * scale;
      if (fit && o.margin) {
        width -= o.margin * 2;
        height -= o.margin * 2;
      }
    }

    // image x/y
    const x = o.x || (pageWidth - width) / 2;
    const y = o.y || (pageHeight - height) / 2;

    // page handler
    let addImage =
      o.handler &&
      o.handler({
        doc,
        pages,
        pageWidth,
        pageHeight,
        index,
        image,
        options: o,
        imageData: data,
        format,
        x,
        y,
        width,
        height,
      });
    if (addImage instanceof Promise) addImage = await addImage;

    if (addImage !== false) {
      doc.addImage(
        data,
        format,
        x,
        y,
        width,
        height,
        o.alias,
        o.compression || "NONE",
        o.rotation || 0
      );
    }
  }

  if (typeof output === "string") {
    // write PDF file
    // return doc.save(output, { returnPromise: true }).then(() => {
    //   return { size: fs.statSync(output).size };
    // });
    const buffer = Buffer.from(doc.output("arraybuffer"));
    return new Promise((resolve, reject) => {
      fs.writeFile(output, buffer, (err) => {
        if (err) reject(err);
        else resolve({ size: buffer.length });
      });
    });
  } else if (typeof output?.type === "string") {
    return doc.output(output.type, output.options);
  } else {
    return doc.output();
  }
}

module.exports = {
  sharpsFromPdf,
  sharpsToPdf,
};
