"use client";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";

async function handleUser() {
  try {
    const response = await axios.post("/api/auth");
    if (response.status !== 200) {
      throw new Error("Failed to handle user");
    }
  } catch (error) {
    console.error("Error handling user:", error);
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      handleUser();
    }
  }, [user]);

  return <section>{children}</section>;
}
