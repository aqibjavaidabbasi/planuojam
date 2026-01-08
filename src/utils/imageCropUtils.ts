import { CroppingImage } from '@/hooks/useImageCrop';
import { UploadedFile } from '@/services/upload';

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = document.createElement('img');
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error: unknown) => reject(error));
        // Only set crossOrigin for non-blob URLs
        if (!url.startsWith('blob:')) {
            image.setAttribute('crossOrigin', 'anonymous');
        }
        image.src = url;
    });

export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    outputWidth = 400,
    outputHeight = 300
): Promise<string | null> => {
    const image = await createImage(imageSrc);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    // Set output canvas to target dimensions for listing cards
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.save();
    
    if (rotation !== 0) {
        ctx.translate(outputWidth / 2, outputHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }

    // Draw the cropped area directly - pixelCrop already contains correct coordinates
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
    );
    
    ctx.restore();

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            if (file) {
                const url = URL.createObjectURL(file);
                resolve(url);
            } else {
                resolve(null);
            }
        }, 'image/jpeg', 0.9);
    });
};

export const handleCropProcess = async (
    croppingImage: CroppingImage | UploadedFile,
    croppedAreaPixels: { x: number; y: number; width: number; height: number },
    getCompleteImageUrl: (url: string) => string,
    previews: string[],
    files: File[],
    setPreviews: (previews: string[]) => void,
    setFiles: (files: File[]) => void,
    uploadToStrapi: (files: File[]) => Promise<unknown>
): Promise<void> => {
    if (!croppingImage || !croppedAreaPixels) return;

    let tempCroppedUrl: string | null = null;

    try {
        const imageSrc = 'isPreview' in croppingImage 
            ? croppingImage.url 
            : getCompleteImageUrl((croppingImage as UploadedFile & { url: string }).url);
        
        // Use the exact pixel coordinates provided by react-easy-crop
        const croppedImageUrl = await getCroppedImg(
            imageSrc,
            croppedAreaPixels,
            0, // no rotation
            400, // target width for listing cards
            300  // target height for listing cards (4:3 aspect)
        );
        
        tempCroppedUrl = croppedImageUrl;
        
        if (croppedImageUrl) {
            if ('isPreview' in croppingImage && typeof croppingImage.index === 'number') {
                // Convert cropped image to file and replace both preview and file
                const response = await fetch(croppedImageUrl);
                const blob = await response.blob();
                const file = new File([blob], `cropped-${croppingImage.name}`, { type: 'image/jpeg' });                    
                // Create new blob URL for the cropped file
                const newCroppedUrl = URL.createObjectURL(file);
                
                // Revoke old URL and replace preview
                const oldUrl = previews[croppingImage.index];
                URL.revokeObjectURL(oldUrl);
                const newPreviews = [...previews];
                newPreviews[croppingImage.index] = newCroppedUrl;
                // Replace file
                const newFiles = [...files];
                newFiles[croppingImage.index] = file;
                setPreviews(newPreviews);
                setFiles(newFiles);
            } else {
                // Upload cropped image and set as main
                const response = await fetch(croppedImageUrl);
                const blob = await response.blob();
                const file = new File([blob], `cropped-${croppingImage.name}`, { type: 'image/jpeg' });

                // Upload
                await uploadToStrapi([file]);
            }
        }
    } catch (err) {
        console.error('Crop error:', err);
        throw new Error('Failed to crop image');
    } finally {
        // Clean up temporary cropped image URL
        if (tempCroppedUrl) {
            URL.revokeObjectURL(tempCroppedUrl);
        }
    }
};
