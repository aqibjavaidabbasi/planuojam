"use client"

import React, { useState, useEffect } from "react"
import Modal from "../custom/Modal"
import { useTranslations } from "next-intl"
import Button from "../custom/Button"
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa"

interface SubscriptionData {
  documentId: string
  stripeSubscriptionId: string
  stripePriceId: string
  stripeCustomerId: string
  subscriptionStatus: string
  currentPeriodEnd: string
  autoRenew: boolean
  listingDocId: string
}

interface SubscriptionManagementModalProps {
  isOpen: boolean
  onClose: () => void
  listingDocId: string
  userId: string
  onOpenSubscriptionModal?: () => void
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  isOpen,
  onClose,
  listingDocId,
  onOpenSubscriptionModal,
}) => {
  const t = useTranslations('Modals.SubscriptionManagement')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadSubscription = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/subscription-status?listingDocId=${listingDocId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subscription')
      }

      if (data.subscriptions && data.subscriptions.length > 0) {
        setSubscription(data.subscriptions[0])
      } else {
        setSubscription(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [listingDocId]);

  useEffect(() => {
    if (isOpen && listingDocId) {
      loadSubscription()
    }
  }, [isOpen, listingDocId, loadSubscription])

  const handleCancel = async () => {
    if (!subscription) return

    const confirmed = confirm(t('confirmCancel'))
    if (!confirmed) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscription-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
          cancelAtPeriodEnd: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      alert(t('cancelSuccess'))
      loadSubscription()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('cancelError'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!subscription) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/subscription-reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      alert(t('reactivateSuccess'))
      loadSubscription()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('reactivateError'))
    } finally {
      setActionLoading(false)
    }
  }

  // const handleManageInPortal = async () => {
  //   if (!subscription) return

  //   setActionLoading(true)
  //   try {
  //     const response = await fetch('/api/subscription-portal', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         customerId: subscription.stripeCustomerId,
  //         returnUrl: window.location.href,
  //       }),
  //     })

  //     const data = await response.json()

  //     if (!response.ok) {
  //       throw new Error(data.error || 'Failed to open customer portal')
  //     }

  //     window.location.href = data.url
  //   } catch (err) {
  //     alert(err instanceof Error ? err.message : t('portalError'))
  //     setActionLoading(false)
  //   }
  // }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
            <FaCheckCircle /> {t('status.active')}
          </span>
        )
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
            <FaClock /> {t('status.pastDue')}
          </span>
        )
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
            <FaTimesCircle /> {t('status.canceled')}
          </span>
        )
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
            <FaTimesCircle /> {t('status.unpaid')}
          </span>
        )
      default:
        return <span className="text-gray-600">{status}</span>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col gap-6 pt-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <FaSpinner className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              style="secondary"
              size="small"
              onClick={loadSubscription}
              extraStyles="mt-3"
            >
              {t('retry')}
            </Button>
          </div>
        )}

        {/* No Subscription */}
        {!loading && !error && !subscription && (
          <div className="text-center py-8 flex flex-col items-center justify-center gap-4">
            <p className="text-gray-600 mb-2">{t('noSubscription')}</p>
            {onOpenSubscriptionModal && (
              <>
                <p className="text-sm text-gray-500 mb-2">{t('purchasePrompt')}</p>
                <Button 
                  style="primary" 
                  onClick={() => {
                    onClose()
                    onOpenSubscriptionModal()
                  }}
                >
                  {t('purchaseSubscription')}
                </Button>
              </>
            )}
            <Button style="secondary" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        )}

        {/* Subscription Details */}
        {!loading && !error && subscription && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{t('currentStatus')}</span>
              {getStatusBadge(subscription.subscriptionStatus)}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Renewal Date */}
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-600">{t('renewalDate')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>

              {/* Auto Renew */}
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-600">{t('autoRenew')}</span>
                <span className={`text-sm font-semibold ${subscription.autoRenew ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.autoRenew ? t('enabled') : t('disabled')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 items-center justify-center">
              {/* Manage in Stripe Portal */}
              {/* <Button
                style="primary"
                onClick={handleManageInPortal}
                disabled={actionLoading}
                extraStyles="w-full"
              >
                {actionLoading ? t('loading') : t('managePortal')}
              </Button> */}

              {/* Cancel or Reactivate */}
              {subscription.subscriptionStatus === 'active' && subscription.autoRenew && (
                <Button
                  style="ghost"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  extraStyles="w-full !text-red-600 hover:!bg-red-50"
                >
                  {actionLoading ? t('loading') : t('cancel')}
                </Button>
              )}

              {subscription.subscriptionStatus === 'active' && !subscription.autoRenew && (
                <Button
                  style="secondary"
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  extraStyles="w-full"
                >
                  {actionLoading ? t('loading') : t('reactivate')}
                </Button>
              )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                {subscription.autoRenew ? t('cancelNote') : t('reactivateNote')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SubscriptionManagementModal
