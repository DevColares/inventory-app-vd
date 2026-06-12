import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScan }) => {
  useEffect(() => {
    let html5QrCode = new Html5Qrcode("reader");

    // Get cameras to verify capabilities
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            html5QrCode.start(
              { facingMode: "environment" },
              { fps: 15, qrbox: { width: 280, height: 120 }, aspectRatio: 1.77 },
              (decodedText) => {
                onScan(decodedText);
                html5QrCode.stop();
              },
              (errorMessage) => { /* Ignore errors */ }
            ).catch((err) => {
              console.error("Failed to start scanner", err);
              // Fallback to user if environment fails
              html5QrCode.start(
                { facingMode: "user" },
                { fps: 15, qrbox: { width: 280, height: 120 }, aspectRatio: 1.77 },
                (decodedText) => {
                  onScan(decodedText);
                  html5QrCode.stop();
                },
                (errorMessage) => {}
              ).catch(e => console.error("Critical failure", e));
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
