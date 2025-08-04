import Loader from '@/components/ui/Loader'
import React from 'react'

function loading() {
  return (
    <div className='h-screen w-screen'>
        <Loader />
    </div>
  )
}

export default loading