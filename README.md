# sharp-pdf

Export images from a PDF file, or generate a PDF file from images.

Base on [sharp](https://www.npmjs.com/package/sharp), [PDF.js](https://www.npmjs.com/package/pdfjs-dist)(for parsing PDFs) and [jsPDF](https://www.npmjs.com/package/jspdf)(for generate PDFs).

## Install

```bash
npm install sharp-pdf
```

## Export images from a PDF file

### `PDF.sharpsFromPdf(src, options?): Promise<ImageData[]>`

- `src` [GetDocumentParameters](https://github.com/mozilla/pdfjs-dist/blob/master/types/src/display/api.d.ts#L190) - String containing the filesystem path to a PDF file, or a [DocumentInitParameters](https://github.com/mozilla/pdfjs-dist/blob/master/types/src/display/api.d.ts#L10) object.
- `options` Object _(optional)_
  - `sharpOptions` Object _(optional)_ - Sharp constructor [options](https://sharp.pixelplumbing.com/api-constructor#parameters).
  - `delay` Number _(optional)_ - Number of milliseconds to delay (setTimeout) after an image is parsed. If you need to show progress on the UI (electron/nwjs), you can use this option to avoid blocking. Default by `-1` (no delay).
  - `workerSrc` Boolean _(optional)_ - Set `GlobalWorkerOptions.workerSrc` to `pdf.worker.entry`. Default by `false`.
  - `handler` (event, data) => void _(optional)_
    - "loading" - PDF file loading progress, data is an object containing `total` number of bytes and `loaded` number of bytes.
    - "loaded" - PDF file loaded, data is an object containing `pages` info.
    - "image" - Image parsing complete, data is the [ImageData](#imagedata).
    - "skip" - Skip an invalid image.
    - "error" - An image parsing error occurs, data is an object containing the `error` info.
    - "done" - All images are parsed, data is an array containing all [ImageData](#imagedata).

Returns `Promise<ImageData[]>` - Resolve with an array of object containing the following info:

#### `ImageData`

- `image` Sharp - Instance of sharp.
- `name` String - Image name.
- `width` Number - Image width in pixels.
- `height` Number - Image height in pixels.
- `channels` Number - Number of channels.
- `size` Number - Total size of image in bytes.
- `pages` Number - Number of pages.
- `pageIndex` Number - Page index.
- `pageImages` Number - Number of images in page.
- `pageImageIndex` Number - Image index in page.

```js
const PDF = require("sharp-pdf");

PDF.sharpsFromPdf("./input.pdf").then((images) => {
  images.forEach(({ image, name, channels }) => {
    const ext = channels > 3 ? ".png" : ".jpg";
    image.toFile(`./${name}${ext}`);
  });
});

// progress
PDF.sharpsFromPdf("./input.pdf", {
  handler(event, data) {
    if (event === "loading") {
      console.log("loading PDF:", (data.loaded / data.total) * 100);
    } else if (event === "loaded") {
      console.log("PDF loaded");
    } else if (event === "image" || event === "skip" || event === "error") {
      console.log("parsing images:", (data.pageIndex / data.pages) * 100);
    } else if (event === "done") {
      console.log("done");
    }
  },
});

// load a password protected PDF
PDF.sharpsFromPdf({
  url: "./input.pdf",
  password: "ssnangua",
});
```

## Generate a PDF file from images

### `PDF.sharpsToPdf(images, output, options?): Promise<Object>`

- `images` Array<Sharp | Object>
  - `image` Sharp - Sharp instance.
  - `options` [ImageOptions](#imageoptions) _(optional)_ - Image options.
- `output` String | { type, options } - The path to write the PDF file to, or an object contains [jsPDF.output(type, options)](http://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#output) arguments.
- `options` Object _(optional)_
  - `pdfOptions` Object _(optional)_ - jsPDF constructor [options](http://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html)
  - `imageOptions` [ImageOptions](#imageoptions) _(optional)_ - Global image options.
  - `autoSize` Boolean _(optional)_ - Set page size to image size. `pdfOptions.format` and `fit` option will not work. Default by `false`.
  - `init` (params) => void _(optional)_
    - `params` Object
      - `doc` [jsPDF](http://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html) - jsPDF instance.
      - `pages` Number - Number of images.
      - `pageWidth` Number - Page width in pixels.
      - `pageHeight` Number - Page height in pixels.

Returns `Promise<Object>` - Resolve with an object containing the PDF file `size` info or PDF document data.

#### `ImageOptions`

- `format` String _(optional)_ - Format of image, e.g. 'JPEG', 'PNG', 'WEBP'.
- `x` Number _(optional)_ - Image x Coordinate in pixels. If omitted, the image will be horizontally centered.
- `y` Number _(optional)_ - Image y Coordinate in pixels. If omitted, the image will be vertically centered.
- `width` Number _(optional)_ - Image width in pixels. If omitted, fill the page if `fit`, otherwise use the image width.
- `height` Number _(optional)_ - Image height in pixels. If omitted, fill the page if `fit`, otherwise use the image height.
- `compression` "NONE" | "FAST" | "MEDIUM" | "SLOW" _(optional)_ - Compression of the generated JPEG. Default by `"NONE"`.
- `rotation` Number _(optional)_ - Rotation of the image in degrees (0-359). Default by `0`.
- `fit` Boolean _(optional)_ - Image fit to page size. Default by `false`.
- `margin` Number _(optional)_ - Image margin (pixels). Default by `0`.
- `handler` (params) => void _(optional)_ -
  - `params` Object
    - `doc` [jsPDF](http://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html) - jsPDF instance.
    - `pages` Number - Number of images.
    - `pageWidth` Number - Page width in pixels.
    - `pageHeight` Number - Page height in pixels.
    - `index` Number - Page index.
    - `image` Sharp - Sharp instance.
    - `options` ImageOptions - Image options.
    - `imageData` Buffer - A buffer containing image data.
    - `format` String - Format of image, e.g. 'JPEG', 'PNG', 'WEBP'.
    - `x` Number - Image x Coordinate in pixels.
    - `y` Number - Image y Coordinate in pixels.
    - `width` Number - Image width in pixels.
    - `height` Number - Image height in pixels.

```js
const fs = require("fs");
const sharp = require("sharp");
const PDF = require("sharp-pdf");

PDF.sharpsToPdf(
  [
    sharp("./image1.jpg"),
    sharp("./image2.jpg"),
    { image: sharp("./image3.jpg"), options: {} },
  ],
  "./output.pdf"
).then(({ size }) => {
  console.log(size);
});

// options
PDF.sharpsToPdf(
  fs
    .readdirSync("./Comic")
    .map((file) => sharp(`./Comic/${file}`).jpeg({ quality: 20 })),
  "./Comic.pdf",
  {
    pdfOptions: {
      format: "b5",
      encryption: {
        userPassword: "ssnangua",
      },
    },
    imageOptions: {
      format: "JPEG",
      compression: "FAST",
      fit: true,
      handler({ index, pages }) {
        console.log(index + 1, "/", pages);
      },
    },
  }
);

// handler
PDF.sharpsToPdf(
  [
    sharp("./image1.jpg"),
    sharp("./image2.jpg"),
    {
      image: sharp("./image3.jpg"),
      options: {
        // override the global handler
        handler() {},
      },
    },
  ],
  "./output.pdf",
  {
    imageOptions: {
      handler({ doc, ...params }) {
        // add page number
        const { index, pageWidth, pageHeight } = params;
        doc.text(`- ${index + 1} -`, pageWidth / 2, pageHeight - 10, {
          align: "center",
          baseline: "bottom",
        });

        // return or resolve with `false`,
        // will skip the default add image operation,
        // and you can add image by yourself.
        const { imageData, format, x, y, width, height } = params;
        doc.addImage(imageData, format, x, y, width, height);
        return false;
        // or
        // return new Promise(resolve => setTimeout(() => resolve(false), 100));
      },
    },
  }
);

// output types
PDF.sharpsToPdf(
  [ sharp("./image1.jpg") ],
  { type: "arraybuffer" }
).then((arraybuffer) => {
  const buffer = Buffer.from(arraybuffer);
  fs.writeFileSync("output.pdf", buffer);
});
```

## Reference

[PDF Export Images](https://www.npmjs.com/package/pdf-export-images)


## Change Log

### 0.1.3

- `sharpsFromPdf()`
    - Added `delay` and `workerSrc` options
    - Added `skip` event
- `sharpsToPdf()`
    - Added `autoSize` option
    - Supported promise handler
    - supported output types