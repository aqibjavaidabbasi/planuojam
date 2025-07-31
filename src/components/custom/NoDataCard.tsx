import React, { ReactNode } from 'react'

interface NoDataCardProps {
  children: ReactNode
}

function NoDataCard({ children }: NoDataCardProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 float-animation">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
        </div>
        <div className="text-left flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{children}</h3>
          <p className="text-gray-600 text-sm">Try expanding your search radius or check different locations.</p>
        </div>
      </div>
    </div>
  )
}

export default NoDataCard