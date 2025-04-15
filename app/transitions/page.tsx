"use client";

import { useState } from "react";
import EnhancedPageTransition from "@/components/ui/EnhancedPageTransition";
import { TransitionStyle } from "@/components/ui/EnhancedPageTransition";
import { motion } from "framer-motion";

export default function TransitionsDemo() {
  const [selectedTransition, setSelectedTransition] = useState<TransitionStyle>("slide");
  
  const transitionOptions: TransitionStyle[] = ["slide", "perspective", "stairs", "curve"];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Page Transition Showcase
        </motion.h1>
        
        <motion.div 
          className="mb-12 text-center text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-xl mb-6">Select a transition style and click on the links below to see it in action</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {transitionOptions.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedTransition(style)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedTransition === style ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Link */}
          <motion.div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Back to Home</h2>
              <p className="text-gray-300 mb-6">Return to the main portfolio page with the selected transition effect.</p>
              <EnhancedPageTransition 
                href="/" 
                transitionStyle={selectedTransition}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Home
              </EnhancedPageTransition>
            </div>
          </motion.div>
          
          {/* Projects Link */}
          <motion.div 
            className="bg-gray-800 rounded-lg overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Projects</h2>
              <p className="text-gray-300 mb-6">View projects with the selected transition effect.</p>
              <EnhancedPageTransition 
                href="/projects" 
                transitionStyle={selectedTransition}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Projects
              </EnhancedPageTransition>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-16 bg-gray-800 rounded-lg p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Current Transition: {selectedTransition.charAt(0).toUpperCase() + selectedTransition.slice(1)}</h2>
          <div className="prose prose-invert max-w-none">
            <p>This demo showcases different page transition effects using Framer Motion and Next.js:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Slide:</strong> A simple sliding overlay transition.</li>
              <li><strong>Perspective:</strong> A 3D-like effect where the page scales down and moves away.</li>
              <li><strong>Stairs:</strong> A staggered column-based transition inspired by K72's website.</li>
              <li><strong>Curve:</strong> A circular reveal/hide effect inspired by Denis Snellenberg's portfolio.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}