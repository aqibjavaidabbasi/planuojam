"use client"

import type React from "react"
import { useState } from "react"
import { ListingItem } from "@/types/pagesTypes"
import { useLocale, useTranslations } from "next-intl"
import Button from "../../custom/Button"
import Modal from "../../custom/Modal"
import { updateListing, deleteListing } from "@/services/listing"
import { useRouter } from "@/i18n/navigation"
import { toast } from "react-hot-toast"

interface ArchiveDeleteSectionProps {
  listing: ListingItem
  onSaved: () => void
}

const ArchiveDeleteSection: React.FC<ArchiveDeleteSectionProps> = ({ listing, onSaved }) => {
  const t = useTranslations("Listing.Edit.archive")
  const router = useRouter()
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const locale = useLocale()

  const handleArchive = async () => {
    if (!listing.documentId) return
    
    setIsArchiving(true)
    try {
      await updateListing(listing.documentId, { 
        data: {
          listingStatus: "archived"
        }
      }, locale)
      
      toast.success(t("archiveSection.success"))
      setShowArchiveModal(false)
      onSaved()
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push("/profile?tab=my-listings")
      }, 1500)
    } catch (error) {
      console.error("Failed to archive listing:", error)
      toast.error("Failed to archive listing")
    } finally {
      setIsArchiving(false)
    }
  }

  const handleUnarchive = async () => {
    if (!listing.documentId) return
    
    setIsArchiving(true)
    try {
      await updateListing(listing.documentId, { 
        data: {
          listingStatus: "published"
        }
      }, locale)
      
      toast.success(t("unarchiveSection.success"))
      setShowUnarchiveModal(false)
      onSaved()
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push("/profile?tab=my-listings")
      }, 1500)
    } catch (error) {
      console.error("Failed to unarchive listing:", error)
      toast.error("Failed to unarchive listing")
    } finally {
      setIsArchiving(false)
    }
  }

  const handleDelete = async () => {
    if (!listing.documentId) return
    
    setIsDeleting(true)
    try {
      await deleteListing(listing.documentId)
      
      toast.success(t("deleteSection.success"))
      setShowDeleteModal(false)
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push("/profile?tab=my-listings")
      }, 1500)
    } catch (error) {
      console.error("Failed to delete listing:", error)
      toast.error("Failed to delete listing")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Archive/Unarchive Section */}
      {listing.listingStatus === 'archived' ? (
        <div className="border border-green-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                {t("unarchiveSection.title")}
              </h3>
              <p className="text-sm text-green-600 mt-1">
                {t("unarchiveSection.description")}
              </p>
            </div>
            
            <Button
              onClick={() => setShowUnarchiveModal(true)}
              style="primary"
              disabled={isArchiving}
            >
              {t("unarchiveSection.button")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("archiveSection.title")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t("archiveSection.description")}
              </p>
            </div>
            
            <Button
              onClick={() => setShowArchiveModal(true)}
              style="secondary"
              disabled={isArchiving}
            >
              {t("archiveSection.button")}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Section */}
      <div className="border border-red-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-red-900">
              {t("deleteSection.title")}
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {t("deleteSection.description")}
            </p>
          </div>
          
          <Button
            onClick={() => setShowDeleteModal(true)}
            style="destructive"
            disabled={isDeleting}
          >
            {t("deleteSection.button")}
          </Button>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title={t("archiveSection.confirmTitle")}
        size="md"
        footer={
            <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowArchiveModal(false)}
              style="ghost"
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              style="primary"
              disabled={isArchiving}
            >
              {t("archiveSection.confirmButton")}
            </Button>
          </div>
        }
      >
        <div>
          <p className="text-gray-700 p-4">
            {t("archiveSection.confirmMessage")}
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("deleteSection.confirmTitle")}
        size="md"
        footer={
                      <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              style="ghost"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              style="destructive"
              disabled={isDeleting}
            >
              {t("deleteSection.confirmButton")}
            </Button>
          </div>
        }
      >
        <div className="">
          <p className="text-gray-900 p-4 rounded-md bg-red-200 border border-red-500 my-6">
            {t("deleteSection.confirmMessage")}
          </p>
        </div>
      </Modal>

      {/* Unarchive Confirmation Modal */}
      <Modal
        isOpen={showUnarchiveModal}
        onClose={() => setShowUnarchiveModal(false)}
        title={t("unarchiveSection.confirmTitle")}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowUnarchiveModal(false)}
              style="ghost"
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnarchive}
              style="primary"
              disabled={isArchiving}
            >
              {t("unarchiveSection.confirmButton")}
            </Button>
          </div>
        }
      >
        <div>
          <p className="text-gray-700 p-4">
            {t("unarchiveSection.confirmMessage")}
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default ArchiveDeleteSection
