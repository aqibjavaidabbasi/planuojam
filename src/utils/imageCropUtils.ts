import { CroppingImage } from '@/hooks/useImageCrop';
import { UploadedFile } from '@/services/upload';

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = document.createElement('img');
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error: unknown) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0
): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return null;
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file ? URL.createObjectURL(file) : null);
        }, 'image/jpeg');
    });
};

export const handleCropProcess = async (
    croppingImage: CroppingImage | UploadedFile,
    crop: { x: number; y: number },
    getCompleteImageUrl: (url: string) => string,
    previews: string[],
    files: File[],
    setPreviews: (previews: string[]) => void,
    setFiles: (files: File[]) => void,
    uploadToStrapi: (files: File[]) => Promise<unknown>
): Promise<void> => {
    if (!croppingImage) return;

    try {
        const imageSrc = 'isPreview' in croppingImage 
            ? croppingImage.url 
            : getCompleteImageUrl((croppingImage as UploadedFile & { url: string }).url);
        
        const croppedImageUrl = await getCroppedImg(
            imageSrc,
            { x: crop.x, y: crop.y, width: 300, height: 225 } // 4:3 aspect
        );
        
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
                
                // Success message will be handled by caller
            } else {
                // Upload cropped image and set as main
                const response = await fetch(croppedImageUrl);
                const blob = await response.blob();
                const file = new File([blob], `cropped-${croppingImage.name}`, { type: 'image/jpeg' });

                // Upload
                await uploadToStrapi([file]);
                // Success message will be handled by caller
            }
        }
    } catch (err) {
        console.error('Crop error:', err);
        throw new Error('Failed to crop image');
    }
};
