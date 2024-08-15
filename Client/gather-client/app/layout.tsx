
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatsBar from "@/comp/ChatsBar";
import { SidebarProvider } from "./context/sidebarContext";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Project Gather",
  description: "Personal LLM Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) 

{
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="cont">
        <SidebarProvider>
          {children}
        </SidebarProvider>

        </div>
        </body>
    </html>
  );
}
