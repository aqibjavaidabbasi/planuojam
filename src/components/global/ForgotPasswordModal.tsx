'use client'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { getCompleteImageUrl } from '@/utils/helpers'
import Image from 'next/image'
import React from 'react'
import Input from '../custom/Input'
import Button from '../ui/Button'
import { useForm } from 'react-hook-form'

function ForgotPasswordModal() {

    const { siteSettings } = useSiteSettings();
    const { formState: { errors }, handleSubmit, register } = useForm();

    function onSubmit(data: Record<string, unknown>) {
        console.log("form data::", data);   
    }

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden relative">
                    <Image
                        alt="site logo"
                        src={getCompleteImageUrl(siteSettings.siteLogo.url)}
                        width={80}
                        height={80}
                        style={{ objectFit: "cover" }}
                    />
                </div>
                <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                <p className="text-sm">Enter your email address and we'll send you a link to reset your password</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <Input
                    type='email'
                    label='email'
                    placeholder='Enter your email'
                    {...register('email', {
                        required: "Email is required",
                        pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            message: "Invalid email address"
                        }
                    })}
                />
                {typeof errors?.email?.message === 'string' && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}

                <Button style='secondary' type='submit' extraStyles='!w-full' >Send Reset Link</Button>
            </form>
        </div>
    )
}

export default ForgotPasswordModal