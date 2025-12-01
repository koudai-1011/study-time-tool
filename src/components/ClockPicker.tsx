import React, { useRef, useEffect, useState } from 'react';

interface ClockPickerProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
}

export const ClockPicker: React.FC<ClockPickerProps> = ({ 
  value, 
  onChange, 
  size = 240, 
  color = '#3b82f6' // primary-500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const center = size / 2;
  const radius = size / 2 - 32; // Padding for numbers
  const clockNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const calculateTimeFromEvent = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;

    // Calculate angle in degrees (0 is at 12 o'clock)
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = angle + 90; // Rotate so 0 is at top
    if (angle < 0) angle += 360;

    // Convert angle to minutes (0-60)
    let minutes = Math.round((angle / 360) * 60);
    if (minutes === 60) minutes = 0;

    onChange(minutes);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateTimeFromEvent(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      calculateTimeFromEvent(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    calculateTimeFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      calculateTimeFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove as any, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Calculate hand position
  const angle = (value / 60) * 360;
  const handLength = radius - 10;
  const handX = center + handLength * Math.sin(angle * (Math.PI / 180));
  const handY = center - handLength * Math.cos(angle * (Math.PI / 180));

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="cursor-pointer touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Clock Face Background */}
        <circle
          cx={center}
          cy={center}
          r={radius + 24}
          fill="#f8fafc" // slate-50
          stroke="#e2e8f0" // slate-200
          strokeWidth="1"
        />
        
        {/* Center Dot */}
        <circle cx={center} cy={center} r="4" fill={color} />

        {/* Clock Numbers */}
        {clockNumbers.map((num) => {
          const numAngle = (num / 60) * 360;
          const numRadius = radius;
          const x = center + numRadius * Math.sin(numAngle * (Math.PI / 180));
          const y = center - numRadius * Math.cos(numAngle * (Math.PI / 180));
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              dy="5"
              textAnchor="middle"
              fill={value === num ? color : '#64748b'} // slate-500
              fontSize="14"
              fontWeight={value === num ? 'bold' : 'normal'}
              style={{ pointerEvents: 'none' }}
            >
              {num}
            </text>
          );
        })}

        {/* Clock Hand Line */}
        <line
          x1={center}
          y1={center}
          x2={handX}
          y2={handY}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Clock Hand Knob (Selector) */}
        <circle
          cx={handX}
          cy={handY}
          r="16"
          fill={color}
          className="shadow-md"
        />
        
        {/* Value inside Knob */}
        <text
          x={handX}
          y={handY}
          dy="4"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {value}
        </text>
      </svg>
    </div>
  );
};
