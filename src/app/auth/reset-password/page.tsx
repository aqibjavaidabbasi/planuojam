'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/custom/Input'
import Button from '@/components/ui/Button'
import { useForm } from 'react-hook-form'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
    //   await resetPassword({ code, password: data.password })
    //   await resetPassword({ code, password })
     console.log(code, data)
    } catch (err: any) {
      console.error(err)
    } finally {
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              type="password"
              placeholder="New Password"
              {...register('password')}
              required
            />
              {errors.password?.message && (
                <div className="text-red-600 text-sm text-center">{String(errors.password.message)}</div>
              )}
            <Input
              type="password"
              placeholder="Confirm New Password"
              {...register('confirmPassword')}
              required
            />
            {errors.confirmPassword?.message && (
              <div className="text-red-600 text-sm text-center">{String(errors.confirmPassword.message)}</div>
            )}
            <Button type="submit" style='primary' extraStyles="!w-full !rounded-md">
              Reset Password
            </Button>
          </form>
        <div className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}