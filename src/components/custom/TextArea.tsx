import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  label?: string;
}

function TextArea({rows, label, ...props}: TextAreaProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={label}
          className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        {...props}
        rows={rows}
        className='w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:ring-2 focus:ring-primary'
      />
    </div>
  )
}

export default TextArea