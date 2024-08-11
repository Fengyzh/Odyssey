'use client'
import axios from 'axios';
import React, { useRef } from 'react'
import { ChatMetaData } from './Types';




export const useDebounce = (func: (...args: any[]) => void, wait: number) => {

    const timeout = useRef<ReturnType<typeof setTimeout>>();

    return (...args: any[]): Promise<void> => {
        if (timeout.current) {
            clearTimeout(timeout.current);
        }

        return new Promise((resolve) => {
            timeout.current = setTimeout(() => {
                func(...args);
                resolve();
            }, wait);
        });
    };
};

export const sendTitleUpdate = async (pathname:string | null, id:string, meta:ChatMetaData) => {
    return axios.post('http://localhost:5000/api/chat/title' + `?type=${pathname?.replace('/', '')}`, {id:id, meta:meta})
}

export const adjustInputLength = (inputRef:React.RefObject<HTMLInputElement>) => {
    const ilength = inputRef.current?.value.length
    if (ilength == undefined) return
    const charWidth = 9; // Adjust this value based on the average character width in your input font
    const padding = 15; // Total padding (left + right) in pixels
    const newWidth = Math.min(ilength * charWidth + padding, 400);
    if (inputRef && inputRef.current) inputRef.current.style.width = `${newWidth}px`
  } 



