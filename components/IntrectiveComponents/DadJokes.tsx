"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DadJokes = () => {
  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJoke = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("https://icanhazdadjoke.com/", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch joke");
      }

      const data = await response.json();
      setJoke(data.joke);
    } catch (err) {
      setError("Could not fetch a joke. Please try again later.");
      console.error("Error fetching joke:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto my-12 p-6 bg-white/5 backdrop-blur-sm rounded-xl shadow-lg border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6 text-white">Dad Joke Generator</h2>
        
        <div className="min-h-[120px] flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse text-white/70">Loading joke...</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : (
            <motion.p 
              className="text-xl text-white/90 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={joke} // This forces re-animation when joke changes
            >
              "{joke}"
            </motion.p>
          )}
        </div>
        
        <motion.button
          className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors duration-300"
          onClick={fetchJoke}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          {loading ? "Getting joke..." : "Get Another Joke"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DadJokes;