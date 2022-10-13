const fs = require("fs");
const sharp = require("sharp");
const { getDocument, OPS } = require("pdfjs-dist/legacy/build/pdf.js");
const { jsPDF } = require("jspdf");

async function sharpsFromPdf(src, options = {}) {
  const { sharpOptions, handler = () => {} } = options;

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
          handler("image", item);
          images.push(item);
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

async function sharpsToPdf(images, fileOut, options = {}) {
  const { pdfOptions: po = {}, imageOptions: io = {}, init } = options;

  // doc
  const doc = new jsPDF({ ...po, unit: "pt" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const pages = images.length;

  // init handler
  init && init({ doc, pages, pageWidth, pageHeight });

  for (let index = 0; index < images.length; index++) {
    let item = images[index];

    // addPage
    if (index > 0) {
      doc.addPage(po.format || "a4", po.orientation || "p");
    }

    if (isSharp(item)) item = { image: item };
    const { image, options: _io = {} } = item;
    if (!isSharp(image)) continue;

    const o = {
      ...io,
      ..._io,
      fit: _io.fit || (io.fit && _io.fit !== false),
    };

    // format
    const format = o.format || (await image.metadata()).format.toUpperCase();
    if (!format) continue;
    if (o.format) image.toFormat(o.format.toLowerCase());

    // imageData
    const { data, info } = await image.toBuffer({ resolveWithObject: true });

    // image width/height
    const scale = o.fit
      ? Math.min(pageWidth / info.width, pageHeight / info.height)
      : 1;
    let width = o.width || info.width * scale;
    let height = o.height || info.height * scale;
    if (o.fit && o.margin) {
      width -= o.margin * 2;
      height -= o.margin * 2;
    }

    // image x/y
    const x = o.x || (pageWidth - width) / 2;
    const y = o.y || (pageHeight - height) / 2;

    // page handler
    const addImage =
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

  // write PDF file
  return doc.save(fileOut, { returnPromise: true }).then(() => {
    return { size: fs.statSync(fileOut).size };
  });
}

module.exports = {
  sharpsFromPdf,
  sharpsToPdf,
};
