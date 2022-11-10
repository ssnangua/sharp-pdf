import { Sharp, SharpOptions } from "sharp";
import { jsPDF, jsPDFOptions } from "jspdf";
import { GetDocumentParameters } from "pdfjs-dist/types/src/display/api";

export declare interface ImageData {
  image: Sharp;
  name: String;
  width: Number;
  height: Number;
  channels: Number;
  kind: Number;
  size: Number;
  pages: Number;
  pageIndex: Number;
  pageImages: Number;
  pageImageIndex: Number;
}

/**
 * Export images from a PDF file
 */
export declare function sharpsFromPdf(
  src: GetDocumentParameters,
  options?: {
    sharpOptions?: SharpOptions;
    delay?: Number;
    workerSrc?: Boolean;
    handler?: (
      event: "loading" | "loaded" | "image" | "skip" | "error" | "done",
      data: any
    ) => void;
  }
): Promise<ImageData[]>;

export declare interface InitParams {
  doc: jsPDF;
  pages: Number;
  pageWidth: Number;
  pageHeight: Number;
}

export declare interface PageParams {
  doc: jsPDF;
  pages: Number;
  pageWidth: Number;
  pageHeight: Number;
  index: Number;
  image: Sharp;
  options: ImageOptions;
  imageData: Buffer;
  format: String;
  x: Number;
  y: Number;
  width: Number;
  height: Number;
}

export declare interface ImageOptions {
  format?: String;
  x?: Number;
  y?: Number;
  width?: Number;
  height?: Number;
  alias?: String;
  compression?: "NONE" | "FAST" | "MEDIUM" | "SLOW";
  rotation?: Number;
  fit?: Boolean;
  margin?: Number;
  handler?: (params: PageParams) => void;
}

export declare type OutputTypes =
  | String
  | { type: "arraybuffer" }
  | { type: "blob" }
  | { type: "bloburi" | "bloburl" }
  | { type: "datauristring" | "dataurlstring"; options?: { filename?: string } }
  | {
      type: "pdfobjectnewwindow" | "pdfjsnewwindow" | "dataurlnewwindow";
      options?: { filename?: string };
    }
  | { type: "dataurl" | "datauri"; options?: { filename?: string } }
  | undefined
  | null;

/**
 * Generate a PDF file from images
 */
export declare function sharpsToPdf(
  images: Array<
    | Sharp
    | {
        image: Sharp;
        options?: ImageOptions;
      }
  >,
  output: OutputTypes,
  options?: {
    pdfOptions?: jsPDFOptions;
    imageOptions?: ImageOptions;
    autoSize?: Boolean;
    init?: (params: InitParams) => void;
  }
): Promise<{ size: number }>;
