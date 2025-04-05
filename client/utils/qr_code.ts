import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';

export default function downloadQRCode (serialNumber: string, itemId: string) {
  // Create a temporary canvas
  const canvas = document.createElement('canvas');
  const qrSize = 256;
  
  // Create QR code directly on the canvas
  const qr = (
    <QRCodeCanvas
      value={`http://localhost:8000/${itemId}/${serialNumber}`}
      size={qrSize}
      level="H"
    />
  );
  
  // Render the QR code to canvas
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(qr);
  
  // Wait for rendering to complete
  setTimeout(() => {
    const renderedCanvas = container.querySelector('canvas');
    if (renderedCanvas) {
      // Create download link
      const link = document.createElement('a');
      link.download = `QR-${itemId}-${serialNumber}.png`;
      link.href = renderedCanvas.toDataURL('image/png');
      link.click();
    }
    
    // Clean up
    root.unmount();
    document.body.removeChild(container);
  }, 100);
};