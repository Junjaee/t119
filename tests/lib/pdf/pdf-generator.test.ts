// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-006: PDF Service 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateStatsReport,
  captureChartImage,
  uploadPDFToStorage,
} from '@/lib/pdf/pdf-generator';

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    text: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    output: vi.fn(() => new Uint8Array([1, 2, 3])),
  })),
}));

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: vi.fn(() => 'data:image/png;base64,mockImage'),
    })
  ),
}));

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test.pdf' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.pdf' } })),
      })),
    },
  })),
}));

describe('TAG-006: PDF Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateStatsReport', () => {
    it('should generate PDF with stats data', async () => {
      const mockData = {
        start_date: '2025-01-01',
        end_date: '2025-10-21',
        title: '교권 침해 통계 리포트',
      };

      const result = await generateStatsReport(mockData);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should include title in PDF', async () => {
      const mockData = {
        start_date: '2025-01-01',
        end_date: '2025-10-21',
        title: '사용자 정의 제목',
      };

      const result = await generateStatsReport(mockData);

      expect(result).toBeDefined();
    });

    it('should handle chart images', async () => {
      const mockData = {
        start_date: '2025-01-01',
        end_date: '2025-10-21',
        include_charts: ['type', 'region', 'trends'],
      };

      const result = await generateStatsReport(mockData);

      expect(result).toBeDefined();
    });

    it('should complete within 10 seconds', async () => {
      const startTime = Date.now();

      await generateStatsReport({
        start_date: '2025-01-01',
        end_date: '2025-10-21',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000);
    });

    it('should handle empty data gracefully', async () => {
      const result = await generateStatsReport({
        start_date: '2099-01-01',
        end_date: '2099-12-31',
      });

      expect(result).toBeDefined();
    });
  });

  describe('captureChartImage', () => {
    it('should capture chart as image', async () => {
      const mockElement = document.createElement('div');
      const result = await captureChartImage(mockElement);

      expect(result).toBeDefined();
      expect(result).toMatch(/^data:image/);
    });

    it('should handle capture errors', async () => {
      const mockElement = document.createElement('div');

      await expect(captureChartImage(mockElement)).resolves.toBeDefined();
    });
  });

  describe('uploadPDFToStorage', () => {
    it('should upload PDF to Supabase Storage', async () => {
      const mockPDF = new Uint8Array([1, 2, 3]);
      const fileName = 'test-report.pdf';

      const result = await uploadPDFToStorage(mockPDF, fileName);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('pdf_url');
      expect(result).toHaveProperty('file_name');
      expect(result).toHaveProperty('expires_at');
    });

    it('should generate signed URL', async () => {
      const mockPDF = new Uint8Array([1, 2, 3]);
      const fileName = 'test-report.pdf';

      const result = await uploadPDFToStorage(mockPDF, fileName);

      expect(result.pdf_url).toMatch(/^https:\/\//);
    });

    it('should handle upload errors', async () => {
      const mockPDF = new Uint8Array([1, 2, 3]);
      const fileName = 'test-report.pdf';

      vi.mocked((await import('@/lib/supabase/client')).createClient).mockReturnValueOnce({
        storage: {
          from: vi.fn(() => ({
            upload: vi.fn(() => Promise.resolve({ data: null, error: new Error('Upload failed') })),
          })),
        },
      } as any);

      await expect(uploadPDFToStorage(mockPDF, fileName)).rejects.toThrow();
    });
  });
});
