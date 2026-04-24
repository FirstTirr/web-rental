"use client";
import React from 'react';
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="flex h-full w-full min-h-[400px] items-center justify-center bg-transparent">
      <div className="relative flex items-center justify-center">
        {/* Ring Luar */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-16 w-16 border-4 border-slate-100 border-t-blue-600 rounded-full"
        />
        {/* Dot Tengah */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute h-3 w-3 bg-blue-600 rounded-full"
        />
      </div>
    </div>
  );
}