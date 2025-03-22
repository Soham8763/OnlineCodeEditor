import React, { useEffect, useRef } from 'react'
import {Terminal as XTerminal} from "@xterm/xterm"
import socket from '../socket'
import "@xterm/xterm/css/xterm.css"
const Terminal = () => {
    const terminalRef = useRef();
    const isRendered = useRef(null)
    useEffect(()=>{
        // if(isRendered.current) return
        // isRendered.current = true
        const term = new XTerminal({
            rows:20
        });
        term.open(terminalRef.current);
        term.onData((data)=>{
            socket.emit('terminal:write',data)
        })
        function onTerminalData(data){
            term.write(data)
        }
        socket.on('terminal:data',onTerminalData)
        return () => {
            term.dispose(); 
            socket.off('terminal:data', onTerminalData);
        };
    },[])
  return (
    <div ref={terminalRef}  id='terminal'>

    </div>
  )
}

export default Terminal