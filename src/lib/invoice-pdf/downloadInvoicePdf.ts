import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface DownloadInvoicePdfOptions {
  element: HTMLElement | null;
  fileName: string;
}

export async function downloadInvoicePdf({
  element,
  fileName,
}: DownloadInvoicePdfOptions) {
  if (!element) {
    throw new Error("Invoice template is not ready yet.");
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageProperties = pdf.getImageProperties(imageData);
  const imageWidth = pageWidth;
  const imageHeight = (imageProperties.height * imageWidth) / imageProperties.width;

  let renderWidth = imageWidth;
  let renderHeight = imageHeight;

  if (imageHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = (imageProperties.width * renderHeight) / imageProperties.height;
  }

  const offsetX = (pageWidth - renderWidth) / 2;
  pdf.addImage(imageData, "PNG", offsetX, 0, renderWidth, renderHeight, undefined, "FAST");
  pdf.save(fileName);
}
