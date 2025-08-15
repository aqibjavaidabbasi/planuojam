import React from 'react'

interface ButtonProps {
  style: 'primary' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'small' | 'large';
  children: React.ReactNode;
  extraStyles?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

function Button({
  style,
  size = 'default',
  children,
  extraStyles = '',
  onClick = () => { },
  type = 'button',
  disabled = false
}: ButtonProps) {
  const styles = {
    primary: 'rounded-full bg-primary text-white hover:bg-black',
    secondary: 'rounded-md bg-black text-white hover:bg-primary',
    ghost: 'rounded-md bg-transparent hover:bg-gray-100 text-black border border-transparent hover:border-gray-400 shadow-none',
    link: 'text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
    destructive: 'rounded-md bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500'
  } as const;

  const sizes = {
    default: 'py-1.5 md:py-2.5 px-2.5 md:px-5 text-base',
    small: 'py-1 px-3 text-sm',
    large: 'py-2 md:py-3 px-4 md:px-8 text-lg'
  } as const;

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`flex items-center capitalize justify-center gap-1.5 font-medium ${styles[style]} ${sizes[size]} ${extraStyles} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none whitespace-nowrap' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}
export default Button