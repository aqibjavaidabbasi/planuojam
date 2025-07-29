import React, { ReactNode } from 'react'

interface NoDataCardProps {
  children: ReactNode
}

function NoDataCard({ children }: NoDataCardProps) {
  return (
    <div className="w-full flex justify-center items-center py-10">
      <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500 text-lg font-medium shadow">
        {children}
    </div>
</div>
  )
}

export default NoDataCard