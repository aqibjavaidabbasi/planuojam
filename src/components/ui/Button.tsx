import React from 'react'

function Button({style, children}: {style: string, children: React.ReactNode}) {
    const styles = {
        primary: 'rounded-full bg-primary text-white py-3.5 px-7 cursor-pointer font-medium hover:bg-black'
    } as const;
  return (
    <button className={`${styles[style as keyof typeof styles]}`} >{children}</button>
  )
}

export default Button