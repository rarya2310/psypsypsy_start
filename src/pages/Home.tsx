import React from "react";
import { GooeyTextDemo } from "@/components/GooeyTextDemo";

const Home: React.FC = () => {
  const INSTAGRAM_URL = "https://www.instagram.com/psypsypsy_r1";
  return (
    <div
      className="min-h-screen bg-white text-black flex flex-col items-center justify-center"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color: "#000",
      }}
    >
      <div
        className="w-full"
        style={{ width: "100%", maxWidth: 1200, height: "60vh", position: "relative" }}
      >
        <GooeyTextDemo />
      </div>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 underline"
        style={{ marginTop: 32, textDecoration: "underline", color: "#000" }}
      >
        Instagram: @psypsypsy_r1
      </a>
    </div>
  );
};

export default Home;
