"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
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
  CircleEllipsis,
  Share,
  Pin,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoogleGenerativeAI } from "@google/generative-ai";

const TiptapEditor = dynamic(
  () => import("@tiptap/react").then((mod) => mod.EditorContent),
  {
    ssr: false,
  }
);

const sampleTags = ["work", "personal", "ideas", "todo", "important"];

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string
);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default function EditNote({ params }: { params: { id: string } }) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pinnedNote, setPinnedNote] = useState("");

  const [isLoaderLoading, setIsLoaderLoading] = useState(false);

  const router = useRouter();

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
      autoSave();
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/note/${params.id}`);
        const note = response.data;

        setTitle(note.title);
        setTags(note.tags.map((tag: { id: string; name: string }) => tag.name));
        editor?.commands.setContent(note.content);
        setRecordingUrl(note.recording);
        setPinnedNote(note.isPinned);
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [params.id, editor]);

  useEffect(() => {
    if (recordingUrl && audioRef.current) {
      audioRef.current.addEventListener("loadedmetadata", () => {
        setTotalDuration(audioRef.current?.duration || 0);
      });
    }
  }, [recordingUrl]);

  const autoSave = useCallback(
    debounce(async () => {
      setIsSaving(true);
      setIsSaved(false);
      try {
        const content = editor?.getHTML() || "";
        await axios.patch(`/api/note/${params.id}`, {
          title,
          content,
          tags,
        });
      } catch (error) {
        console.error("Error updating note:", error);
      } finally {
        setIsSaving(false);
        setIsSaved(true);
      }
    }, 2000), // 2 seconds debounce
    [title, editor, tags]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    autoSave();
  };
  // const saveNote = async () => {
  //   setIsSaving(true);
  //   try {
  //     const content = editor?.getHTML() || "";
  //     await axios.patch(`/api/note/${params.id}`, {
  //       title,
  //       content,
  //       tags,
  //     });
  //   } catch (error) {
  //     console.error("Error updating note:", error);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const deleteNote = async () => {
    try {
      const response = await axios.delete(`/api/note/${params.id}`);
      if (response.status === 200) {
        router.push("/dashboard");
      } else {
        console.error("Failed to delete note:", response.data);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const addTag = (tag: string) => {
    if (tags && Array.isArray(tags) && !tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      autoSave(updatedTags);
    }
  };

  const removeTag = async (tag: string) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    setIsSaved(false);

    try {
      const response = await axios.patch(`/api/note/${params.id}`, {
        tags: updatedTags,
      });
      if (response.data.tags) {
        setTags(response.data.tags);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      setTags((prevTags) => [...prevTags, tag]);
    } finally {
      setIsSaved(true);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) {
      return "00:00";
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const handleMetadataLoaded = () => {
      setTotalDuration(audioRef.current?.duration || 0);
    };

    const handleTimeUpdate = () => {
      setPlaybackTime(audioRef.current?.currentTime || 0);
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("loadedmetadata", handleMetadataLoaded);
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener(
          "loadedmetadata",
          handleMetadataLoaded
        );
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [recordingUrl]);

  const shareNote = () => {
    // Implement share functionality
    console.log("Sharing note...");
  };

  const pinNote = async (isPinned: boolean) => {
    try {
      await axios.patch(`/api/note/pin/${params.id}`, {
        isPinned: !isPinned,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const handleSparklesClick = async () => {
    if (!editor) {
      console.error("Editor is not initialized.");
      return;
    }

    const content = editor?.getHTML() || "";

    if (!content || content.trim() === "") {
      console.error("No content to rephrase.");
      return;
    }

    setIsLoaderLoading(true); // Start loading
    try {
      const prompt = `Rephrase the following content to improve clarity and grammar:\n\n${content}`;
      const result = await model.generateContent(prompt);
      const rephrasedText = result.response.text();

      // Insert rephrased content back into the editor
      editor.chain().focus().setContent(rephrasedText).run();
    } catch (error) {
      console.error("Error generating rephrased content:", error);
    } finally {
      setIsLoaderLoading(false); // Stop loading
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen w-full max-w-md mx-auto p-6 text-white relative">
      {isLoading && (
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
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-white transition-colors">
                <CircleEllipsis size={24} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={shareNote}>
                <Share className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => pinNote(false)}>
                <Pin className="mr-2 h-4 w-4" />
                <span>{pinnedNote ? "Unpin Note" : "Pin Note"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={deleteNote}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isSaved && (
            <Link href="/dashboard" className="text-green-500 ml-2">
              Done
            </Link>
          )}
        </div>
      </header>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={handleTitleChange}
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
      <div
        className="fixed bottom-24 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={!isLoaderLoading ? handleSparklesClick : undefined} // Disable click when loading
      >
        {isLoaderLoading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <Sparkles size={24} />
        )}
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
                className={`p-2 rounded-full ${
                  isPlaying ? "bg-purple-600" : "bg-green-600"
                }`}
                disabled={isLoading}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <span className="text-sm">{formatTime(playbackTime)}</span>
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

      {isSaving && (
        <p className="fixed bottom-4 left-4 text-sm text-gray-400">Saving...</p>
      )}
    </div>
  );
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
