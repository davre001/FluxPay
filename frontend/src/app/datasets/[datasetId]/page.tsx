'use client';

import { useState, useMemo } from 'react'
import { Download, Filter, Search } from 'lucide-react'
import Link from 'next/link'

export default function DatasetView({ params }: { params: { datasetId: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterConfidence, setFilterConfidence] = useState(0)
  const [exportFormat, setExportFormat] = useState('csv')

  // Mock dataset
  const dataset = {
    id: params.datasetId,
    name: 'Lazada Price Tracking',
    createdAt: '2024-05-20T10:00:00Z',
    totalRows: 521,
    collections: 1,
  }

  const data = [
    {
      id: 1,
      product: 'iPhone 15 Pro Max',
      price: 1299.00,
      store: 'Lazada',
      seller: 'Apple Store Official',
      confidence: 99,
      source: 'https://lazada.com.ph/...',
      collectedAt: '2024-05-20 10:30 AM',
      worker: 'Worker-001',
      verifier: 'Verifier-A',
    },
    {
      id: 2,
      product: 'Samsung Galaxy S24',
      price: 899.00,
      store: 'Lazada',
      seller: 'Samsung Official',
      confidence: 97,
      source: 'https://lazada.com.ph/...',
      collectedAt: '2024-05-20 10:32 AM',
      worker: 'Worker-002',
      verifier: 'Verifier-B',
    },
    {
      id: 3,
      product: 'Google Pixel 8',
      price: 799.00,
      store: 'Lazada',
      seller: 'Google Store',
      confidence: 95,
      source: 'https://lazada.com.ph/...',
      collectedAt: '2024-05-20 10:34 AM',
      worker: 'Worker-001',
      verifier: 'Verifier-A',
    },
    {
      id: 4,
      product: 'OnePlus 12',
      price: 599.00,
      store: 'Lazada',
      seller: 'OnePlus Store',
      confidence: 92,
      source: 'https://lazada.com.ph/...',
      collectedAt: '2024-05-20 10:36 AM',
      worker: 'Worker-003',
      verifier: 'Verifier-C',
    },
  ]

  const filteredData = useMemo(() => {
    return data.filter(
      (row) =>
        (row.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.seller.toLowerCase().includes(searchTerm.toLowerCase())) &&
        row.confidence >= filterConfidence
    )
  }, [searchTerm, filterConfidence])

  const handleExport = () => {
    const content = exportFormat === 'csv'
      ? convertToCSV(filteredData)
      : JSON.stringify(filteredData, null, 2)
    
    const fileName = `dataset-${dataset.id}.${exportFormat}`
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/${exportFormat};charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', fileName)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map((row) => Object.values(row).join(','))
    return [headers, ...rows].join('\n')
  }

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
        <p className="text-gray-600 mt-1">Dataset ID: {dataset.id}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Rows</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dataset.totalRows}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Collections</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{dataset.collections}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900 mt-2">2024-05-20</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products, sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Confidence
            </label>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-medium text-gray-700">{filterConfidence}%</span>
            </div>
          </div>

          {/* Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Confidence</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Collected</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Proof</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{row.product}</p>
                    <p className="text-xs text-gray-500">{row.store}</p>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">₱{row.price}</td>
                <td className="py-3 px-4">{row.seller}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${row.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{row.confidence}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{row.collectedAt}</td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Proof Trail Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4">Data Provenance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Source</p>
            <p className="font-mono text-gray-900 mt-1">Lazada Platform API</p>
          </div>
          <div>
            <p className="text-gray-600">Verification Method</p>
            <p className="font-mono text-gray-900 mt-1">Automated + Manual Sampling</p>
          </div>
          <div>
            <p className="text-gray-600">Audit Trail</p>
            <p className="text-blue-600 hover:underline cursor-pointer">View on Chain →</p>
          </div>
        </div>
      </div>

      {/* Worker & Verifier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Workers</h3>
          <div className="space-y-2 text-sm">
            {['Worker-001', 'Worker-002', 'Worker-003'].map((worker) => (
              <div key={worker} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">{worker}</span>
                <span className="text-gray-600">5 results</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Verifiers</h3>
          <div className="space-y-2 text-sm">
            {['Verifier-A', 'Verifier-B', 'Verifier-C'].map((verifier) => (
              <div key={verifier} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">{verifier}</span>
                <span className="text-gray-600">4-5 results</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
