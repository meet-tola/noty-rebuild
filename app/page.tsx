"use client";
import { SignedIn, SignedOut, SignOutButton } from "@clerk/nextjs";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Edit } from "lucide-react";
import { redirect } from "next/navigation";

export default function Home() {
  const { user, isSignedIn } = useUser();

  if (!user) {
    return redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background h-[10vh] flex items-center">
        <div className="container flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center gap-2">
            <NotyLogo />
            <span>Noty</span>
          </Link>
          <div className="flex items-center gap-x-3">
            <ThemeToggle />

            {isSignedIn ? (
              <SignedIn>
                <SignOutButton>
                  <Button>Logout</Button>
                </SignOutButton>
              </SignedIn>
            ) : (
              <SignedOut>
                <div className="flex items-center gap-x-2">
                  <Link href="/signin">
                    <Button variant="ghost" className="text-base font-medium">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="text-base font-medium">Sign Up</Button>
                  </Link>
                </div>
              </SignedOut>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="mx-auto mb-5 mt-[8rem] lg:mt-0 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full backdrop-blur-sm bg-orange-400/30 px-7 py-2 text-black dark:text-white">
                <Edit className="h-5 w-5" />
                <p className="text-sm font-semibold ">
                  Find Your Peace in your Note
                </p>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Create Notes with ease
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Sort your notes easily. Lorem ipsum dolor sit amet, consetetur
                  sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut
                  labore et d
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/signup">
                  <Button className="text-base font-medium">
                    Sign Up for free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function NotyLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
      <path d="M13 13h4" />
      <path d="M13 17h4" />
    </svg>
  );
}
