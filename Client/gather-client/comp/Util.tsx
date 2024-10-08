'use client'
import axios from 'axios';
import React, { useRef } from 'react'
import { ChatMetaData } from './Types';
import { useSidebar } from '@/app/context/sidebarContext';


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
    return axios.post('http://localhost:5000/api/chat/title' + `?type=${pathname?.replace('/', '')}`, {id:id, titleName:meta.title})
}


export const adjustInputLength = (inputRef:React.RefObject<HTMLInputElement>, charWidth:number=9, padding:number=15) => {
    const ilength = inputRef.current?.value.length
    if (ilength == undefined) return
    const newWidth = Math.min(ilength * charWidth + padding, 400);
    if (inputRef && inputRef.current) inputRef.current.style.width = `${newWidth}px`
  } 


export const createNewChat = async (pathname:string | null) => {
    if (!pathname) return
    return await axios.get("http://localhost:5000/api/create" + `?type=${pathname?.replace('/', '')}`)
}

export const handleAnimateSideBar = (titleContRef:React.RefObject<HTMLDivElement>, isSidebarToggled:boolean) => {
    if (titleContRef && titleContRef.current) {
        if (isSidebarToggled) {
            titleContRef.current.style.transform='translateX(10%)'
        } else {
            titleContRef.current.style.transform='translateX(0)'
        }
    }
}