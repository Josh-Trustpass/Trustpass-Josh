import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { generateQRCode } from "@/lib/qr-utils";
import type { Employee } from "@shared/schema";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export default function QRCodeModal({ isOpen, onClose, employee }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: urlData } = useQuery({
    queryKey: [`/api/employees/${employee.id}/qr-url`],
    enabled: isOpen && !!employee.id,
  });

  useEffect(() => {
    if (canvasRef.current && urlData?.verificationUrl) {
      generateQRCode(canvasRef.current, urlData.verificationUrl);
    }
  }, [urlData?.verificationUrl, isOpen]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `QR-${employee.employeeId}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL();
        
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${employee.fullName}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 20px;
                }
                .qr-container {
                  border: 2px solid #ccc;
                  border-radius: 10px;
                  padding: 20px;
                  margin: 20px auto;
                  width: fit-content;
                }
                img {
                  display: block;
                  margin: 0 auto;
                }
                h2 {
                  margin: 10px 0;
                  color: #333;
                }
                p {
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h2>${employee.fullName}</h2>
                <p>Employee ID: ${employee.employeeId}</p>
                <img src="${dataUrl}" alt="QR Code" />
                <p>MCS Cleaning & Maintenance Services</p>
                <p style="font-size: 12px;">Scan to verify employment status</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Employee QR Code</DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{employee.fullName}</h3>
            <p className="text-sm text-gray-500">{employee.employeeId}</p>
          </div>

          {/* QR Code Display */}
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
            <canvas ref={canvasRef} className="mx-auto" />
          </div>

          {/* QR Code URL */}
          {urlData?.verificationUrl && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Verification URL:</p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {urlData.verificationUrl}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button onClick={handleDownload} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint} variant="secondary" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
