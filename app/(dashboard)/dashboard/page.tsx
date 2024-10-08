'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Mic, MoreVertical, Edit2, Trash2, Tag, ChevronUp, ChevronDown, Pin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { UserButton } from '@clerk/clerk-react'

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
  isPinned: boolean;
}

const sampleNotes: Note[] = [
  { id: 1, title: "Meeting Notes", content: "Discuss project timeline and deliverables.", date: "2023-06-15", tags: ["work", "project"], isPinned: false },
  { id: 2, title: "Shopping List", content: "Milk, eggs, bread, fruits", date: "2023-06-16", tags: ["personal", "shopping"], isPinned: true },
  { id: 3, title: "Book Ideas", content: "Sci-fi novel about time travel", date: "2023-06-17", tags: ["creative", "writing"], isPinned: false },
  { id: 4, title: "Workout Plan", content: "Monday: Cardio, Tuesday: Strength Training", date: "2023-06-18", tags: ["health", "fitness"], isPinned: true },
]

const allTags = Array.from(new Set(sampleNotes.flatMap(note => note.tags)))

export default function Note() {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(sampleNotes)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const filtered = sampleNotes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedTag || note.tags.includes(selectedTag))
    )
    const sortedNotes = [...filtered].sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });
    setFilteredNotes(sortedNotes)
  }, [searchQuery, selectedTag])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery('')
    }
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  const toggleTags = () => {
    setShowTags(!showTags)
  }

  const togglePinNote = (id: number) => {
    const updatedNotes = filteredNotes.map(note =>
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    )
    const sortedNotes = updatedNotes.sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });
    setFilteredNotes(sortedNotes)
  }

  return (
    <div className="bg-gray-900 min-h-screen w-full max-w-md mx-auto p-6 text-white fixed inset-0 overflow-y-auto">
      <header className="flex justify-between items-center mb-6 relative">
        {!showSearch && <h2 className="text-2xl font-semibold">My Notes</h2>}
        <div className={`flex items-center space-x-2 ${showSearch ? 'w-full' : ''}`}>
          {showSearch ? (
            <div className="flex-grow flex items-center bg-gray-800 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none px-3 py-2 w-full text-sm"
                autoFocus
              />
              <Mic className="w-5 h-5 mr-2 text-gray-400" />
            </div>
          ) : null}
          <button
            onClick={toggleSearch}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {showSearch ? <X size={24} /> : <Search size={24} />}
          </button>
          {!showSearch && (
              <UserButton />
          )}
        </div>
      </header>

      <div className="mb-4 relative">
        {showTags && (
          <div className="scrollbar-none overflow-x-auto whitespace-nowrap pb-2">
          <div className="inline-flex space-x-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTag === tag
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Tag size={14} className="inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
        )}
        <button
          onClick={toggleTags}
          className="absolute right-0 bottom-0 bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          {showTags ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 py-8">
            No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors relative flex flex-col h-full">
              <h3 className="font-semibold mb-2">{note.title}</h3>
              <p className="text-sm text-gray-400 mb-2 flex-grow">{note.content.substring(0, 50)}...</p>
              <div className="mt-auto">
                <p className="text-xs text-gray-500 mb-2">{note.date}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {note.isPinned && (
                <Pin size={16} className="absolute bottom-2 right-2 text-purple-500" />
              )}
              <div className="absolute top-2 right-2" ref={dropdownRef}>
                <button
                  onClick={() => setActiveDropdown(activeDropdown === note.id ? null : note.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
                {activeDropdown === note.id && (
                  <div className="absolute right-0 mt-2 w-32 bg-gray-700 rounded-md shadow-lg z-10">
                    <Link href={`/edit-note/${note.id}`} className="block px-4 py-2 text-sm text-white hover:bg-gray-600">
                      <Edit2 size={14} className="inline mr-2" />
                      Edit Note
                    </Link>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                      onClick={() => togglePinNote(note.id)}
                    >
                      <Pin size={14} className="inline mr-2" />
                      {note.isPinned ? 'Unpin Note' : 'Pin Note'}
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600">
                      <Trash2 size={14} className="inline mr-2" />
                      Delete Note
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <Link href="/create-note" className="fixed bottom-6 right-6 bg-purple-600 p-3 rounded-full text-white hover:bg-purple-700 transition-colors">
        <Plus size={24} />
      </Link>
    </div>
  )
}