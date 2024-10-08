"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

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

// Function to generate a random string
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing your note here...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] text-white",
      },
    },
    onUpdate: ({ editor }) => {
      // Handle content updates here
    },
    immediatelyRender: false, // Add this line to fix the SSR issue
  });

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
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle note creation
  const saveNote = async () => {
    try {
      // Get editor content
      const content = editor?.getHTML() || "";

      // Send data to API
      const response = await axios.post("/api/note/create", {
        title,
        content,
        tags,
        recording: recordingUrl, // Use uploaded audio URL
      });

      if (response.status === 200) {
        console.log("Note created:", response.data);
        // Redirect or show success message
      } else {
        console.error("Failed to create note:", response.data);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // New function to handle recording upload to Supabase
  const uploadToSupabase = async (file: File) => {
    const { data, error } = await supabase.storage
      .from("recordings")
      .upload(`recordings/${file.name}`, file);
    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }
    return data?.path; // Return the path of the uploaded file
  };

  const handleStopRecording = async (blobUrl: string, blob: Blob) => {
    setRecordingUrl(blobUrl);
    console.log(blobUrl);

    const randomString = generateRandomString(8);
    const fileName = `recording_${randomString}.wav`;

    const file = new File([blob], fileName, { type: "audio/wav" });

    const recordingPath = await uploadToSupabase(file);
    if (recordingPath) {
      setRecordingId(recordingPath);
    }

    setIsRecording(false);
  };

  // New function to handle deleting the recording
  const deleteRecording = async () => {
    if (recordingId) {
      const { error } = await supabase.storage
        .from("recordings")
        .remove([recordingId]);
      if (!error) {
        setRecordingUrl(null);
        setRecordingId(null);
        console.log("Recording deleted successfully.");
        setIsRecording(false);
      } else {
        console.error("Error deleting recording:", error);
      }
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen w-full max-w-3xl mx-auto p-6 text-white">
      <header className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <button
          onClick={saveNote}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
        >
          Save
        </button>
      </header>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          onStop={(blobUrl: string, blob: Blob) =>
            handleStopRecording(blobUrl, blob)
          }
          render={({ startRecording, stopRecording }) => (
            <div
              onClick={() => {
                if (isRecording) {
                  // Stop recording and save the URL when recording is done
                  stopRecording();
                } else {
                  // Start the recording
                  setShowRecorder(true);
                  setRecordingUrl(""); // Reset recording URL before starting
                  startRecording();
                }

                // Toggle recording state
                setIsRecording(!isRecording);
              }}
            >
              {isRecording ? <Square size={24} /> : <Mic size={24} />}
            </div>
          )}
        />
      </div>

      {showRecorder && (
        <ReactMediaRecorder
          audio
          onStart={() => {
            setIsRecording(true); // Start recording
            setRecordingTime(0); // Reset time
          }}
          onStop={handleStopRecording}
          render={({ startRecording, stopRecording }) => (
            <div>
              <div className="mt-8 bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded-full ${
                        isRecording ? "bg-red-600" : "bg-green-600"
                      }`}
                    >
                      {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    </button>
                    <span className="text-sm">{formatTime(recordingTime)}</span>
                  </div>
                  {/* Delete button */}
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
    </div>
  );
}
