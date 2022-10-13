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
 * Exports images from a PDF file
 */
export declare function sharpsFromPdf(
  src: GetDocumentParameters,
  options?: {
    sharpOptions?: SharpOptions;
    handler?: (
      event: "loading" | "loaded" | "image" | "error" | "done",
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
  fileOut: string,
  options?: {
    pdfOptions?: jsPDFOptions;
    imageOptions?: ImageOptions;
    init?: (params: InitParams) => void;
  }
): Promise<{ size: number }>;
