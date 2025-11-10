"use client"

import React, { useState } from "react"
import { StripeProductAttributes } from "@/app/api/stripe-products/route"
import Modal from "../custom/Modal"
import { useTranslations } from "next-intl"
import Button from "../custom/Button"
import { FaStar } from "react-icons/fa"

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

    const handleSubscribe = async (product: StripeProductAttributes) => {
        if (!product.stripePriceId) {
            alert(t('invalidProduct') || 'Invalid product configuration')
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
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session')
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
        if (listingPrice){
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
                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                                            {product.title}
                                        </h3>

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
                                        {product.description && (
                                            <p className="text-sm text-gray-600 mb-6 text-center flex-grow">
                                                {product.description}
                                            </p>
                                        )}

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