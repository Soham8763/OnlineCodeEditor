import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Terminal from './components/terminal'
import Tree from './components/tree'
import socket from './socket'
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [code, setCode] = useState('');
  const isSaved = selectedFileContent === code;
  const getFileTree = async () => {
    const response = await fetch("http://localhost:9000/files");
    const result = await response.json();
    setFileTree(result.tree)
  }
  useEffect(() => {
    getFileTree();
  }, [])
  const getFileContents = useCallback(() => async () => {
    if (!selectedFile) return;
    const response = await fetch(`http://localhost:9000/files/content?path=${selectedFile}`);
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile])
  useEffect(() => {
    if (selectedFile) getFileContents();
  }, [getFileContents, selectedFile])
  useEffect(() => {
    if (selectedFile && selectedFileContent) {
      setCode(selectedFileContent);
    }
  }, [selectedFile, selectedFileContent])
  useEffect(() => {
    setCode("")
  }, [selectedFile])
  useEffect(() => {
    if (code && !isSaved) {
      const timer = setTimeout(() => {
        socket.emit('file:change', {
          path: selectedFile,
          content: code
        })
      }, 500)
      return () => {
        clearTimeout(timer);
      }
    }
  }, [code, selectedFile])
  useEffect(() => {
    socket.on("file:refresh", getFileTree)
    return () => {
      socket.off("file:refresh", getFileTree)
    }
  }, [])
  return (
    <div className='playground-container'>
      <div className='editor-container'>
        <div className="files">
          <Tree
            onSelect={(path) => setSelectedFile(path)}
            tree={fileTree}
            className="tree"
          />
        </div>


        <div className="editor bg-gray-900 p-4 rounded-lg shadow-lg">
          {selectedFile && (
            <p className="text-sm text-gray-400 mb-2">
              {selectedFile.replaceAll("/", " > ")}{" "}
              <span
                className={`ml-2 font-medium ${isSaved ? "text-green-400" : "text-red-400"
                  }`}
              >
                {isSaved ? "Saved" : "Unsaved"}
              </span>
            </p>
          )}
          <AceEditor
            value={code}
            onChange={(e) => setCode(e)}
            className="w-full border border-gray-700 rounded-md"
            style={{
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              fontSize: "2.5vw",
              height: "70vh",
              width: '90vw'
            }}
          />
        </div>

      </div>
      <div className='terminal-container'>
        <Terminal />
      </div>
    </div>
  )
}

export default App
