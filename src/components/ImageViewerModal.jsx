import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export default function ImageViewerModal({ isOpen, onClose, imageUrl }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const imageRef = useRef(null);
    
    // Drag tracking refs
    const dragStartPosRef = useRef({ x: 0, y: 0 }); // Mouse position at drag start
    const dragStartOffsetRef = useRef({ x: 0, y: 0 }); // Image position at drag start
    const totalDragDistanceRef = useRef(0); // Total distance dragged
    
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const DRAG_THRESHOLD = 10; // Minimum pixels to consider as drag

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            totalDragDistanceRef.current = 0;
        }
    }, [isOpen, imageUrl]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Calculate initial scale to fit image in viewport
    const handleImageLoad = useCallback((e) => {
        const img = e.target;
        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.clientWidth - 80;
        const containerHeight = container.clientHeight - 80;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        setImageDimensions({ width: imgWidth, height: imgHeight });

        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const fitScale = Math.min(scaleX, scaleY, 1);

        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
    }, []);

    // Handle wheel zoom - use native event listener to allow preventDefault
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isOpen) return;

        const handleWheelEvent = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setScale(prev => Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta)));
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => container.removeEventListener('wheel', handleWheelEvent);
    }, [isOpen]);

    // Constrain position to keep image partially visible
    const constrainPosition = useCallback((pos, currentScale) => {
        const container = containerRef.current;
        if (!container || !imageDimensions.width) return pos;

        const imgWidth = imageDimensions.width * currentScale;
        const imgHeight = imageDimensions.height * currentScale;

        const minVisible = 100;
        const maxX = Math.max(0, (imgWidth / 2) - minVisible);
        const maxY = Math.max(0, (imgHeight / 2) - minVisible);

        return {
            x: Math.max(-maxX, Math.min(maxX, pos.x)),
            y: Math.max(-maxY, Math.min(maxY, pos.y))
        };
    }, [imageDimensions]);

    // Mouse down - start drag from anywhere (image or backdrop)
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; // Only left click
        e.preventDefault();
        
        setIsDragging(true);
        totalDragDistanceRef.current = 0;
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        dragStartOffsetRef.current = { x: position.x, y: position.y };
    }, [position]);

    // Mouse move - update position if dragging
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartPosRef.current.x;
        const deltaY = e.clientY - dragStartPosRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        totalDragDistanceRef.current = Math.max(totalDragDistanceRef.current, distance);
        
        const newPos = {
            x: dragStartOffsetRef.current.x + deltaX,
            y: dragStartOffsetRef.current.y + deltaY
        };
        setPosition(constrainPosition(newPos, scale));
    }, [isDragging, scale, constrainPosition]);

    // Mouse up - end drag, decide whether to close
    const handleMouseUp = useCallback((e) => {
        if (!isDragging) return;
        
        setIsDragging(false);
        
        // If drag distance is less than threshold, treat as click
        // Only close if clicked on backdrop (not on image or buttons)
        if (totalDragDistanceRef.current < DRAG_THRESHOLD) {
            // Check if click target is the container (backdrop) itself
            if (e.target === containerRef.current) {
                onClose();
            }
        }
        
        totalDragDistanceRef.current = 0;
    }, [isDragging, onClose]);

    // Touch handlers for mobile
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            totalDragDistanceRef.current = 0;
            dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
            dragStartOffsetRef.current = { x: position.x, y: position.y };
        }
    }, [position]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartPosRef.current.x;
        const deltaY = touch.clientY - dragStartPosRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        totalDragDistanceRef.current = Math.max(totalDragDistanceRef.current, distance);
        
        const newPos = {
            x: dragStartOffsetRef.current.x + deltaX,
            y: dragStartOffsetRef.current.y + deltaY
        };
        setPosition(constrainPosition(newPos, scale));
    }, [isDragging, scale, constrainPosition]);

    const handleTouchEnd = useCallback((e) => {
        if (!isDragging) return;
        
        setIsDragging(false);
        
        if (totalDragDistanceRef.current < DRAG_THRESHOLD) {
            if (e.target === containerRef.current) {
                onClose();
            }
        }
        
        totalDragDistanceRef.current = 0;
    }, [isDragging, onClose]);

    if (!isOpen) return null;

    const scalePercent = Math.round(scale * 100);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 cursor-pointer"
                title="Close (ESC)"
            >
                <X size={24} />
            </button>

            {/* Zoom indicator */}
            <div 
                className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 rounded-full text-white/80 text-sm font-mono z-10"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {scalePercent}%
            </div>

            {/* Image container */}
            <div
                className="relative select-none pointer-events-none"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Enlarged view"
                    className="max-w-none"
                    onLoad={handleImageLoad}
                    draggable={false}
                />
            </div>

            {/* Instructions */}
            <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white/60 text-xs z-10 pointer-events-none"
            >
                滚轮缩放 · 拖动查看 · 点击空白处关闭
            </div>
        </div>
    );
}
