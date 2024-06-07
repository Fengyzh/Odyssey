"use client"

import { motion } from 'framer-motion'
import React from 'react'
import Markdown from 'react-markdown';


interface AniTextProps {
    text: string; 
    className: string;
  }

  const textV = {
    hidden: {
        opacity:0
    },
    animate: {
        opacity:1
    }
}




const StaggerText: React.FC<AniTextProps> = ({ text, className } ) => {
    
    return (
    <div className={className}>
     <Markdown>{text}</Markdown>
{/*     <motion.span initial="hidden" animate="animate" transition={{staggerChildren:0.05}}> 
        {text.map((char) => (
            
            <motion.span className="ani" variants={textV}>{char=="\n"? <br/>: char + " "}</motion.span>
        ))} 
        <br/>
    </motion.span> */}


    </div>
  )
}

export default StaggerText;