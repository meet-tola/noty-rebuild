"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const TiptapEditor = dynamic(
  () => import("@tiptap/react").then((mod) => mod.EditorContent),
  {
    ssr: false,
  }
);

const sampleTags = ["work", "personal", "ideas", "todo", "important"];

export default function EditNote() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [totalDuration] = useState(120); // Assuming a 2-minute recording

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
      // Handle content updates here
    },
    immediatelyRender: false, // Add this line to fix the SSR issue
  });

  useEffect(() => {
    // Fetch note data based on id
    // This is a placeholder for actual data fetching
    setTitle("Sample Note Title");
    editor?.commands.setContent("This is the content of the sample note.");
    setTags(["work", "important"]);
  }, [id, editor]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playbackTime < totalDuration) {
      interval = setInterval(() => {
        setPlaybackTime((prevTime) => {
          if (prevTime >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackTime, totalDuration]);

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    if (playbackTime >= totalDuration) {
      setPlaybackTime(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
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
        <div className="space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
            Save
          </button>
          <button className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors">
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
      <div className="fixed bottom-24 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <Sparkles size={24} />
      </div>
      <div className="fixed bottom-6 right-6 bg-gray-800 p-3 rounded-full text-white cursor-pointer hover:bg-gray-700 transition-colors">
        <Mic size={24} />
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
        <div>
          <h4 className="text-sm text-gray-400 mb-2">Add tags to your note:</h4>
          <div className="flex flex-wrap gap-2">
            {sampleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="bg-gray-700 text-white px-2 py-1  rounded-full text-sm hover:bg-gray-600 transition-colors flex items-center"
              >
                <Plus size={14} className="mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Voice Recording</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={togglePlayback}
              className={`p-2 rounded-full ${
                isPlaying ? "bg-purple-600" : "bg-green-600"
              }`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <span className="text-sm">
              {formatTime(playbackTime)} / {formatTime(totalDuration)}
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
    </div>
  );
}
