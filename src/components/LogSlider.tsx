import { useState, useEffect } from 'react';

interface LogSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

/**
 * Power scale slider component (inverted log effect)
 * Makes high values feel more responsive - slider moves fast in millions
 */
export function LogSlider({ min, max, value, onChange }: LogSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(0);

  // Power exponent - higher = more responsive at high end
  const power = 2.5;

  // Convert value to slider position on mount/change
  useEffect(() => {
    if (max === 0 || min >= max) return;
    
    // Clamp value to valid range
    const clampedValue = Math.max(min, Math.min(max, value));
    
    // Convert value to power scale position (inverted log effect)
    // Formula: position = ((value - min) / (max - min))^(1/power) * 100
    const normalized = (clampedValue - min) / (max - min);
    const position = Math.pow(normalized, 1 / power) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  }, [min, max, value, power]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value);
    setSliderPosition(position);
    
    // Convert position to power scale value (inverted log effect)
    // Formula: value = min + (max - min) * (position/100)^power
    const normalized = position / 100;
    const newValue = min + (max - min) * Math.pow(normalized, power);
    
    // Round to nearest integer
    onChange(Math.round(newValue));
  };

  // Adjust fill width to stop at thumb center
  // Thumb is 24px (12px radius), so we need to account for this
  // Approximate: thumb radius is ~0.75% of typical track width (12px / 1600px)
  // When at 100%, fill should stop before thumb extends past track
  const thumbRadiusPercent = 0.8; // Slight adjustment for thumb size
  const adjustedPosition = sliderPosition === 100 
    ? 100 - thumbRadiusPercent 
    : sliderPosition;

  return (
    <div className="log-slider">
      <div className="slider-track-fill" style={{ width: `${adjustedPosition}%` }}></div>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="slider-input"
      />
    </div>
  );
}

