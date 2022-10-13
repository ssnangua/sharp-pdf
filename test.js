const fs = require("fs");
const sharp = require("sharp");
const PDF = require("./index");

if (!fs.existsSync("./output")) fs.mkdirSync("./output");

/**
 * Exports images from a PDF file
 */
PDF.sharpsFromPdf("./input.pdf", {
  sharpOptions: {},
  handler(event, data) {
    if (event === "loading") {
      console.log("loading PDF:", (data.loaded / data.total) * 100);
    } else if (event === "loaded") {
      console.log("PDF loaded");
    } else if (event === "image" || event === "error") {
      console.log("parsing images:", (data.pageIndex / data.pages) * 100);
    } else if (event === "done") {
      console.log("done");
    }
  },
}).then((images) => {
  images.forEach(({ image, channels, name }) => {
    const ext = channels > 3 ? ".png" : ".jpg";
    image.toFile(`./output/${name}${ext}`);
  });
});

/**
 * Generate a PDF file from images
 */
PDF.sharpsToPdf(
  [
    {
      image: sharp("./image1.png"),
      options: { fit: false, handler() {} },
    },
    sharp("./image2.jpg"),
  ],
  "./output/output.pdf",
  {
    pdfOptions: {
      format: "b5",
      // encryption: {
      //   userPassword: "ssnangua",
      // },
    },
    imageOptions: {
      fit: true,
      margin: 20,
      handler({ doc, ...params }) {
        const { imageData, format, x, y, width, height } = params;
        doc.addImage(imageData, format, x, y, width, height);

        const { index, pageWidth, pageHeight } = params;
        doc.text(`- ${index + 1} -`, pageWidth / 2, pageHeight - 10, {
          align: "center",
          baseline: "bottom",
        });
        return false;
      },
    },
    // init({ doc, ...params }) {
    //   console.log("init", params);
    // },
  }
).then(({ size }) => {
  console.log(size);
});
