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
        className='py-2 md:py-3.5 px-3 md:px-7 border custom-border-color rounded-md text-base font-normal bg-white'
      />
    </div>
  )
}

export default Input