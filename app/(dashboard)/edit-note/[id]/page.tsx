"use client"

import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  Trash2,
  Mic,
  Sparkles,
  Plus,
  Bold,
  Italic,
  List,
  ListOrdered,
  Play,
  Pause,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import axios from 'axios'
import { useRouter } from 'next/navigation'
import dynamic from "next/dynamic"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

const TiptapEditor = dynamic(
  () => import("@tiptap/react").then((mod) => mod.EditorContent),
  {
    ssr: false,
  }
)

const sampleTags = ["work", "personal", "ideas", "todo", "important"]

export default function EditNote({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] text-white",
      },
    },
    onUpdate: ({ editor }) => {
      // Handle content update if needed
    },
    immediatelyRender: false, 
  })

  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(`/api/note/${params.id}`)
        const note = response.data
        
        setTitle(note.title)
        setTags(note.tags.map((tag: { id: string, name: string }) => tag.name))
        editor?.commands.setContent(note.content)
        setRecordingUrl(note.recording)
      } catch (error) {
        console.error('Error fetching note:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNote()
  }, [params.id, editor])

  useEffect(() => {
    if (recordingUrl && audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setTotalDuration(audioRef.current?.duration || 0)
      })
    }
  }, [recordingUrl])

  const saveNote = async () => {
    setIsSaving(true)
    try {
      const content = editor?.getHTML() || ''
      const response = await axios.patch(`/api/note/${params.id}`, {
        title,
        content,
        tags,
      })

      if (response.status === 200) {
        router.push('/dashboard')
      } else {
        console.error('Failed to update note:', response.data)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNote = async () => {
    try {
      const response = await axios.delete(`/api/note/${params.id}`)
      if (response.status === 200) {
        router.push('/dashboard')
      } else {
        console.error('Failed to delete note:', response.data)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const addTag = (tag: string) => {
    if (tags && Array.isArray(tags) && !tags.includes(tag)) {
      setTags((prevTags) => [...prevTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return '00:00'
    }
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const handleMetadataLoaded = () => {
      setTotalDuration(audioRef.current?.duration || 0)
    }

    const handleTimeUpdate = () => {
      setPlaybackTime(audioRef.current?.currentTime || 0)
    }

    const audioElement = audioRef.current
    if (audioElement) {
      audioElement.addEventListener('loadedmetadata', handleMetadataLoaded)
      audioElement.addEventListener('timeupdate', handleTimeUpdate)
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('loadedmetadata', handleMetadataLoaded)
        audioElement.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [recordingUrl])

  return (
    <div className="bg-gray-950 min-h-screen w-full max-w-md mx-auto p-6 text-white relative">
      {(isLoading) && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}
      <header className="flex justify-between items-center mb-6">
        <Link
          href="/dashboard"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex space-x-2 items-center">
          <button 
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center"
            onClick={saveNote}
            disabled={isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Saving
              </>
            ) : (
              "Save"
            )}
          </button>
          <button 
            className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
            onClick={deleteNote}
            disabled={isLoading || isSaving}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-white text-2xl font-bold placeholder-gray-500 focus:outline-none"
          disabled={isLoading}
        />
        <div className="border-t border-b border-gray-700 py-2 mb-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded ${
                editor?.isActive("bold") ? "bg-gray-700" : ""
              }`}
              disabled={isLoading}
            >
              <Bold size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${
                editor?.isActive("italic") ? "bg-gray-700" : ""
              }`}
              disabled={isLoading}
            >
              <Italic size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${
                editor?.isActive("bulletList") ? "bg-gray-700" : ""
              }`}
              disabled={isLoading}
            >
              <List size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${
                editor?.isActive("orderedList") ? "bg-gray-700" : ""
              }`}
              disabled={isLoading}
            >
              <ListOrdered size={20} />
            </button>
          </div>
        </div>
        <TiptapEditor editor={editor} />
      </form>
      <div className="fixed bottom-24 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <Sparkles size={24} />
      </div>
      <div className="fixed bottom-6 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <Mic size={24} />
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2 mb-4">
        {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-700 text-white px-2 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  &times;
                </button>
              </span>
            ))
          ) : (
            <p className="text-gray-500">No tags available</p>
          )}
        </div>
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Add tags to your note:</h4>
          <div className="flex flex-wrap gap-2">
            {sampleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="bg-gray-700 text-white px-2 py-1 rounded-full text-sm hover:bg-gray-600 transition-colors flex items-center"
                disabled={isLoading}
              >
                <Plus size={14} className="mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      {recordingUrl && (
        <div className="mt-8 bg-gray-800 p-4 rounded-lg">
          <audio ref={audioRef} src={recordingUrl} />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={togglePlayback}
                className={`p-2 rounded-full ${isPlaying ? "bg-purple-600" : "bg-green-600"}`}
                disabled={isLoading}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <span className="text-sm">
                {formatTime(playbackTime)} 
              </span>
            </div>
            <div className="w-1/2 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full"
                style={{ width: `${(playbackTime / totalDuration) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}