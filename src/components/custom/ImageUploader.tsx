'use client'
import { uploadToStrapi } from "@/services/upload";
import React, { useState } from "react";
import Button from "./Button";
import { FaXmark } from "react-icons/fa6";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTranslations } from "next-intl";

const ImageUploader = ({setImageIds, disabled}: {setImageIds: (ids: number[]) => void, disabled: boolean}) => {
    const t = useTranslations('Custom.ImageUploader');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // Handle file select
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

        // Generate previews
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

        setFiles((prev) => [...prev, ...newFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
    };

    // Remove file
    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);

        // Free memory
        URL.revokeObjectURL(previews[index]);

        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
    };

    // Upload files
    const handleUpload = async () => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            setUploading(true);
            const res = await uploadToStrapi(files);
            setImageIds(res.map((item) => item.id));
            // Reset
            setFiles([]);
            setPreviews([]);
            toast.success(t('toasts.uploadSuccess'))
        } catch (err) {
            console.error("Upload error:", err);
            toast.error(t('toasts.uploadFailed'))
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
                disabled={uploading || disabled}
            />
            <label
                htmlFor="fileInput"
                className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer"
            >
                {t('selectImages')}
            </label>

            <div className="grid grid-cols-3 gap-4 mt-4">
                {previews.map((src, index) => (
                    <div key={index} className="relative">
                        <Image
                            src={src}
                            alt={`preview-${index}`}
                            width={200}
                            height={200}
                            className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button onClick={() => removeFile(index)} disabled={uploading || disabled} style="secondary" extraStyles="absolute top-1 right-1 !rounded-full !p-2" >
                            <FaXmark />
                        </Button>
                    </div>
                ))}
            </div>

            {files.length > 0 && (
                <Button onClick={handleUpload} style="primary" disabled={uploading || disabled} >
                    {t('uploadImages', {count: files.length})}
                </Button>
            )}
        </div>
    );
};

export default ImageUploader;
