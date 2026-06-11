declare module "pdf-parse" {
  interface PdfResult {
    text: string;
  }

  export default function pdf(data: Buffer): Promise<PdfResult>;
}
