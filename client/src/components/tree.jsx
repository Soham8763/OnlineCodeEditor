import React from 'react'
const FileTreeNode=({fileName,nodes,onSelect,path})=>{
    const isDir = !!nodes;
    return (
        <div onClick={(e)=>{
                e.stopPropagation()
                if(isDir) return;
                onSelect(path)
            }}  style={{marginLeft:"2vw"}}>
            <p className={isDir?'':'file-node'}>
                {fileName}
            </p>
            {nodes && fileName !== "node_modules" && <ul>{Object.keys(nodes).map(child=>(<li key={child}><FileTreeNode  onSelect={onSelect} fileName={child}  path={path+"/"+child} nodes={nodes[child]}/></li>))}</ul>}
        </div>
    )
}
const Tree = ({tree,onSelect}) => {
  return (
    <FileTreeNode onSelect={onSelect}  fileName="/" path=""  nodes={tree}/>
  )
}

export default Tree