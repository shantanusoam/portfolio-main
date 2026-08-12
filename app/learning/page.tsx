"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Learning from "@/components/Learning";

export default function LearningPage() {
  return (
    <>
      <Navbar />
      <main className="text-clip">
        <div className="container" style={{ paddingTop: "7rem" }}>
          <Learning />
          <Footer />
        </div>
      </main>
    </>
  );
}
