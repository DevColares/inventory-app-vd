import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScan }) => {
  useEffect(() => {
    let html5QrCode = new Html5Qrcode("reader");

    // Get cameras to verify capabilities
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // Try to find a back camera
            let cameraId = devices[0].id;
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
            if (backCamera) {
                cameraId = backCamera.id;
            }

            html5QrCode.start(
              cameraId, // Use specific camera ID
              { fps: 15, qrbox: { width: 220, height: 80 }, aspectRatio: 1.77 },
              (decodedText) => {
                onScan(decodedText);
                html5QrCode.stop();
              },
              (errorMessage) => { /* Ignore errors */ }
            ).catch((err) => {
              console.error("Failed to start scanner", err);
            });
        }
    }).catch(err => {
        console.error("Error getting cameras", err);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScan]);

  return <div id="reader" className="w-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner bg-slate-900"></div>;
};

export default Scanner;
