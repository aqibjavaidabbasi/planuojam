'use client'
import { deleteStrapiFile, uploadToStrapi, type UploadedFile } from "@/services/upload";
import React, { useState } from "react";
import Button from "./Button";
import { FaXmark, FaCropSimple, FaStar, FaRegStar } from "react-icons/fa6";
import toast from "react-hot-toast";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getCompleteImageUrl } from "@/utils/helpers";
import Modal from "./Modal";
import Cropper from 'react-easy-crop';
import { useImageCrop } from "@/hooks/useImageCrop";
import { handleCropProcess } from "@/utils/imageCropUtils";

const ImageUploader = ({
     setImageIds, 
     disabled, 
     setMainImageId, 
     mainImageId,
     onBackendUpload
     }:
         { 
            setImageIds: (ids: number[]) => void, 
            disabled: boolean, 
            setMainImageId?: (id: number) => void, 
            mainImageId?: number | null,
            onBackendUpload?: (files: UploadedFile[]) => void
        }) => {
    const t = useTranslations('Custom.ImageUploader');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
    const [localMainImageId, setLocalMainImageId] = useState<number | null>(mainImageId || null);
    
    const { state: cropState, actions: cropActions } = useImageCrop();

    // Handle file select
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);

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
        setImageIds(next.map((u) => u.id));
        // Fire-and-forget deletion; do not block UI or show toasts
        deleteStrapiFile(id).catch(() => {/* ignore failures as per requirement */ });
    };

    // Upload files
    const handleUpload = async () => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            setUploading(true);
            const res = await uploadToStrapi(files);

            if (onBackendUpload) {
                onBackendUpload(res);
                setFiles([]);
                setPreviews([]);
                toast.success(t('toasts.uploadSuccess'))
                return;
            }

            const nextUploaded = [...uploaded, ...res];
            setUploaded(nextUploaded);
            setImageIds(nextUploaded.map((item) => item.id));
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

    return (
        <div className="space-y-4">
            <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
                onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ''; }}
                disabled={uploading || disabled}
            />
            <label
                htmlFor="fileInput"
                className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer"
            >
                {t('selectImages')}
            </label>

            {uploaded.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-2">
                    {(() => {
                        return uploaded.map((file) => {
                            const isMain = file.id === localMainImageId;
                            return (
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
                                            className="w-full aspect-4/3 object-contain rounded-lg"
                                        />
                                    )}
                                    <Button onClick={() => removeUploaded(file.id)} disabled={uploading || disabled} style="secondary" extraStyles="absolute top-1 right-1 !rounded-full !p-2" >
                                        <FaXmark />
                                    </Button>
                                    {setMainImageId && (
                                        <Button
                                            style="primary"
                                            extraStyles="absolute bottom-1 left-1 !rounded-full !p-2"
                                            onClick={() => {
                                                setLocalMainImageId(file.id);
                                            }}
                                            aria-label={isMain ? t('deselectMain') : t('selectMain')}
                                        >
                                            {isMain ? <FaStar /> : <FaRegStar />}
                                        </Button>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-4">
                {(() => {
                    return previews.map((src, index) => {
                        return (
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
                                <Button onClick={() => removeFile(index)} disabled={uploading || disabled} style="secondary" extraStyles="absolute top-1 right-1 !rounded-full !p-2" >
                                    <FaXmark />
                                </Button>
                                {!files[index]?.type.startsWith('video/') && (
                                    <Button onClick={() => cropActions.openCropModalForPreview(index, previews)} disabled={uploading || disabled} style="primary" extraStyles="absolute bottom-1 left-1 !rounded-full !p-2" >
                                        <FaCropSimple />
                                    </Button>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>

            {files.length > 0 && (
                <Button onClick={handleUpload} style="primary" disabled={uploading || disabled} >
                    {t('uploadImages', { count: files.length })}
                </Button>
            )}

            <Modal
                isOpen={cropState.isCropModalOpen}
                onClose={cropActions.closeCropModal}
                title={t('cropTitle')}
                size="lg"
                footer={
                    <div className="flex w-full items-center justify-end gap-2.5">
                        <Button onClick={cropActions.closeCropModal} style="secondary">
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleCrop}
                            style="primary"
                            extraStyles="!rounded-md"
                        >
                            {t('crop')}
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
                        />
                    )}
                </div>
                <div className="mt-4 mb-10">
                    <label className="block text-sm font-medium mb-2">{t('zoom')}</label>
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
        </div>
    );
};

export default ImageUploader;
