"use client";
import React from 'react'
import { useTranslations } from 'next-intl'

function NotFoundPage() {
  const t = useTranslations('NotFound')
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 border-b-4 border-gray-200">
        <div className="text-center">
            <div className="mb-8">
                <span className="text-7xl md:text-8xl font-black text-gray-900">4</span>
                <span className="text-7xl md:text-8xl font-black text-primary pulse-custom">0</span>
                <span className="text-7xl md:text-8xl font-black text-gray-900">4</span>
            </div>
            <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800">{t('title')}</h2>
                <p className="text-gray-600 max-w-sm mx-auto">
                    {t('description')}
                </p>
            </div>
            <div className="mt-8 flex justify-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
        </div>
    </div>
  )
}

export default NotFoundPage