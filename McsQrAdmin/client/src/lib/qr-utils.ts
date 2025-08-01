import QRCode from 'qrcode';

// QR Code generation utilities using the qrcode npm package
export function generateQRCode(canvas: HTMLCanvasElement, text: string): void {
  QRCode.toCanvas(canvas, text, {
    width: 200,
    margin: 2,
    color: {
      dark: '#16A34A', // Green color matching MCS theme
      light: '#FFFFFF'
    }
  }).catch((error: any) => {
    console.error('QR Code generation failed:', error);
    // Fallback: Draw a placeholder if QR code generation fails
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 200;
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', 100, 90);
      ctx.fillText('Error Loading', 100, 110);
    }
  });
}

// No need for manual library loading with npm package
export function loadQRCodeLibrary(): Promise<void> {
  return Promise.resolve();
}
