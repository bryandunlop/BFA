"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCaptureProps {
    onCapture: (imageData: string) => void;
}

export function PhotoCapture({ onCapture }: PhotoCaptureProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPreview(result);
        };
        reader.readAsDataURL(file);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsCapturing(true);
        } catch (err) {
            console.error("Failed to access camera:", err);
            // Fallback to file upload
            fileInputRef.current?.click();
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setPreview(imageData);
        stopCamera();
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsCapturing(false);
    };

    const clearPreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const submitPhoto = () => {
        if (preview) {
            onCapture(preview);
        }
    };

    if (isCapturing) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        className="w-full"
                        autoPlay
                        playsInline
                        muted
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={capturePhoto}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    if (preview) {
        return (
            <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden">
                    <img src={preview} alt="Food preview" className="w-full" />
                    <button
                        onClick={clearPreview}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
                <Button
                    onClick={submitPhoto}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                    Analyze Food
                </Button>
            </div>
        );
    }

    return (
        <div className="text-center py-8 space-y-4">
            <Camera className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-muted-foreground">
                Take a photo of your food and I&apos;ll estimate the macros
            </p>
            <div className="flex gap-2 justify-center">
                <Button
                    onClick={startCamera}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                </Button>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
