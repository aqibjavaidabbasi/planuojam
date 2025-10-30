'use client'

import React from 'react'
import Modal from '../custom/Modal'
import Button from '../custom/Button'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

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
                        router.push('/auth/login')
                        setShowModal(false)
                    }} 
                    size="small">{t('loginCta')}
                </Button>
            </div>
        </Modal>
    )
}

export default LoginNavigateModal