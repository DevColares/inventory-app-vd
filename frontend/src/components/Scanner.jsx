import React, { useEffect, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Howl } from 'howler';

const Scanner = ({ onScan }) => {
  const [error, setError] = useState(null);
  
  // Preload beep sound
  const beep = new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/766/766-preview.mp3'],
    volume: 0.5
  });

  useEffect(() => {
    let html5QrCode = new Html5Qrcode("reader");
    let lastScanTime = 0;

    html5QrCode.start(
      { facingMode: "environment" },
      { 
        fps: 20, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0,
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.QR_CODE
        ]
      },
      (decodedText) => {
        const now = Date.now();
        // Debounce: prevent multiple scans of same code within 1.5s
        if (now - lastScanTime > 1500) {
          beep.play();
          onScan(decodedText);
          lastScanTime = now;
        }
      },
      (errorMessage) => { /* Ignore errors */ }
    ).catch((err) => {
        setError(`Erro: ${err.message || 'Câmera não iniciada'}`);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="w-full">
      {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
      <div id="reader" className="w-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner bg-slate-900"></div>
    </div>
  );
};

export default Scanner;
