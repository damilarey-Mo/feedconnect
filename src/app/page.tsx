'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FeedbackForm } from '@/components/FeedbackForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black overflow-hidden">
      {/* Enhanced floating background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-zinc-800/20 to-zinc-900/20 rounded-full blur-3xl opacity-30 animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-gradient-to-tl from-zinc-700/20 to-zinc-800/20 rounded-full blur-3xl opacity-30 animate-float-medium"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-gradient-to-tr from-zinc-600/20 to-zinc-700/20 rounded-full blur-3xl opacity-30 animate-float-fast"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-bl from-zinc-800/20 to-zinc-900/20 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
        
        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,zinc-800_1px,transparent_1px),linear-gradient(to_bottom,zinc-800_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)] opacity-[0.02]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 relative">
        {/* Logo and header section with professional spacing */}
        <motion.div 
          className="text-center mb-16 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo with proper sizing and animation */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, type: "spring", stiffness: 60 }}
          >
            <div className="relative w-[300px] h-[50px]">
              <Image 
                src="/images/logo.svg" 
                alt="Crownedgear Luxury" 
                fill
                priority
                className="object-contain"
                style={{ filter: "drop-shadow(0px 2px 8px rgba(255,255,255,0.2))" }}
              />
            </div>
          </motion.div>

          <motion.p 
            className="text-[#E8DCCC] text-xl md:text-2xl font-light mb-6 mx-auto tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Premium Feedback Experience
          </motion.p>
          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Dear Crowned Champ, we treasure your thoughts. Your exclusive insights help us craft the exceptional experiences you deserve.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 1,
            delay: 0.5,
            type: "spring",
            stiffness: 50
          }}
          className="relative group"
        >
          {/* Enhanced card effects */}
          <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black rounded-2xl transform rotate-1 blur-sm opacity-50 group-hover:rotate-2 transition-transform duration-500"></div>
          <div className="relative rounded-2xl bg-zinc-900/90 backdrop-blur-xl p-8 md:p-10
            shadow-[0_15px_60px_rgba(0,0,0,0.5)]
            group-hover:shadow-[0_20px_80px_rgba(0,0,0,0.6)]
            border border-zinc-800/50 group-hover:border-zinc-700/50
            transform transition-all duration-500 ease-out
            group-hover:-translate-y-2
            [&_input]:bg-[#F3EEE7] [&_input]:text-black [&_input]:placeholder-zinc-500
            [&_textarea]:bg-[#F3EEE7] [&_textarea]:text-black [&_textarea]:placeholder-zinc-500
            [&_button]:bg-[#E8DCCC] [&_button]:text-black [&_button]:hover:bg-[#DFD3C3]
            [&_button]:border-[#E8DCCC] [&_button]:hover:border-[#DFD3C3]
            [&_button]:shadow-md [&_button]:hover:shadow-lg
            [&_button]:transition-all [&_button]:duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"></div>
            <FeedbackForm />
          </div>
        </motion.div>

        <motion.footer 
          className="mt-16 text-center text-zinc-500 text-sm relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <p className="hover:text-zinc-300 transition-colors duration-300">
            © {new Date().getFullYear()} Crownedgear Luxury. All rights reserved.
          </p>
        </motion.footer>
      </div>
    </main>
  );
} 