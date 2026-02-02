"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const startScanning = async () => {
        if (!containerRef.current) return;

        try {
            const scanner = new Html5Qrcode("barcode-scanner-container");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.5,
                },
                (decodedText) => {
                    // Successfully scanned
                    stopScanning();
                    onScan(decodedText);
                },
                () => {
                    // Ignore scan failures (expected while searching)
                }
            );

            setIsScanning(true);
            setPermissionDenied(false);
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setPermissionDenied(true);
            onError?.("Camera access denied. Please allow camera permissions.");
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
        setIsScanning(false);
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    if (permissionDenied) {
        return (
            <div className="text-center py-8 space-y-4">
                <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                <p className="text-muted-foreground">
                    Camera access denied. Please enable camera permissions in your browser settings.
                </p>
                <Button variant="outline" onClick={() => setPermissionDenied(false)}>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!isScanning ? (
                <div className="text-center py-8 space-y-4">
                    <Camera className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-muted-foreground">
                        Scan food product barcodes to auto-fill nutrition info
                    </p>
                    <Button
                        onClick={startScanning}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanner
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div
                        id="barcode-scanner-container"
                        ref={containerRef}
                        className="w-full rounded-lg overflow-hidden"
                    />
                    <Button
                        variant="outline"
                        onClick={stopScanning}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}
