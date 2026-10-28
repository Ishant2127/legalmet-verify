import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { CertificateView } from "@/lib/certificate-view";
import { formatDate } from "@/lib/utils";

function short(value: string, head = 42, tail = 16) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export async function downloadCertificatePdf(view: CertificateView) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = `${origin}/verify?cert=${encodeURIComponent(view.number)}`;

  const qrData = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 320,
    color: { dark: "#151515", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(252, 249, 242);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setDrawColor(196, 151, 63);
  doc.setLineWidth(2.5);
  doc.rect(26, 26, pageWidth - 52, pageHeight - 52);

  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.7);
  doc.rect(34, 34, pageWidth - 68, pageHeight - 68);

  doc.setFillColor(20, 20, 20);
  doc.rect(34, 34, pageWidth - 68, 8, "F");

  doc.setTextColor(28, 28, 28);
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 62, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "DIRECTORATE OF LEGAL METROLOGY · MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION",
    pageWidth / 2,
    76,
    { align: "center" },
  );

  doc.setFont("times", "bold");
  doc.setFontSize(25);
  doc.text("CERTIFICATE OF VERIFICATION", pageWidth / 2, 108, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 88, 62);
  doc.text("ISSUED UNDER SECTION 24 · LEGAL METROLOGY ACT, 2009", pageWidth / 2, 123, {
    align: "center",
  });

  doc.setDrawColor(196, 151, 63);
  doc.setLineWidth(0.8);
  doc.line(48, 136, pageWidth - 48, 136);

  const statusText =
    view.state === "valid"
      ? "VALID"
      : view.state === "expiring"
        ? "EXPIRING SOON"
        : view.state === "expired"
          ? "EXPIRED"
          : "REVOKED";

  doc.setFillColor(
    view.state === "valid" ? 230 : view.state === "revoked" ? 250 : view.state === "expired" ? 238 : 253,
    view.state === "valid" ? 246 : view.state === "revoked" ? 230 : view.state === "expired" ? 238 : 244,
    view.state === "valid" ? 238 : view.state === "revoked" ? 230 : view.state === "expired" ? 238 : 226,
  );
  doc.roundedRect(pageWidth - 168, 52, 112, 24, 12, 12, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(statusText, pageWidth - 112, 68, { align: "center" });

  let y = 164;
  const leftX = 58;
  const columnTwo = 420;

  function field(label: string, value: string, x: number, width = 320) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 105, 76);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("times", "normal");
    doc.setFontSize(13);
    doc.setTextColor(24, 24, 24);
    const lines = doc.splitTextToSize(value, width);
    doc.text(lines.slice(0, 2), x, y + 16);
    y += 42;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 105, 76);
  doc.text("CERTIFICATE REGISTRATION NO.", leftX, y);
  doc.setFont("courier", "bold");
  doc.setFontSize(17);
  doc.setTextColor(44, 44, 44);
  doc.text(view.number, leftX, y + 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 105, 76);
  doc.text("DATE OF ISSUE", columnTwo, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 24);
  doc.text(formatDate(view.issuedAt), columnTwo, y + 18);

  y += 52;
  field("Instrument description", view.instrumentName, leftX, 330);
  field("Instrument category", view.instrumentType, columnTwo, 300);
  field("Make & model", `${view.manufacturer} · ${view.model}`, leftX, 330);
  field("Serial number", view.serial, columnTwo, 300);
  if (view.capacity || view.measurementUnit) {
    const capacityDisplay = [
      view.capacity,
      view.measurementUnit ? `(${view.measurementUnit})` : "",
    ]
      .filter(Boolean)
      .join(" ");
    field("Capacity / measurement unit", capacityDisplay, leftX, 330);
  }
  field("Registered holder", view.ownerName, leftX, 330);
  field("Establishment", view.ownerOrganization, columnTwo, 300);
  field("District / jurisdiction", view.district, leftX, 330);
  field("Valid until", formatDate(view.validUntil), columnTwo, 300);

  doc.setDrawColor(210, 200, 180);
  doc.line(48, pageHeight - 164, pageWidth - 48, pageHeight - 164);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 105, 76);
  doc.text("CRYPTOGRAPHIC SEAL · SHA-256", leftX, pageHeight - 144);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(short(view.hash, 70, 30), leftX, pageHeight - 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    `Seal version ${view.sealVersion} · Issued by ${view.issuedBy}`,
    leftX,
    pageHeight - 116,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(120, 105, 76);
  doc.text("PUBLIC VERIFICATION", leftX, pageHeight - 96);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(verifyUrl, leftX, pageHeight - 83);

  doc.addImage(qrData, "PNG", pageWidth - 164, pageHeight - 166, 106, 106);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(120, 105, 76);
  doc.text("SCAN TO VERIFY", pageWidth - 111, pageHeight - 52, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 105, 76);
  doc.text(
    "This certificate is a digitally generated record. Its authenticity is established by recomputing the seal above.",
    48,
    pageHeight - 44,
    { maxWidth: 470 },
  );

  if (view.revocationReason) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(170, 40, 40);
    doc.text(`REVOCATION: ${view.revocationReason}`, 48, pageHeight - 30, {
      maxWidth: 520,
    });
  }

  doc.save(`${view.number}.pdf`);
}
