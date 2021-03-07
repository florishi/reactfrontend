import React from "react";
import { useDrop } from "react-dnd";
import Folder from "../Folder";
export default function FolderDropWarpper({ folder, onIconClick }) {
    const [{ canDrop, isOver }, drop] = useDrop({
        accept: "object",
        drop: () => ({ folder }),
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop()
        })
    });
    const isActive = canDrop && isOver;
    return (
        <div ref={drop}>
            <Folder
                folder={folder}
                onIconClick={onIconClick}
                isActive={isActive}
            />
        </div>
    );
}
