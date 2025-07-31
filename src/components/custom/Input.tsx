import React, { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  type: string
}

function Input({ type, ...props }: InputProps) {
  return (
    <div>
      <input
        type={type}
        {...props}
        className='w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:ring-2 focus:ring-primary'
      />
    </div>
  )
}

export default Input