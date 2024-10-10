import dynamic from "next/dynamic";

const CreateNote = dynamic(() => import("@/components/CreateNote"), { ssr: false });

export default function Page() {
  return (
    <CreateNote />
  );
}