"use client"
import { type UploadedFile } from "@/services/upload";

import React, { useState, useEffect } from "react"
import Button from "../../custom/Button"
import ImageUploader from "../../custom/ImageUploader"
import { toast } from "react-hot-toast"
import { updateListing } from "@/services/listing"
import type { ListingItem } from "@/types/pagesTypes"
import Image from "next/image"
import { getCompleteImageUrl } from "@/utils/helpers"
import { useTranslations } from "next-intl"
import Modal from "@/components/custom/Modal"
import { FaTrash, FaGripVertical } from "react-icons/fa6"
import { translateError } from "@/utils/translateError"

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { strapiImage } from "@/types/mediaTypes"

// Sortable Item Component
function SortableMediaItem({ 
    id, 
    media, 
    onDelete, 
    isMain,
    t
}: { 
    id: number, 
    media: strapiImage, 
    onDelete: (id: number) => void,
    isMain: boolean,
    t: (key: string) => string
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const imagePath = getCompleteImageUrl(media.url);
    const isVideo = media.mime?.startsWith('video/');

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`relative group bg-gray-50 rounded-lg overflow-hidden border-2 h-[150px] ${isMain ? 'border-primary' : 'border-transparent'}`}
        >
            <div className="w-full h-full relative">
                 {isVideo ? (
                    <video src={imagePath} className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <Image 
                        src={imagePath} 
                        alt={t("alt.portfolioMedia")} 
                        fill
                        className="object-cover pointer-events-none" 
                    />
                  )}
            </div>
            
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute top-2 left-2 p-2 bg-white/80 rounded cursor-grab active:cursor-grabbing hover:bg-white text-gray-700 z-10 opacity-70 hover:opacity-100"
            >
                <FaGripVertical />
            </div>

             {/* Delete Button */}
            <Button
                style="destructive"
                extraStyles="absolute top-2 right-2 opacity-90 group-hover:opacity-100 !p-2 !rounded-full z-10"
                onClick={() => onDelete(id)}
                aria-label={t("aria.deleteMedia")}
            >
                <FaTrash />
            </Button>

            {isMain && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-white text-xs py-1 text-center font-medium z-10">
                    {t("mainMedia")}
                </div>
            )}
        </div>
    );
}

export default function ImagesSection({ listing, onSaved }: { listing: ListingItem; onSaved?: () => void }) {
  const t = useTranslations("ImageSection")
  const tErrors = useTranslations('Errors')

  const [items, setItems] = useState<strapiImage[]>([]);
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  // Initialize items from listing
  useEffect(() => {
    const portfolio = listing.portfolio || [];
    const orderStr = listing.mediaOrder;
    if (orderStr) {
         const orderMap = new Map(orderStr.split("-").map((id, index) => [Number(id), index]));
         const sorted = [...portfolio].sort((a, b) => {
            const indexA = orderMap.get(a.id);
            const indexB = orderMap.get(b.id);
            
            // If both exist in map, sort by index
            if (indexA !== undefined && indexB !== undefined) return indexA - indexB;
            // If only A exists, it comes first
            if (indexA !== undefined) return -1;
            // If only B exists, it comes first (A goes to end)
            if (indexB !== undefined) return 1;
            // Neither exist, keep original order (or sort by ID if desired, but stability is good)
            return 0; 
         });
         setItems(sorted);
    } else {
         setItems(portfolio);
    }
  }, [listing.portfolio, listing.mediaOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleBackendUpload = (newFiles: UploadedFile[]) => {
      // Cast UploadedFile to strapiImage format if needed. 
      // Assuming structure is similar enough or mapping:
       const formatted: strapiImage[] = newFiles.map(f => ({
          id: f.id,
          url: f.url,
          mime: f.mime || "",
          width: (f.width as number) || 0,
          height: (f.height as number) || 0,
          ext: f.ext || "",
          formats: (f.formats as unknown as strapiImage['formats']) || {}
      }));
      setItems(prev => [...prev, ...formatted]);
  }

  const handleRequestDelete = (id: number) => {
    setItemToDelete(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      // Optimistic update
      const newItems = items.filter(i => i.id !== itemToDelete);
      setItems(newItems);
      
      // Save changes immediately to backend
      const mediaOrder = newItems.map(i => i.id).join("-");
      const portfolioIds = newItems.map(i => i.id);

      await updateListing(listing.documentId, { 
          data: { 
              portfolio: portfolioIds,
              mediaOrder: mediaOrder
          } 
      }, listing.locale)
      
      toast.success(t("toasts.removed"))
      setIsConfirmOpen(false)
      setItemToDelete(null)
      onSaved?.()
    } catch (e: unknown) {
        // Revert on error? Or just show error
      toast.error(translateError(t, tErrors, e, 'toasts.removeFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const onSubmit = async () => {
    if (items.length === 0) {
      // If user really wants to clear all, they would delete one by one. 
      // Or we can allow saving empty.
      // listing.portfolio check?
      if((listing.portfolio || []).length === 0) {
           toast.error(t("errors.noImage"))
           return
      }
      // If items is empty but listing has portfolio, maybe they deleted everything?
    }

    setSubmitting(true)
    try {
      const mediaOrder = items.map(i => i.id).join("-");
      const portfolioIds = items.map(i => i.id);

      // We explicitly set mainImageId to null or don't send it, letting backend/frontend rely on order. 
      // To be clean, we can clear mainImageId if it exists to avoid confusion, 
      // OR keeps it as sync with first item.
      // Let's sync it with the first item's ID for backward compatibility just in case.
      const mainImageId = items.length > 0 ? items[0].id.toString() : null;

      const updateData: {
        portfolio: number[];
        mediaOrder: string;
        mainImageId: string | null;
      } = { 
        portfolio: portfolioIds,
        mediaOrder: mediaOrder,
        mainImageId: mainImageId
      }
      
      await updateListing(listing.documentId, { data: updateData }, listing.locale)
      toast.success(t("toasts.saved"))
      onSaved?.()
    } catch (e: unknown) {
      toast.error(translateError(t, tErrors, e, 'toasts.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4">
      <p className="text-sm text-gray-600 mb-2">{t("uploadHint", { size: "20MB" })}</p>
      <p className="text-sm text-gray-600 mb-4">{t("instructionHint")}</p>
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
            items={items.map(i => i.id)} 
            strategy={rectSortingStrategy}
        >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {items.map((item, index) => (
                    <SortableMediaItem
                        key={item.id}
                        id={item.id}
                        media={item}
                        onDelete={handleRequestDelete}
                        isMain={index === 0}
                        t={t}
                    />
                ))}
            </div>
        </SortableContext>
      </DndContext>

      <h3 className="text-lg font-semibold mb-2">{t("addportfolioimages")}</h3>
      <div className="flex flex-col gap-2">
        {/* Pass dummy setImageIds and handle logic via onBackendUpload */}
        <ImageUploader 
            setImageIds={() => {}} 
            disabled={submitting} 
            onBackendUpload={handleBackendUpload}
        />
        
        {/* Show unsaved changes hint? */}
        <div className="flex justify-end mt-2">
          <Button style="primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? t("saving"): t("saveImages")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => !deleting && setIsConfirmOpen(false)}
        title={t("modal.deleteTitle")}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button style="secondary" onClick={() => setIsConfirmOpen(false)} disabled={deleting}>
              {t("modal.cancel")}
            </Button>
            <Button style="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? t("modal.deleting") : t("modal.delete")}
            </Button>
          </div>
        }
      >
        <p>{t("modal.confirm")}</p>
      </Modal>
    </div>
  )
}
