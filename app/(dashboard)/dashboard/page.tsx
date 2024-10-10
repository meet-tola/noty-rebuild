"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Plus,
  Mic,
  MoreVertical,
  Edit2,
  Trash2,
  Tag,
  ChevronUp,
  ChevronDown,
  Pin,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/clerk-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: { id: number; name: string; userId: string }[];
  isPinned: boolean;
}

interface Tag {
  id: number;
  name: string;
  userId: string;
}

export default function Note() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, []);

  useEffect(() => {
    if (searchQuery === "" && selectedTag === null) {
      fetchNotes();
    } else {
      const filtered = filteredNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!selectedTag || note.tags.some((tag) => tag.name === selectedTag))
      );

      const sortedNotes = [...filtered].sort((a, b) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      });

      setFilteredNotes(sortedNotes);
    }
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/note");
      const notes = response.data.map((note: any) => ({
        ...note,
        tags: note.tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          userId: tag.userId,
        })),
      }));
      const sortedNotes = notes.sort((a: Note, b: Note) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
      });
      setFilteredNotes(sortedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get<Tag[]>("/api/note/tags");
      setAllTags(response.data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleTagClick = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
      fetchNotes();
    }
  };

  const toggleTags = () => {
    setShowTags(!showTags);
  };

  const togglePinNote = async (id: number, isPinned: boolean) => {
    try {
      await axios.patch(`/api/note/pin/${id}`, {
        isPinned: !isPinned,
      });
      setActiveDropdown(null);
      fetchNotes();
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(`/api/note/${id}`);
      setActiveDropdown(null);
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const stripHtml = (htmlString: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  return (
    <div className="bg-gray-950 min-h-screen w-full max-w-md mx-auto p-6 text-gray-100">
      <div className="flex justify-between items-center mb-6 relative">
        {!showSearch && <h2 className="text-2xl font-semibold">My Notes</h2>}
        <div
          className={`flex items-center space-x-2 ${
            showSearch ? "w-full" : ""
          }`}
        >
          {showSearch ? (
            <div className="flex-grow flex items-center bg-gray-900 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none px-3 py-2 w-full text-sm text-gray-100"
                autoFocus
              />
              <Mic className="w-5 h-5 mr-2 text-gray-400" />
            </div>
          ) : null}
          <button
            onClick={toggleSearch}
            className="text-gray-300 hover:text-gray-100 transition-colors"
          >
            {showSearch ? <X size={24} /> : <Search size={24} />}
          </button>
          {!showSearch && <UserButton />}
        </div>
      </div>

      <div className="mb-4 relative">
        {showTags && (
          <div className="scrollbar-none overflow-x-auto whitespace-nowrap pb-2">
            <div className="inline-flex space-x-2">
              {isLoading
                ? Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <Skeleton
                        key={index}
                        className="w-20 h-8 rounded-full bg-gray-800"
                      />
                    ))
                : allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.name)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedTag === tag.name
                          ? "bg-purple-700 text-gray-100"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <Tag size={14} className="inline mr-1" />
                      {tag.name}
                    </button>
                  ))}
            </div>
          </div>
        )}
        <button
          onClick={toggleTags}
          className="absolute right-0 bottom-0 bg-gray-900 p-1 rounded-full text-gray-400 hover:text-gray-100 transition-colors"
        >
          {showTags ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, index) => (
              <Skeleton
                key={index}
                className="h-40 w-full rounded-lg bg-gray-800"
              />
            ))
        ) : filteredNotes.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 py-8">
            No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-900 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors relative flex flex-col h-full"
              onClick={() => (window.location.href = `/edit-note/${note.id}`)}
            >
              <h3 className="font-semibold mb-2 text-gray-100">{note.title}</h3>
              <p className="text-sm text-gray-400 mb-2 flex-grow">
                {stripHtml(note.content).substring(0, 50)}...
              </p>
              <div className="mt-auto">
                <p className="text-xs text-gray-500 mb-2">{note.date}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              {note.isPinned && (
                <Pin
                  size={16}
                  className="absolute bottom-2 right-2 text-purple-500"
                />
              )}
              <div className="absolute top-2 right-2" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(
                      activeDropdown === note.id ? null : note.id
                    );
                  }}
                  className="text-gray-400 hover:text-gray-100 transition-colors"
                >
                  <MoreVertical size={16} />
                </button>
                {activeDropdown === note.id && (
                  <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg z-10">
                    <Link
                      href={`/edit-note/${note.id}`}
                      className="block px-4 py-2 text-sm text-gray-100 hover:bg-gray-700"
                    >
                      <Edit2 size={14} className="inline mr-2" />
                      Edit Note
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinNote(note.id, note.isPinned);
                      }}
                    >
                      <Pin size={14} className="inline mr-2" />
                      {note.isPinned ? "Unpin Note" : "Pin Note"}
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 size={14} className="inline mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <Link
        href="/create-note"
        className="fixed bottom-6 right-6 bg-purple-700 p-3 rounded-full text-gray-100 hover:bg-purple-800 transition-colors"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
