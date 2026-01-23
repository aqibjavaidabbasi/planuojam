"use client"

import { deleteStrapiFile, uploadToStrapi, type UploadedFile } from "@/services/upload";
import React, { useState } from "react";
import Button from "../custom/Button";
import { FaXmark, FaCropSimple } from "react-icons/fa6";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getCompleteImageUrl } from "@/utils/helpers";
import Cropper from 'react-easy-crop';
import type { strapiImage } from "@/types/mediaTypes";
import Modal from "../custom/Modal";
import { IoCloudUploadOutline } from "react-icons/io5";
import { useImageCrop } from "@/hooks/useImageCrop";
import { handleCropProcess } from "@/utils/imageCropUtils";

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (uploadedImages: strapiImage[]) => void
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
    const t = useTranslations('Custom.ImageUploadModal');
    const tImageUploader = useTranslations('Custom.ImageUploader');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    const { state: cropState, actions: cropActions } = useImageCrop();

    // Handle file select
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        setValidationError(null); // Clear validation errors when files are selected

        // Generate previews
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

        setFiles((prev) => [...prev, ...newFiles]);
        setPreviews((prev) => [...prev, ...newPreviews]);
        // Allow selecting the same files again by clearing input value
        e.target.value = '';
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

    // Remove an uploaded image (optimistic) and attempt Strapi deletion in the background
    const removeUploaded = (id: number) => {
        const next = uploaded.filter((u) => u.id !== id);
        setUploaded(next);
        // Fire-and-forget deletion; do not block UI or show toasts
        deleteStrapiFile(id).catch(() => {/* ignore failures as per requirement */ });
    };


    const handleCrop = async () => {
        if (!cropState.croppingImage || !cropState.croppedAreaPixels) return;

        try {
            toast.loading(t('cropping'));
            
            await handleCropProcess(
                cropState.croppingImage,
                cropState.croppedAreaPixels,
                getCompleteImageUrl,
                previews,
                files,
                setPreviews,
                setFiles,
                uploadToStrapi
            );
            
            toast.success('Image cropped. Click "Upload Images" to save.');
        } catch (err) {
            console.error('Crop error:', err);
            toast.error('Failed to crop image');
        } finally {
            cropActions.closeCropModal();
            toast.dismiss();
        }
    };

    // Validate and handle modal close
    const handleClose = () => {
        // Clean up previews
        previews.forEach(url => URL.revokeObjectURL(url));
        
        setFiles([]);
        setPreviews([]);
        setUploaded([]);
        setValidationError(null);
        onClose();
    };

    // Upload files
    const handleUpload = async () => {
        if (files.length === 0) {
            setValidationError(t('validation.noFiles'));
            return;
        }

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            setUploading(true);
            setValidationError(null);
            const res = await uploadToStrapi(files);

            const nextUploaded = [...uploaded, ...res];
            setUploaded(nextUploaded);
            
            // Format uploaded files for parent
            const formattedImages: strapiImage[] = res.map(f => ({
                id: f.id,
                url: f.url,
                mime: f.mime || "",
                width: (f.width as number) || 0,
                height: (f.height as number) || 0,
                ext: f.ext || "",
                formats: (f.formats as unknown as strapiImage['formats']) || {}
            }));

            // Pass uploaded images to parent
            onUploadSuccess(formattedImages);
            
            // Reset and close modal
            setFiles([]);
            setPreviews([]);
            setUploaded([]);
            toast.success(tImageUploader('toasts.uploadSuccess'));
            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            setValidationError(t('validation.uploadFailed'));
            toast.error(tImageUploader('toasts.uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title={t('title')}
                size="md"
                footer={
                    <div className="flex flex-col w-full gap-2.5">
                        <div>
                            {validationError && (
                                <p className="text-red-500 text-sm">{validationError}</p>
                            )}
                        </div>
                        <div className="flex justify-end w-full gap-2.5">
                            <Button onClick={handleClose} style="secondary" disabled={uploading}>
                                {t('buttons.cancel')}
                            </Button>
                            {files.length > 0 && (
                                <Button extraStyles="!rounded-md" onClick={handleUpload} style="primary" disabled={uploading}>
                                    {uploading ? tImageUploader('buttons.uploading') : t('buttons.upload', { count: files.length })}
                                </Button>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="py-4">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="fileInput"
                        onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="fileInput"
                        className="px-4 py-2 w-full cursor-pointer rounded-md bg-transparent hover:bg-gray-100 text-black border border-gray-100 hover:border-gray-400 shadow-none flex items-center gap-2 justify-center"
                    >
                        <IoCloudUploadOutline />
                        {tImageUploader('selectImages')}
                    </label>

                    {uploaded.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-2">
                            {uploaded.map((file) => (
                                <div key={file.id} className="relative">
                                    {file.mime?.startsWith('video/') ? (
                                        <video
                                            src={getCompleteImageUrl(file.url)}
                                            controls
                                            className="w-full aspect-4/3 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <Image
                                            src={getCompleteImageUrl(file.url)}
                                            alt={file.name || `uploaded-${file.id}`}
                                            width={200}
                                            height={150}
                                            className="w-full aspect-4/3 object-cover rounded-lg"
                                        />
                                    )}
                                    <Button onClick={() => removeUploaded(file.id)} disabled={uploading} style="secondary" extraStyles="absolute top-1 right-1 !rounded-full !p-2" >
                                        <FaXmark />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {previews.map((src, index) => (
                            <div key={index} className="relative">
                                {files[index]?.type.startsWith('video/') ? (
                                    <video
                                        src={src}
                                        controls
                                        className="w-full aspect-4/3 object-cover rounded-lg"
                                    />
                                ) : (
                                    <Image
                                        src={src}
                                        alt={`preview-${index}`}
                                        width={200}
                                        height={150}
                                        className="w-full aspect-4/3 object-cover rounded-lg"
                                    />
                                )}
                                <Button onClick={() => removeFile(index)} disabled={uploading} style="secondary" extraStyles="absolute top-1 right-1 !rounded-full !p-2" >
                                    <FaXmark />
                                </Button>
                                {!files[index]?.type.startsWith('video/') && (
                                    <Button onClick={() => cropActions.openCropModalForPreview(index, previews)} disabled={uploading} style="primary" extraStyles="absolute bottom-1 left-1 !rounded-full !p-2" >
                                        <FaCropSimple />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={cropState.isCropModalOpen}
                onClose={cropActions.closeCropModal}
                title={tImageUploader('cropTitle')}
                size="lg"
                footer={
                    <div className="flex w-full items-center justify-end gap-2.5">
                        <Button onClick={cropActions.closeCropModal} style="secondary">
                            {tImageUploader('cancel')}
                        </Button>
                        <Button
                            onClick={handleCrop}
                            style="primary"
                            extraStyles="!rounded-md"
                        >
                            {tImageUploader('crop')}
                        </Button>
                    </div>
                }
            >
                <div className="relative w-full mt-10 min-h-96">
                    {cropState.croppingImage && (
                        <Cropper
                            image={'isPreview' in cropState.croppingImage ? cropState.croppingImage.url : getCompleteImageUrl((cropState.croppingImage as UploadedFile & { url: string }).url)}
                            crop={cropState.crop}
                            zoom={cropState.zoom}
                            minZoom={cropState.minZoom}
                            aspect={4 / 3}
                            onCropChange={cropActions.setCrop}
                            onZoomChange={cropActions.setZoom}
                            onMediaLoaded={cropActions.onMediaLoaded}
                            onCropComplete={cropActions.onCropComplete}
                        />
                    )}
                </div>
                <div className="mt-4 mb-10">
                    <label className="block text-sm font-medium mb-2">{tImageUploader('zoom')}</label>
                    <input
                        type="range"
                        min={cropState.minZoom}
                        max={3}
                        step={0.1}
                        value={cropState.zoom}
                        onChange={(e) => cropActions.setZoom(Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </Modal>
        </>
    );
};

export default ImageUploadModal;
