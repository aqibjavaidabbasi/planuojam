'use client'
import React from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/custom/Input'
import { useForm } from 'react-hook-form'


function EmailConfirmationPage() {
  const { register, handleSubmit, formState:{errors} } = useForm();

  //POST /api/auth/email-confirmation
  // Body: { confirmation: "<token>" }

  const handleResend = async () => {
    // Logic to resend confirmation email
    console.log("Resend confirmation email");
  }

  function onSubmit(data: Record<string, unknown>) {
    console.log("Confirmation data::", data);
    // Logic to handle email confirmation
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Email Confirmation</h2>
        <div className="text-center text-base">
          <span>
            Please confirm your email address to activate your account.
          </span>
          <br />
          <span className="text-muted-foreground text-sm">
            If you did not receive the confirmation email, you can resend it below.
          </span>
        </div>
        <div>
          <form action="" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input type='text' 
              label='Confirmation Token' 
              placeholder='Enter confirmation token from email' 
              {...register('confirmation', {
                required: "Confirmation token is required",
              })}
            />
            <Button type='submit' style='primary' extraStyles='!w-full mt-4'>
              Confirm Email
            </Button>
          </form>
        </div>
        <div className="w-full flex items-center justify-center">
          <Button
            onClick={handleResend}
            type="button"
            style='link'
          >
            Resend Confirmation Email
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmationPage