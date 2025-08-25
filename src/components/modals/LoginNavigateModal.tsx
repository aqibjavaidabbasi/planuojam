'use client'

import React from 'react'
import Modal from '../custom/Modal'
import Button from '../custom/Button'

function LoginNavigateModal({showModal, setShowModal}: {showModal: boolean, setShowModal: (showModal: boolean) => void}) {
    return (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <div className='flex flex-col gap-4 items-center'>
                <h2>Login to like this listing</h2>
                <p>By logging in, you can save this listing to your favorites and receive updates when it's available.</p>
                <Button style="primary" onClick={() => setShowModal(false)} size="small">Login</Button>
            </div>
        </Modal>
    )
}

export default LoginNavigateModal