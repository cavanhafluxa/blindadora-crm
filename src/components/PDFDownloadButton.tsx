'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'

export default function PDFDownloadButton({ document, fileName, children, className }: { document: any, fileName: string, children: React.ReactNode, className?: string }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return <button className={className}>Carregando...</button>

  return (
    <PDFDownloadLink document={document} fileName={fileName} className={className}>
      {/* @ts-ignore */}
      {({ loading }) => (
        <span className="flex items-center gap-2">
          {loading ? 'Gerando...' : children}
        </span>
      )}
    </PDFDownloadLink>
  )
}
