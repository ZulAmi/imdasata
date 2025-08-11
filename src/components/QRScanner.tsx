/**
 * QR Code Scanner for Gamification Rewards
 * Allows scanning and validating QR codes for reward redemption
 */

import React, { useState, useEffect, useRef } from 'react';
import { gamificationSystem } from '../lib/gamification-system';

interface QRScannerProps {
  onScanSuccess?: (redemptionData: any) => void;
  onScanError?: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isOpen,
  onClose
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          scanQRCode();
        };
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      onScanError?.('Camera access denied. Please use manual input.');
      setShowManualInput(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // In a real implementation, you would use a QR code detection library like jsQR
    // For this demo, we'll simulate QR code detection
    setTimeout(() => {
      if (isScanning) {
        scanQRCode(); // Continue scanning
      }
    }, 100);
  };

  const validateQRCode = async (qrData: string) => {
    try {
      const result = await gamificationSystem.validateQRRedemption(qrData);
      setValidationResult(result);
      
      if (result.valid) {
        onScanSuccess?.(result);
      } else {
        onScanError?.(result.message);
      }
    } catch (error) {
      onScanError?.('Invalid QR code format');
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      validateQRCode(manualCode.trim());
    }
  };

  const completeRedemption = async () => {
    if (validationResult?.redemption) {
      const success = gamificationSystem.completeQRRedemption(
        validationResult.redemption.id,
        'Manual Scanner'
      );
      
      if (success) {
        alert('Reward successfully redeemed!');
        onClose();
      } else {
        alert('Failed to complete redemption');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scan QR Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {!showManualInput ? (
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg border"
                style={{ maxHeight: '300px' }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* QR Code Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  isScanning
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </button>
              
              <button
                onClick={() => setShowManualInput(true)}
                className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Manual Input
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter QR Code Data
              </label>
              <textarea
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Paste or type the QR code data here..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Validate Code
              </button>
              
              <button
                onClick={() => setShowManualInput(false)}
                className="py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Back to Camera
              </button>
            </div>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`font-medium ${
              validationResult.valid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.message}
            </div>
            
            {validationResult.valid && validationResult.redemption && (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-green-700">
                  <strong>Redemption ID:</strong> {validationResult.redemption.id}
                </div>
                <div className="text-sm text-green-700">
                  <strong>User ID:</strong> {validationResult.redemption.userId}
                </div>
                <div className="text-sm text-green-700">
                  <strong>Expires:</strong> {new Date(validationResult.redemption.expiresAt).toLocaleDateString()}
                </div>
                
                <button
                  onClick={completeRedemption}
                  className="w-full mt-3 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Complete Redemption
                </button>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-600">
          <p>
            📱 Position the QR code within the frame and ensure good lighting for best results.
            If camera scanning doesn't work, use the manual input option.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
