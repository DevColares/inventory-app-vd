import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Howl } from 'howler';

const Scanner = ({ onScan, useDelay = false }) => {
  const [error, setError] = useState(null);
  const isProcessing = useRef(false);
  
  // Preload authentic barcode scanner beep sound
  const beep = new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // High pitched short beep
    volume: 0.6
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

        if (useDelay) {
          if (isProcessing.current) return;
          isProcessing.current = true;
          beep.play();
          
          // Delay para modo Auditoria (Preços e Proves)
          setTimeout(() => {
            onScan(decodedText);
            html5QrCode.stop().catch(err => console.error(err));
          }, 500);
        } else {
          // Debounce: prevent multiple scans of same code within 1.5s
          if (now - lastScanTime > 1500) {
            beep.play();
            onScan(decodedText);
            lastScanTime = now;
          }
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
  }, [onScan, useDelay]);

  return (
    <div className="w-full">
      {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
      <div id="reader" className="w-full min-h-[300px] rounded-2xl overflow-hidden shadow-inner bg-slate-900"></div>
    </div>
  );
};

export default Scanner;
