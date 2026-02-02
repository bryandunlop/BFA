"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, XCircle, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onError?: (error: string) => void;
}

export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<ReturnType<typeof import("html5-qrcode").Html5Qrcode.prototype.start> | null>(null);
    const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

    const stopScanning = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error("Failed to stop scanner:", err);
            }
        }
        setIsScanning(false);
    }, []);

    const startScanning = useCallback(async () => {
        setIsScanning(true);
        setError(null);

        // Small delay to ensure the container div is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Dynamic import to avoid SSR issues
            const { Html5Qrcode } = await import("html5-qrcode");

            const scanner = new Html5Qrcode("barcode-scanner-container");
            html5QrCodeRef.current = scanner;

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

            setPermissionDenied(false);
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setIsScanning(false);

            const errorMessage = err instanceof Error ? err.message : "Unknown error";

            if (errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError")) {
                setPermissionDenied(true);
                onError?.("Camera access denied. Please allow camera permissions.");
            } else {
                setError(errorMessage);
                onError?.(errorMessage);
            }
        }
    }, [onScan, onError, stopScanning]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
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
                <Button
                    variant="outline"
                    onClick={() => {
                        setPermissionDenied(false);
                        startScanning();
                    }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 space-y-4">
                <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                <p className="text-muted-foreground">
                    Error: {error}
                </p>
                <Button
                    variant="outline"
                    onClick={() => {
                        setError(null);
                        startScanning();
                    }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {!isScanning ? (
                <div className="text-center py-8 space-y-4">
                    <ScanBarcode className="w-12 h-12 text-emerald-500 mx-auto" />
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
                        className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black"
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
