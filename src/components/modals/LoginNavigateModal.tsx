'use client'

import React from 'react'
import Modal from '../custom/Modal'
import Button from '../custom/Button'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { SUPPORTED_LOCALES } from '@/config/i18n'

function LoginNavigateModal({showModal, setShowModal}: {showModal: boolean, setShowModal: (showModal: boolean) => void}) {
    const t = useTranslations('Modals.LoginNavigate')
    const router = useRouter()
    return (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <div className='flex flex-col gap-4 items-center'>
                <h2>{t('title')}</h2>
                <p>{t('description')}</p>
                <Button 
                    style="primary" 
                    onClick={() => {
                        let np = '/'
                        if (typeof window !== 'undefined') {
                            np = window.location.pathname
                            for (const loc of SUPPORTED_LOCALES) {
                                if (np === `/${loc}`) { np = '/'; break }
                                if (np.startsWith(`/${loc}/`)) { np = np.slice(loc.length + 1); break }
                            }
                        }
                        const current = (typeof window !== 'undefined') ? (np + window.location.search) : '/'
                        const url = `/auth/login?redirect=${encodeURIComponent(current)}`
                        router.push(url)
                        setShowModal(false)
                    }} 
                    size="small">{t('loginCta')}
                </Button>
            </div>
        </Modal>
    )
}

export default LoginNavigateModal