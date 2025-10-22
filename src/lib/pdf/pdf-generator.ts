// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/lib/pdf/pdf-generator.test.ts
// TAG-006: PDF Service

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createClient } from '@/lib/supabase/client';

export interface PDFReportOptions {
  start_date: string;
  end_date: string;
  title?: string;
  include_charts?: string[];
}

export interface PDFUploadResult {
  pdf_url: string;
  file_name: string;
  expires_at: string;
}

/**
 * Capture chart element as image
 * @param element - Chart DOM element
 * @returns Base64 image data URL
 */
export async function captureChartImage(element: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart image:', error);
    throw new Error('Failed to capture chart image');
  }
}

/**
 * Generate stats report PDF
 * @param options - Report options
 * @returns PDF as Uint8Array
 */
export async function generateStatsReport(
  options: PDFReportOptions
): Promise<Uint8Array> {
  const { start_date, end_date, title = '교권 침해 통계 리포트', include_charts = [] } = options;

  // Initialize jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Korean font support (optional, requires font file)
  // For now, we'll use default fonts

  // Title
  doc.setFontSize(20);
  doc.text(title, 105, 20, { align: 'center' });

  // Date range
  doc.setFontSize(12);
  doc.text(`Report Period: ${start_date} ~ ${end_date}`, 105, 30, {
    align: 'center',
  });

  // Add content
  let yPosition = 50;

  doc.setFontSize(14);
  doc.text('Overview Statistics', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text('Total Reports: [Data will be fetched]', 20, yPosition);
  yPosition += 7;
  doc.text('Active Consultations: [Data will be fetched]', 20, yPosition);
  yPosition += 7;
  doc.text('Completion Rate: [Data will be fetched]', 20, yPosition);
  yPosition += 15;

  // Add charts if requested
  if (include_charts.length > 0) {
    doc.setFontSize(14);
    doc.text('Charts', 20, yPosition);
    yPosition += 10;

    // Note: Chart images would be added here in real implementation
    // For now, we'll add placeholder text
    include_charts.forEach((chartType) => {
      doc.setFontSize(10);
      doc.text(`[${chartType} chart would be here]`, 20, yPosition);
      yPosition += 10;

      // Add new page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toISOString().split('T')[0]}`,
      105,
      287,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
  }

  // Convert to Uint8Array
  const pdfData = doc.output('arraybuffer');
  return new Uint8Array(pdfData);
}

/**
 * Upload PDF to Supabase Storage
 * @param pdfData - PDF as Uint8Array
 * @param fileName - File name
 * @returns Upload result with URL
 */
export async function uploadPDFToStorage(
  pdfData: Uint8Array,
  fileName: string
): Promise<PDFUploadResult> {
  const supabase = createClient();

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(`stats/${fileName}`, pdfData, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading PDF:', error);
    throw new Error('Failed to upload PDF to storage');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('reports')
    .getPublicUrl(`stats/${fileName}`);

  // Calculate expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  return {
    pdf_url: urlData.publicUrl,
    file_name: fileName,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Generate report file name
 * @param startDate - Start date
 * @param endDate - End date
 * @returns File name
 */
export function generateReportFileName(
  startDate: string,
  endDate: string
): string {
  const timestamp = Date.now();
  return `stats-report-${startDate}-${endDate}-${timestamp}.pdf`;
}
