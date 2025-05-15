import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

interface WaveformPoint {
  x: number;
  y: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, onDelete, showDelete = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<WaveformPoint[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    // Initialize Web Audio API
    const initializeAudio = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get waveform data
        const rawData = audioBuffer.getChannelData(0);
        const points = generateWaveformPoints(rawData, 100);
        setWaveformData(points);

        // Set up audio analyzer
        const analyzer = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;
        sourceRef.current = source;
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [src]);

  const generateWaveformPoints = (rawData: Float32Array, numPoints: number): WaveformPoint[] => {
    const points: WaveformPoint[] = [];
    const step = Math.floor(rawData.length / numPoints);

    for (let i = 0; i < numPoints; i++) {
      const start = i * step;
      const end = start + step;
      let max = 0;

      for (let j = start; j < end; j++) {
        const absolute = Math.abs(rawData[j]);
        if (absolute > max) max = absolute;
      }

      points.push({
        x: i * (100 / numPoints),
        y: max * 50 // Scale the height to 50% of the container
      });
    }

    return points;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
      <audio ref={audioRef} src={src} />
      
      <div className="flex items-center space-x-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </motion.button>

        <div className="flex-1">
          <div className="relative w-full h-16 bg-gray-100 rounded-lg overflow-hidden">
            <svg
              className="w-full h-full cursor-pointer"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onClick={handleSeek}
            >
              {/* Background waveform */}
              <path
                d={`M 0,50 ${waveformData.map(point => `L ${point.x},${50 - point.y} L ${point.x},${50 + point.y}`).join(' ')} L 100,50`}
                fill="rgb(191, 219, 254)"
                opacity="0.5"
              />
              {/* Progress waveform */}
              <clipPath id="progress-clip">
                <rect x="0" y="0" width={`${(currentTime / duration) * 100}`} height="100" />
              </clipPath>
              <path
                d={`M 0,50 ${waveformData.map(point => `L ${point.x},${50 - point.y} L ${point.x},${50 + point.y}`).join(' ')} L 100,50`}
                fill="rgb(59, 130, 246)"
                clipPath="url(#progress-clip)"
              />
              {/* Playhead */}
              <line
                x1={`${(currentTime / duration) * 100}`}
                y1="0"
                x2={`${(currentTime / duration) * 100}`}
                y2="100"
                stroke="rgb(59, 130, 246)"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {showDelete && onDelete && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
} 