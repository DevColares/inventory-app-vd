import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScan }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "user" }, // Forces front camera
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        onScan(decodedText);
        html5QrCode.stop();
      },
      (errorMessage) => {
        // console.log(errorMessage);
      }
    ).catch((err) => {
      console.error("Failed to start scanner", err);
    });

    return () => {
      html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
    };
  }, [onScan]);

  return <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-inner bg-slate-900"></div>;
};

export default Scanner;
