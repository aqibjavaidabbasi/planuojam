import React from 'react'

interface ButtonProps {
    style: 'primary' | 'secondary';
    children: React.ReactNode;
    extraStyles?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    type?: 'button' | 'submit' | 'reset';
}

function Button({
    style,
    children,
    extraStyles = '',
    onClick = () => {},
    type = 'button'
}: ButtonProps) {
    const styles = {
        primary: 'rounded-full bg-primary text-white py-2 md:py-3.5 px-3 md:px-7 cursor-pointer font-medium hover:bg-black',
        secondary: 'rounded-md bg-black text-white py-2 md:py-3.5 px-3 md:px-7 cursor-pointer font-medium hover:bg-primary'
    } as const;
  return (
    <button onClick={onClick} type={type} className={`${styles[style as keyof typeof styles]} ${extraStyles}`} >{children}</button>
  )
}

export default Button