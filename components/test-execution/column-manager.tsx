'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { VisibilityState } from '@tanstack/react-table'

interface ColumnConfig {
  id: string
  label: string
  visible: boolean
  width: number
  order: number
  canHide: boolean
}

interface ColumnManagerProps {
  columns: ColumnConfig[]
  onColumnConfigChange: (config: ColumnConfig[]) => void
  onClose: () => void
  className?: string
}

interface DragDropItemProps {
  column: ColumnConfig
  index: number
  moveColumn: (fromIndex: number, toIndex: number) => void
  onVisibilityChange: (id: string, visible: boolean) => void
  onWidthChange: (id: string, width: number) => void
}

const DragDropItem = ({ 
  column, 
  index, 
  moveColumn, 
  onVisibilityChange, 
  onWidthChange 
}: DragDropItemProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragOver(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    setDragOver(e.clientY < midpoint ? 'top' : 'bottom')
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
    let toIndex = index
    
    if (dragOver === 'bottom') {
      toIndex = index + 1
    }
    
    if (fromIndex !== toIndex && fromIndex !== toIndex - 1) {
      moveColumn(fromIndex, toIndex > fromIndex ? toIndex - 1 : toIndex)
    }
    
    setDragOver(null)
  }

  return (
    <div
      className={`relative transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator */}
      {dragOver === 'top' && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}
      {dragOver === 'bottom' && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10" />
      )}

      <div
        className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md ${
          !column.visible ? 'opacity-60' : ''
        } ${isDragging ? 'shadow-lg' : 'hover:shadow-sm'} transition-shadow`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Visibility Toggle */}
        <button
          onClick={() => onVisibilityChange(column.id, !column.visible)}
          disabled={!column.canHide && column.visible}
          className={`p-1 rounded transition-colors ${
            !column.canHide && column.visible
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-gray-100'
          }`}
          title={column.visible ? 'Hide column' : 'Show column'}
        >
          {column.visible ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Column Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              column.visible ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {column.label}
            </span>
            <span className="text-xs text-gray-500">
              {column.width}px
            </span>
          </div>
        </div>

        {/* Width Control */}
        <div className="flex items-center gap-1">
          <input
            type="range"
            min="80"
            max="500"
            step="10"
            value={column.width}
            onChange={(e) => onWidthChange(column.id, parseInt(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            title={`Width: ${column.width}px`}
          />
        </div>
      </div>
    </div>
  )
}

export function ColumnManager({
  columns,
  onColumnConfigChange,
  onClose,
  className = ''
}: ColumnManagerProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...localColumns]
    const [movedColumn] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, movedColumn)
    
    // Update order values
    const updatedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index
    }))
    
    setLocalColumns(updatedColumns)
  }

  const handleVisibilityChange = (id: string, visible: boolean) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.id === id ? { ...col, visible } : col
      )
    )
  }

  const handleWidthChange = (id: string, width: number) => {
    setLocalColumns(prev => 
      prev.map(col => 
        col.id === id ? { ...col, width } : col
      )
    )
  }

  const handleApplyChanges = () => {
    onColumnConfigChange(localColumns)
    onClose()
  }

  const handleReset = () => {
    // Reset to default configuration
    const defaultColumns = localColumns.map((col, index) => ({
      ...col,
      visible: true,
      width: col.id === 'select' ? 50 : col.id === 'actions' ? 100 : 150,
      order: index
    }))
    setLocalColumns(defaultColumns)
  }

  const handleShowAll = () => {
    setLocalColumns(prev => 
      prev.map(col => ({ ...col, visible: true }))
    )
  }

  const handleHideAll = () => {
    setLocalColumns(prev => 
      prev.map(col => ({ 
        ...col, 
        visible: col.canHide ? false : col.visible 
      }))
    )
  }

  const visibleCount = localColumns.filter(col => col.visible).length
  const totalCount = localColumns.length

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Column Settings</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {visibleCount} of {totalCount} visible
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Quick Actions:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShowAll}
              className="px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              Show All
            </button>
            <button
              onClick={handleHideAll}
              className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Hide All
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Column List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-3">
            Drag columns to reorder, toggle visibility, and adjust width:
          </div>
          
          {localColumns
            .sort((a, b) => a.order - b.order)
            .map((column, index) => (
              <DragDropItem
                key={column.id}
                column={column}
                index={index}
                moveColumn={moveColumn}
                onVisibilityChange={handleVisibilityChange}
                onWidthChange={handleWidthChange}
              />
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Tip: Some columns cannot be hidden for functionality reasons
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyChanges}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Custom styles for the range slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
    </div>
  )
} 