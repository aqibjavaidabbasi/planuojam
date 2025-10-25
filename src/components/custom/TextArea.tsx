import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  label?: string;
  required?: boolean;
}

function TextArea({rows, label, required = false, ...props}: TextAreaProps) {
  // Generate a unique id for accessibility if not provided
  const textareaId = React.useId();

  return (
    <div>
      {label && (
        <label
          htmlFor={textareaId}
          className="block capitalize text-sm font-medium text-gray-700 mb-2 tracking-wider"
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId}
        rows={rows}
        required={required}
        className='w-full py-1.5 md:py-2.5 px-2.5 md:px-5 border border-border rounded-md text-base font-normal bg-white focus:outline-none focus:ring-2 focus:ring-primary'
      />
    </div>
  )
}

export default TextArea