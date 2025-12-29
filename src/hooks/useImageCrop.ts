import { useState } from 'react';
import { UploadedFile } from '@/services/upload';

export interface CroppingImage {
    url: string;
    name: string;
    isPreview: boolean;
    index?: number;
}

interface CroppingState {
    isCropModalOpen: boolean;
    croppingImage: CroppingImage | UploadedFile | null;
    crop: { x: number; y: number };
    zoom: number;
    minZoom: number;
}

interface UseImageCropReturn {
    state: CroppingState;
    actions: {
        openCropModalForPreview: (index: number, previews: string[]) => void;
        closeCropModal: () => void;
        onMediaLoaded: (mediaSize: { width: number; height: number }) => void;
        setCrop: (crop: { x: number; y: number }) => void;
        setZoom: (zoom: number) => void;
    };
    utils: {
        checkImageFit: (mediaSize: { width: number; height: number }) => {
            fitsWidth: boolean;
            fitsHeight: boolean;
            fitsCompletely: boolean;
        };
    };
}

export const useImageCrop = (): UseImageCropReturn => {
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [croppingImage, setCroppingImage] = useState<CroppingImage | UploadedFile | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(0.5);

    const openCropModalForPreview = (index: number, previews: string[]) => {
        setCroppingImage({ 
            url: previews[index], 
            name: `preview-${index}`, 
            isPreview: true, 
            index 
        } as CroppingImage);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setMinZoom(0.5);
        setIsCropModalOpen(true);
    };

    const closeCropModal = () => {
        setIsCropModalOpen(false);
        setCroppingImage(null);
    };

    const checkImageFit = (mediaSize: { width: number; height: number }) => {
        const { width, height } = mediaSize;
        const cropAspectRatio = 4 / 3;
        
        // Calculate if image fits at zoom level 1
        const imageAspectRatio = width / height;
        
        // Calculate the dimensions of the image when scaled to fit the crop area
        let scaledWidth, scaledHeight;
        
        if (imageAspectRatio > cropAspectRatio) {
            // Image is wider - scale to match crop height
            scaledHeight = height;
            scaledWidth = height * cropAspectRatio;
        } else {
            // Image is taller - scale to match crop width
            scaledWidth = width;
            scaledHeight = width / cropAspectRatio;
        }
        
        // Check if original image dimensions are sufficient
        const fitsWidth = width >= scaledWidth;
        const fitsHeight = height >= scaledHeight;
        const fitsCompletely = fitsWidth && fitsHeight;
        console.log(fitsCompletely, fitsHeight, fitsWidth)
        
        return { fitsWidth, fitsHeight, fitsCompletely };
    };

    const onMediaLoaded = (mediaSize: { width: number; height: number }) => {
        const { width, height } = mediaSize;
        const cropAspectRatio = 4 / 3; // Fixed aspect ratio
        
        // Check if image already fits properly
        const { fitsCompletely } = checkImageFit(mediaSize);
        
        let finalMinZoom;
        
        // If image fits completely, allow zooming out to 1x (no zoom out)
        // If image doesn't fit, calculate the minimum zoom needed to fill the crop area
        if (fitsCompletely) {
            // Image already fits well, set minimum zoom to 1x (no zoom out)
            finalMinZoom = 1;
        } else {
            // Image doesn't fit completely, calculate minimum zoom needed
            const imageAspectRatio = width / height;
            
            if (imageAspectRatio > cropAspectRatio) {
                // Image is wider than crop area - height is the limiting factor
                // We need to zoom until height fills the crop area
                finalMinZoom = (cropAspectRatio * height) / width;
            } else {
                // Image is taller than crop area - width is the limiting factor
                // We need to zoom until width fills the crop area
                finalMinZoom = width / (cropAspectRatio * height);
            }
            
            // Ensure minimum zoom is at least 1x to prevent zooming out
            finalMinZoom = Math.max(finalMinZoom, 1);
        }
        
        setMinZoom(finalMinZoom);
        setZoom(Math.max(1, finalMinZoom)); // Start with zoom 1 or calculated min zoom
    };

    return {
        state: {
            isCropModalOpen,
            croppingImage,
            crop,
            zoom,
            minZoom,
        },
        actions: {
            openCropModalForPreview,
            closeCropModal,
            onMediaLoaded,
            setCrop,
            setZoom,
        },
        utils: {
            checkImageFit,
        },
    };
};
