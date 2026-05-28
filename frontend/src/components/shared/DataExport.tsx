'use client';

import { Download, FileJson, Sheet } from 'lucide-react'
import { formatters } from '@/utils'

export interface ExportData {
  headers: string[]
  rows: (string | number | boolean)[][]
  filename: string
}

interface DataExportProps {
  data: Record<string, any>[]
  filename: string
  title?: string
}

export function DataExport({ data, filename, title }: DataExportProps) {
  const downloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    downloadFile(blob, `${filename}.json`)
  }

  const downloadCSV = () => {
    if (data.length === 0) return

    // Get headers from first object
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${filename}.csv`)
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (data.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
      
      <div className="flex gap-2">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          title="Download as CSV"
        >
          <Sheet size={18} />
          Export CSV
        </button>
        
        <button
          onClick={downloadJSON}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          title="Download as JSON"
        >
          <FileJson size={18} />
          Export JSON
        </button>
      </div>
    </div>
  )
}

/**
 * Utility function to export data directly
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Utility function to export data as JSON
 */
export function exportToJSON(data: Record<string, any>[], filename: string) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  downloadBlob(blob, `${filename}.json`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
