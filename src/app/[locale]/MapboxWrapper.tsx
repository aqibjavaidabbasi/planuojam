'use client';

import { ReactNode } from 'react';

interface MapboxWrapperProps {
  children: ReactNode;
}

function MapboxWrapper({ children }: MapboxWrapperProps) {
  return (
    <>
      {children}
    </>
  );
}

export default MapboxWrapper;
