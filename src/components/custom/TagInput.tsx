"use client"
import React, { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Input from './Input'
import { fetchTagsByIds } from '../../services/tags'

export type Tag = {
  documentId: string
  name: string
}

interface TagInputProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  disabled?: boolean
  maxTags?: number
  placeholder?: string
  className?: string
  locale?: string
}

export default function TagInput({ 
  selectedTagIds, 
  onTagsChange, 
  disabled = false, 
  maxTags = 10,
  placeholder,
  className = "",
  locale = "en"
}: TagInputProps) {
  
  const t = useTranslations("TagInput")
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noHitPrefix, setNoHitPrefix] = useState<string>('')
  const [tagNames, setTagNames] = useState<Record<string, string>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Fetch tag suggestions based on input
  useEffect(() => {
    const q = inputValue.trim()
    
    if (!q || q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setNoHitPrefix('')
      return
    }

    if (selectedTagIds.length >= maxTags) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // If we already got no results for a prefix and user keeps extending it, skip requests
    if (noHitPrefix && q.startsWith(noHitPrefix) && q.length >= noHitPrefix.length) {
      setSuggestions([])
      setShowSuggestions(true)
      return
    }

    setLoading(true)
    setError(null)
    const handle = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tags/search?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}&limit=5`)
        const data = await response.json()
        
        if (data.success) {
          // Filter out already selected tags
          const filtered = data.data.filter((tag: Tag) => !selectedTagIds.includes(tag.documentId))
          setSuggestions(filtered)
          setShowSuggestions(true)
          
          if (!filtered || filtered.length === 0) {
            // Record this prefix to avoid further requests until user deletes
            setNoHitPrefix(q)
          } else if (noHitPrefix) {
            // Clear no-hit lockout if we now have data
            setNoHitPrefix('')
          }
        } else {
          setError(t('errorLoading'))
        }
      } catch {
        setError(t('errorLoading'))
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce for 300ms

    return () => clearTimeout(handle)
  }, [inputValue, selectedTagIds, maxTags, locale, noHitPrefix, t])

  const handleTagSelect = (tag: Tag) => {
    if (selectedTagIds.length >= maxTags) return
    
    onTagsChange([...selectedTagIds, tag.documentId])
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleAddTag = async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || selectedTagIds.length >= maxTags) return

    // Check if tag already exists in suggestions
    const existingTag = suggestions.find(tag => 
      tag.name.toLowerCase() === trimmedInput.toLowerCase()
    )

    if (existingTag) {
      // Use existing tag from suggestions
      onTagsChange([...selectedTagIds, existingTag.documentId])
    } else {
      // Create new tag
      try {
        const response = await fetch(`/api/tags?locale=${encodeURIComponent(locale)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedInput })
        })
        const result = await response.json()
        
        if (result.success) {
          // Add the newly created tag
          onTagsChange([...selectedTagIds, result.data.documentId])
          
          // Update tag names cache to show the new tag immediately
          setTagNames(prev => ({
            ...prev,
            [result.data.documentId]: trimmedInput
          }))
        } else {
          // If creation fails, add as string (will be handled by parent)
          if (!selectedTagIds.includes(trimmedInput)) {
            onTagsChange([...selectedTagIds, trimmedInput])
          }
        }
      } catch {
        // If API fails, add as string (will be handled by parent)
        if (!selectedTagIds.includes(trimmedInput)) {
          onTagsChange([...selectedTagIds, trimmedInput])
        }
      }
    }

    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleRemoveTag = (tagIdToRemove: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagIdToRemove))
  }

  // Fetch tag names for selected tags
  useEffect(() => {
    const fetchTagNames = async () => {
      if (!selectedTagIds.length) {
        setTagNames({})
        return
      }

      // Filter out non-documentId strings (new tags that are just names)
      const documentIds = selectedTagIds

      if (!documentIds.length) {
        // All tags are new (just names), no need to fetch
        const names: Record<string, string> = {}
        selectedTagIds.forEach(id => {
          names[id] = id // Use the tag name directly
        })
        setTagNames(names)
        return
      }

      try {
        const tags = await fetchTagsByIds(documentIds, locale)

        if (tags.length > 0) {
          const names: Record<string, string> = {}
          
          // Map fetched tag names
          tags.forEach((tag) => {
            names[tag.documentId] = tag.name
          })
          
          // Add new tags (non-documentId) as-is
          selectedTagIds.forEach(id => {
            if (!names[id]) {
              names[id] = id // New tag, use the string directly
            }
          })
          
          setTagNames(names)
        }
      } catch (error) {
        console.error('Error fetching tag names:', error)
        // Fallback: use IDs as names
        const names: Record<string, string> = {}
        selectedTagIds.forEach(id => {
          names[id] = id
        })
        setTagNames(names)
      }
    }

    fetchTagNames()
  }, [selectedTagIds, locale])


  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected Tags */}
      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagIds.map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
            >
              {tagNames[tagId] || tagId}
              <button
                type="button"
                onClick={() => handleRemoveTag(tagId)}
                className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                disabled={disabled}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag Input with Suggestions */}
      <div className="relative" ref={containerRef}>
        <Input
          type="text"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          placeholder={selectedTagIds.length >= maxTags ? t('maxTagsReached', { max: maxTags }) : (placeholder || t('placeholder'))}
          disabled={disabled || selectedTagIds.length >= maxTags}
          onFocus={() => inputValue.trim().length >= 2 && setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddTag()
            } else if (e.key === 'Escape') {
              setShowSuggestions(false)
            }
          }}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-500">{t('loading')}</div>
            )}
            {!loading && error && (
              <div className="px-3 py-2 text-sm text-red-500">{t('errorLoading')}</div>
            )}
            {!loading && !error && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">{t('noMatchingTags')}</div>
            )}
            {!loading && !error && suggestions.length > 0 && (
              suggestions.map((tag) => (
                <button
                  key={tag.documentId}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleTagSelect(tag)}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        type="button"
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleAddTag}
        disabled={disabled || !inputValue.trim() || selectedTagIds.length >= maxTags}
      >
        {t('addTag')}
      </button>
    </div>
  )
}
