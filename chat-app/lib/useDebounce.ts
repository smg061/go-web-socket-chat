import { useEffect, useState } from "react"

export const useDebounce = (word: string, delay: number)=> {
    const [term, setTerm] = useState('')
    
    useEffect(()=> {
        const timeout = setTimeout(()=> {
            console.log("using debouncer to set term")
            setTerm(word);
        }, delay)
        return ()=> {
            clearTimeout(timeout)
        }
    },[word]);
    return [term] as const
}