"use client";

import { useState, useEffect } from "react";
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
  List,
  Grid,
  Check,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/clerk-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface GroupedNotes {
  [key: string]: Note[];
}

export default function Note() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [groupedNotes, setGroupedNotes] = useState<GroupedNotes>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"gallery" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);

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
        if (a.isPinned === b.isPinned) {
          if (sortBy === "date") {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } else {
            return a.title.localeCompare(b.title);
          }
        }
        return a.isPinned ? -1 : 1;
      });

      setFilteredNotes(sortedNotes);
      setGroupedNotes(groupNotesByDate(sortedNotes));
    }
  }, [searchQuery, selectedTag, sortBy]);

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
      setGroupedNotes(groupNotesByDate(sortedNotes));
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
      fetchNotes();
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(`/api/note/${id}`);
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const deleteSelectedNotes = async () => {
    setDeletingNote(true);
    try {
      await Promise.all(
        selectedNotes.map((id) => axios.delete(`/api/note/${id}`))
      );
      setSelectedNotes([]);
      setIsSelectionMode(false);
      setDeletingNote(false);
      fetchNotes();
    } catch (error) {
      console.error("Error deleting selected notes:", error);
    }
  };

  const stripHtml = (htmlString: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const handleSortChange = (newSortBy: "date" | "title") => {
    setSortBy(newSortBy);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "gallery" ? "list" : "gallery");
  };

  const groupNotesByDate = (notes: Note[]): GroupedNotes => {
    const grouped: GroupedNotes = {
      Today: [],
      Yesterday: [],
      "Previous 7 days": [],
      "Previous 30 days": [],
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    notes.forEach((note) => {
      const noteDate = new Date(note.date);
      noteDate.setHours(0, 0, 0, 0);
      if (noteDate.getTime() === today.getTime()) {
        grouped.Today.push(note);
      } else if (noteDate.getTime() === yesterday.getTime()) {
        grouped.Yesterday.push(note);
      } else if (noteDate >= sevenDaysAgo) {
        grouped["Previous 7 days"].push(note);
      } else if (noteDate >= thirtyDaysAgo) {
        grouped["Previous 30 days"].push(note);
      } else {
        const monthYear = noteDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(note);
      }
    });

    return grouped;
  };

  const toggleNoteSelection = (id: number) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const renderNoteCard = (note: Note) => (
    <div
      key={note.id}
      className={`bg-gray-900 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors relative ${
        viewMode === "gallery" ? "h-32" : "h-20"
      }`}
      onClick={() =>
        isSelectionMode
          ? toggleNoteSelection(note.id)
          : (window.location.href = `/edit-note/${note.id}`)
      }
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-100 truncate pr-6">
          {note.title || "No title"}
        </h3>
        {isSelectionMode ? (
          <div
            className={`w-5 h-5 border-2 rounded ${
              selectedNotes.includes(note.id)
                ? "bg-purple-500 border-purple-500"
                : "border-gray-400"
            }`}
          >
            {selectedNotes.includes(note.id) && (
              <Check size={16} className="text-white" />
            )}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-gray-100 transition-colors absolute top-4 right-4"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/edit-note/${note.id}`;
                }}
              >
                <Edit2 size={14} className="mr-2" />
                Edit Note
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePinNote(note.id, note.isPinned);
                }}
              >
                <Pin size={14} className="mr-2" />
                {note.isPinned ? "Unpin Note" : "Pin Note"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-sm text-gray-400 truncate flex-grow pr-2">
          {stripHtml(note.content)}
        </p>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(note.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      {viewMode === "gallery" && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap gap-1 mt-2">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      )}
      {note.isPinned && (
        <Pin size={16} className="absolute top-4 right-10 text-purple-500" />
      )}
    </div>
  );

  return (
    <div className="bg-gray-950 min-h-screen w-full max-w-md mx-auto p-6 text-gray-100">
      <div className="flex justify-between items-center mb-6 relative">
        {!showSearch && !isSelectionMode && (
          <h2 className="text-2xl font-semibold">My Notes</h2>
        )}
        {isSelectionMode && (
          <div className="flex items-center space-x-4">
            <span>{selectedNotes.length} selected</span>
            <button
              onClick={deleteSelectedNotes}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              {deletingNote ? "Deleting" : "Delete"}
            </button>
          </div>
        )}
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
          ) : (
            <button
              onClick={toggleSearch}
              className="text-gray-300 hover:text-gray-100 transition-colors"
            >
              <Search size={24} />
            </button>
          )}
          {showSearch && (
            <button
              onClick={toggleSearch}
              className="text-gray-300 hover:text-gray-100 transition-colors"
            >
              <X size={24} />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-300 hover:text-gray-100 transition-colors">
                <MoreVertical size={24} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => setIsSelectionMode(!isSelectionMode)}
              >
                {isSelectionMode ? "Cancel Selection" : "Select Notes"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange("date")}>
                Sort by Date
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange("title")}>
                Sort by Title
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={toggleViewMode}>
                View by {viewMode === "gallery" ? "List" : "Gallery"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <div key={tag.id} className="flex items-center gap-2">
                      <span>Search by Tags:</span>
                      <button
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
                    </div>
                  ))}
            </div>
          </div>
        )}
        <button
          onClick={toggleTags}
          className="absolute right-0 top-0 bg-gray-900 p-1 rounded-full text-gray-400 hover:text-gray-100 transition-colors"
        >
          {showTags ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div
        className={`${
          viewMode === "gallery" ? "grid grid-cols-2 gap-4" : "space-y-4"
        }`}
      >
        {isLoading ? (
          <div
            className={`${
              viewMode === "gallery" ? "grid grid-cols-2 gap-4" : "space-y-4"
            }`}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 w-full rounded-lg bg-gray-800"
                />
              ))}
          </div>
        ) : (
          Object.entries(groupedNotes).map(
            ([dateGroup, notes]) =>
              notes.length > 0 && (
                <div
                  key={dateGroup}
                  className={`mb-6 ${
                    viewMode === "gallery" ? "col-span-2" : ""
                  }`}
                >
                  <h3 className="text-lg font-bold mb-2">{dateGroup}</h3>
                  <div
                    className={`${
                      viewMode === "gallery"
                        ? "grid grid-cols-2 gap-4"
                        : "space-y-4"
                    }`}
                  >
                    {notes.map(renderNoteCard)}
                  </div>
                </div>
              )
          )
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
