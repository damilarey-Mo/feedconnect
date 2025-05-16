import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, onDelete, showDelete = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset error state on new source
    setError(null);
    console.log(`AudioPlayer: Loading audio from ${src}`);

    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        console.log(`AudioPlayer: Duration loaded: ${audio.duration}s`);
        setDuration(audio.duration);
      }
    };
    
    const handleEnded = () => {
      console.log('AudioPlayer: Playback ended');
      setIsPlaying(false);
    };
    
    const handleCanPlay = () => {
      console.log("AudioPlayer: Audio can play now");
      updateDuration();
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error("AudioPlayer: Error loading audio", e);
      setError(`Failed to load audio: ${audio.error?.message || 'Unknown error'}`);
    };
    
    const handleWaiting = () => {
      console.log("AudioPlayer: Waiting for data...");
    };
    
    const handlePlaying = () => {
      console.log("AudioPlayer: Started playing");
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    // Force loading the audio
    try {
      audio.load();
      console.log("AudioPlayer: Audio load initiated");
    } catch (loadError) {
      console.error("AudioPlayer: Failed to load audio", loadError);
      setError(`Error loading audio: ${loadError}`);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      
      // Clean up object URL if it appears to be a Blob URL
      if (src && src.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(src);
          console.log(`AudioPlayer: Revoked URL ${src}`);
        } catch (e) {
          console.error("AudioPlayer: Failed to revoke URL", e);
        }
      }
    };
  }, [src]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log("AudioPlayer: Paused");
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            console.log("AudioPlayer: Playing started successfully");
          })
          .catch(error => {
            console.error("AudioPlayer: Error playing audio:", error);
            setError(`Failed to play: ${error.message || 'Unknown error'}`);
          });
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
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
      <audio 
        ref={audioRef} 
        src={src} 
        preload="auto" 
        onError={(e) => console.error("AudioPlayer: Error event triggered", e)}
      />
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className={`w-10 h-10 flex items-center justify-center ${error ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded-full hover:${error ? 'bg-gray-500' : 'bg-blue-600'} transition-colors`}
          disabled={!!error}
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
          <div 
            className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            ></div>
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