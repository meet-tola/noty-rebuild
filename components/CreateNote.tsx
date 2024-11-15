"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Mic,
  Sparkles,
  Plus,
  Bold,
  Italic,
  List,
  ListOrdered,
  Square,
  Trash2,
  MoreVertical,
  Share,
  Pin,
  CircleEllipsis,
  Play,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEditor, EditorContent } from "@tiptap/react";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

const TiptapEditor = dynamic(
  () => import("@tiptap/react").then((mod) => mod.EditorContent),
  {
    ssr: false,
  }
);

const sampleTags = ["work", "personal", "ideas", "todo", "important"];

const generateRandomString = (length: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function CreateNote() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [pinnedNote, setPinnedNote] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  const router = useRouter();

  const { transcript, resetTranscript } = useSpeechRecognition();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start typing your note here..." }),
      BulletList,
      OrderedList,
    ],
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
  });

  const autoSave = useCallback(
    debounce(async () => {
      setIsSaving(true);
      setIsSaved(false); 
      try {
        const content = editor?.getHTML() || "";
        if (noteId) {
          await axios.patch(`/api/note/${noteId}`, {
            title,
            content,
            tags,
            recording: recordingUrl,
          });
        } else {
          const response = await axios.post("/api/note/create", {
            title,
            content,
            tags,
            recording: recordingUrl,
          });
          setNoteId(response.data.id);
        }
        setIsSaved(true);
      } catch (error) {
        console.error("Error auto-saving note:", error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [title, tags, recordingUrl, editor, noteId]
  );

  useEffect(() => {
    const content = editor?.getHTML() || "";
    autoSave(title, tags, content);
  }, [title, tags, editor?.getHTML()]);

  useEffect(() => {
    if (transcript && editor) {
      editor
        .chain()
        .focus()
        .insertContent(transcript + " ")
        .run();
      resetTranscript();
    }
  }, [transcript, editor]);

  const startRecordingAndTranscription = () => {
    setRecordingUrl("");
    setIsRecording(true);
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopRecordingAndTranscription = () => {
    setIsRecording(false);
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const addTag = (tag: string) => {
    setTags((prevTags) => {
      if (!prevTags.includes(tag)) {
        return [...prevTags, tag];
      }
      return prevTags;
    });
  };
  
  const removeTag = (tag: string) => {
    setTags((prevTags) => prevTags.filter((t) => t !== tag));
  };
  

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const uploadToSupabase = async (file: File) => {
    const { data, error } = await supabase.storage
      .from("recordings")
      .upload(`recordings/${file.name}`, file);
    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }
    return data?.path;
  };

  const handleStopRecording = async (blobUrl: string, blob: Blob) => {
    setIsRecording(false);
    SpeechRecognition.stopListening();

    const randomString = generateRandomString(8);
    const fileName = `recording_${randomString}.wav`;

    const file = new File([blob], fileName, { type: "audio/wav" });

    const recordingPath = await uploadToSupabase(file);
    if (recordingPath) {
      const { data } = supabase.storage
        .from("recordings")
        .getPublicUrl(recordingPath);

      setRecordingUrl(data.publicUrl);
      setRecordingId(recordingPath);
    }
  };

  const deleteRecording = async () => {
    if (recordingId) {
      const { error } = await supabase.storage
        .from("recordings")
        .remove([recordingId]);

      if (!error) {
        setRecordingUrl(null);
        setRecordingId(null);
        setIsRecording(false);
        setShowRecorder(false);
      } else {
        console.error("Error deleting recording:", error);
      }
    }
  };

  const shareNote = () => {
    // Implement share functionality
    console.log("Sharing note...");
  };

  const pinNote = async (isPinned: boolean) => {
    if (!noteId) return;
    try {
      await axios.patch(`/api/note/pin/${noteId}`, {
        isPinned: !isPinned,
      });
      setPinnedNote(true);
      console.log("Note pin status toggled");
    } catch (error) {
      console.error("Error toggling pin status:", error);
    }
  };

  const deleteNote = async () => {
    if (!noteId) return;
    try {
      await axios.delete(`/api/note/${noteId}`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const startPlayback = () => {
    if (recordingUrl && !isRecording) {
      setIsPlaying(true);
      setPlayTime(0);
      const audio = new Audio(recordingUrl);
      audio.play();

      audio.onended = () => {
        setIsPlaying(false);
        setPlayTime(0);
      };
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (isPlaying) {
      interval = setInterval(() => {
        setPlayTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPlaying]);

  return (
    <div className="bg-gray-950 min-h-screen w-full max-w-md mx-auto p-6 text-white">
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
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="w-full bg-transparent text-white text-2xl font-bold placeholder-gray-500 focus:outline-none"
        />

        <div className="border-t border-b border-gray-700 py-2 mb-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded ${
                editor?.isActive("bold") ? "bg-gray-700" : ""
              }`}
            >
              <Bold size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded ${
                editor?.isActive("italic") ? "bg-gray-700" : ""
              }`}
            >
              <Italic size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded ${
                editor?.isActive("bulletList") ? "bg-gray-700" : ""
              }`}
            >
              <List size={20} />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded ${
                editor?.isActive("orderedList") ? "bg-gray-700" : ""
              }`}
            >
              <ListOrdered size={20} />
            </button>
          </div>
        </div>
        <TiptapEditor editor={editor} />
      </form>
      <div className="fixed bottom-8 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <Sparkles size={24} />
      </div>

      {showRecorder && (
        <ReactMediaRecorder
          audio
          onStart={() => {
            setIsRecording(true);
            setRecordingTime(0);
          }}
          onStop={handleStopRecording}
          render={({ startRecording, stopRecording }) => (
            <div>
              <div className="mt-8 bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={
                        isRecording
                          ? stopRecording
                          : isPlaying
                          ? null
                          : recordingUrl
                          ? startPlayback
                          : startRecording
                      }
                      className={`p-2 rounded-full ${
                        isRecording
                          ? "bg-red-600"
                          : isPlaying
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                      disabled={isRecording && isPlaying}
                    >
                      {isRecording ? (
                        <Square size={20} fill="white" />
                      ) : isPlaying ? (
                        <Square size={20} fill="white" />
                      ) : (
                        <Play size={20} />
                      )}
                    </button>
                    <span className="text-sm">
                      {isPlaying
                        ? formatTime(playTime)
                        : formatTime(recordingTime)}
                    </span>
                  </div>
                  {recordingUrl && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-400"
                      onClick={deleteRecording}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="text-sm text-gray-400 mb-2">
                Note: Only the last recording will be saved. Delete if not
                needed.
              </h4>
            </div>
          )}
        />
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-700 text-white px-2 py-1 rounded-full text-sm flex items-center"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <h4 className="text-sm text-gray-400 mb-2">Add tags to your note:</h4>

        <div className="flex flex-wrap gap-2">
          {sampleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="bg-gray-700 text-white px-2 py-1 rounded-full text-sm hover:bg-gray-600 transition-colors flex items-center"
            >
              <Plus size={14} className="mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-24 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <ReactMediaRecorder
          audio
          onStart={() => setRecordingTime(0)}
          onStop={(blobUrl, blob) => handleStopRecording(blobUrl, blob)}
          render={({ startRecording, stopRecording }) => (
            <div
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                  stopRecordingAndTranscription();
                } else {
                  setShowRecorder(true);
                  setRecordingUrl("");
                  startRecording();
                  startRecordingAndTranscription();
                }
                setIsRecording(!isRecording);
              }}
            >
              {isRecording ? (
                <Square size={24} fill="white" />
              ) : (
                <Mic size={24} />
              )}
            </div>
          )}
        />
      </div>

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
