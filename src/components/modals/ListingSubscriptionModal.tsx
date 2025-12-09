"use client"

import React, { useState } from "react"
import { StripeProductAttributes } from "@/app/api/stripe-products/route"
import Modal from "../custom/Modal"
import { useTranslations } from "next-intl"
import Button from "../custom/Button"
import { FaStar } from "react-icons/fa"
import Input from "../custom/Input"

const ListingSubscriptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    stripeProducts: StripeProductAttributes[];
    listingDocId: string;
    listingTitle?: string;
    listingPrice?: number;
    userId: string;
}> = ({ isOpen, onClose, stripeProducts, listingDocId, listingTitle, listingPrice, userId }) => {
    const t = useTranslations('Modals.ListingSubscription')
    const [selectedProduct, setSelectedProduct] = useState<StripeProductAttributes | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [promoCode, setPromoCode] = useState('')
    const [promoError, setPromoError] = useState('')
    interface PromoData {
    id: string;
    code: string;
    coupon: {
        percent_off?: number;
        amount_off?: number;
        id: string;
        duration: string;
    };
}

const [promoData, setPromoData] = useState<PromoData | null>(null)
    const [isValidatingPromo, setIsValidatingPromo] = useState(false)

    const validatePromo = async () => {
        if (!promoCode.trim()) {
            setPromoError('')
            setPromoData(null)
            return
        }

        setIsValidatingPromo(true)
        setPromoError('')

        try {
            const res = await fetch('/api/check-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode.trim() }),
            })

            const data = await res.json()

            if (!data.valid) {
                setPromoError(data.error || t('invalidPromoCode') || 'Invalid or expired promotion code.')
                setPromoData(null)
            } else {
                setPromoError('')
                setPromoData(data.details)
            }
        } catch (error) {
            console.error('Promo validation error:', error)
            setPromoError(t('promoServerError') || 'Server error — try again later.')
            setPromoData(null)
        } finally {
            setIsValidatingPromo(false)
        }
    }

    const handleSubscribe = async (product: StripeProductAttributes) => {
        if (!product.stripePriceId) {
            alert(t('invalidProduct') || 'Invalid product configuration')
            return
        }

        // Validate promo code if entered
        if (promoCode.trim() && !promoData) {
            setPromoError(t('validatePromoFirst') || 'Please validate the promo code first or remove it to continue.')
            return
        }

        setSelectedProduct(product)
        setIsProcessing(true)

        try {
            // Create checkout session
            const response = await fetch('/api/subscription-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    stripePriceId: product.stripePriceId,
                    listingDocId,
                    listingTitle,
                    successUrl: `${window.location.origin}/profile?tab=my-listings`,
                    cancelUrl: `${window.location.origin}/profile?tab=my-listings`,
                    promoCode: promoCode.trim() || undefined,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session')
            }

            // Show promo code status message if applicable
            if (data.message) {
                if (data.promoCodeApplied) {
                    // Success message for valid promo code
                    console.log(data.message)
                } else {
                    // Warning for invalid promo code (but checkout continues)
                    console.warn(data.message)
                }
            }

            // Redirect to Stripe Checkout using the URL
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL received')
            }
        } catch (error) {
            console.error('Subscription error:', error)
            alert(
                error instanceof Error
                    ? error.message
                    : t('subscriptionError') || 'Failed to start subscription'
            )
            setSelectedProduct(null)
            setIsProcessing(false)
        }
    }

    const getBadgeStyles = (badge?: string | null) => {
        switch (badge) {
            case 'premium':
                return 'border-primary bg-gradient-to-br from-amber-50 to-pink-50'
            case 'featured':
                return 'border-blue-500 bg-blue-50'
            case 'basic':
            default:
                return 'border-gray-200 bg-white'
        }
    }

    const getIntervalLabel = (interval?: string | null) => {
        switch (interval) {
            case 'month':
                return t('perMonth')
            case 'year':
                return t('perYear')
            case 'one_time':
            default:
                return t('oneTime')
        }
    }

    //filter stripe products( show only the one with listing price in range)
    const filteredProducts = stripeProducts.filter((product) => {
        if (listingPrice) {
            const minPrice = product.minListingPrice || 0;
            const maxPrice = product.maxListingPrice || Infinity;
            return listingPrice >= minPrice && listingPrice <= maxPrice;
        }
        return true;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="flex flex-col gap-6 pt-8">
                {/* Header */}
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Promo Code Input */}
                <div className="max-w-md mx-auto w-full">
                    <Input
                        type="text"
                        placeholder={t('promoCodePlaceholder') || 'Enter promo code'}
                        value={promoCode}
                        onChange={(e) => {
                            setPromoCode(e.target.value)
                            setPromoError('')
                            setPromoData(null)
                        }}
                        disabled={isProcessing || isValidatingPromo}
                        label={t('promoCodeLabel') || 'Promo Code (optional)'}
                    />
                    
                    {/* Validate Button */}
                    {promoCode.trim() && (
                        <div className="mt-2">
                            <Button
                                style="secondary"
                                onClick={validatePromo}
                                disabled={isValidatingPromo || isProcessing}
                                extraStyles="w-full text-sm"
                            >
                                {isValidatingPromo ? t('validating') || 'Validating...' : t('validatePromo') || 'Validate Promo Code'}
                            </Button>
                        </div>
                    )}

                    {/* Promo Error */}
                    {promoError && (
                        <div className="mt-2 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">
                            {promoError}
                        </div>
                    )}

                    {/* Promo Success */}
                    {promoData && (
                        <div className="mt-2 p-3 rounded bg-green-50 border border-green-200 text-sm">
                            <div className="text-green-800 font-medium mb-1">
                                ✓ {t('promoSuccess') || 'Promo code applied successfully!'}
                            </div>
                            <div className="text-green-700">
                                {promoData.coupon?.percent_off ? (
                                    t('percentOff', { percent: promoData.coupon.percent_off }) || `You get ${promoData.coupon.percent_off}% off your subscription`
                                ) : promoData.coupon?.amount_off ? (
                                    t('amountOff', { amount: (promoData.coupon.amount_off / 100).toFixed(2) }) || `You get $${(promoData.coupon.amount_off / 100).toFixed(2)} off your subscription`
                                ) : (
                                    t('discountApplied') || 'Discount applied to your subscription'
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                {filteredProducts && filteredProducts.length > 0 ? (
                    <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6">
                        {filteredProducts.map((product) => {
                            const isPremium = product.badge === 'premium'
                            const isFeatured = product.badge === 'featured'

                            return (
                                <div
                                    key={product.documentId}
                                    className={`relative p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 ${getBadgeStyles(product.badge)}`}
                                >
                                    {/* Badge indicator */}
                                    {isPremium && (
                                        <span className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-pink-500 text-white text-xs font-bold w-12 h-12 rounded-full shadow-lg z-10 flex items-center justify-center">
                                            <FaStar size={20} />
                                        </span>
                                    )}
                                    {isFeatured && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                                            {t('featured')}
                                        </span>
                                    )}

                                    {/* Product content */}
                                    <div className="flex flex-col h-full">

                                        {/* <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                                            {product.title}
                                        </h3> */}

                                        {/* Price */}
                                        <div className="text-center mb-4">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-3xl md:text-4xl font-bold text-primary">
                                                    {product.price}{" "}{product.currency}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {getIntervalLabel(product.interval)}
                                            </p>
                                        </div>

                                        {/* Description */}
                                        {/* {product.description && (
                                            <p className="text-sm text-gray-600 mb-6 text-center flex-grow">
                                                {product.description}
                                            </p>
                                        )} */}

                                        {/* CTA Button */}
                                        <div className="mt-auto">
                                            {isPremium ? (
                                                <Button
                                                    style="primary"
                                                    extraStyles="!rounded-lg w-full bg-gradient-to-r from-amber-500 to-pink-500 hover:from-pink-500 hover:to-amber-500 !hover:bg-transparent transition-all duration-300 shadow-md hover:shadow-lg"
                                                    onClick={() => handleSubscribe(product)}
                                                    disabled={isProcessing}
                                                >
                                                    {selectedProduct?.documentId === product.documentId ? t('processing') : t('subscribe')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    style="secondary"
                                                    extraStyles="!w-full !rounded-lg hover:scale-105 transition-transform duration-200"
                                                    onClick={() => handleSubscribe(product)}
                                                    disabled={isProcessing}
                                                >
                                                    {selectedProduct?.documentId === product.documentId ? t('processing') : t('subscribe')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">{t('noProducts')}</p>
                    </div>
                )}

                {/* Footer note */}
                <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        {t('footerNote')}
                    </p>
                </div>
            </div>
        </Modal>
    )
}

export default ListingSubscriptionModal