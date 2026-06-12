import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScan }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    let html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: { exact: "environment" } },
      { fps: 10, qrbox: { width: 220, height: 80 }, aspectRatio: 1.77 },
      (decodedText) => {
        onScan(decodedText);
        html5QrCode.stop();
      },
      (errorMessage) => { /* Ignore errors */ }
    ).catch((err) => {
      // If environment fails, try just 'environment' without exact
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 80 }, aspectRatio: 1.77 },
        (decodedText) => {
          onScan(decodedText);
          html5QrCode.stop();
        },
        (errorMessage) => { /* Ignore errors */ }
      ).catch((err2) => {
        setError(`Erro ao iniciar câmera: ${err2.message || 'Câmera traseira não encontrada'}`);
        console.error("Critical failure", err2);
      });
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
