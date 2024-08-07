'use client'
import axios from 'axios';
import React, { useRef } from 'react'
import { ChatMetaData } from './Types';


export const useDebounce = (func: (...args: any[]) => void, wait: number) => {
    const timeout = useRef<ReturnType<typeof setTimeout>>();

    return (...args: any[]) => {
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(() => {
            func(...args);
        }, wait);
    };
};



export const sendTitleUpdate = (pathname:string | null, id:string, meta:ChatMetaData) => {
    axios.post('http://localhost:5000/api/chat/title' + `?type=${pathname?.replace('/', '')}`, {id:id, meta:meta})
}

