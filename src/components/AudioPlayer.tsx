import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface AudioPlayerProps {
  playlist: Array<{
    verseKey: string;
    audioUrl: string;
    duration?: number;
  }>;
  currentPage: number;
  showControls: boolean;
  selectedReciter: number;
}

export function AudioPlayer({ playlist, currentPage, showControls, selectedReciter }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const userPreferences = useQuery(api.quran.getUserPreferences);
  const getVerseAudio = useAction(api.quran.getVerseAudio);

  // Function to format time in minutes:seconds
  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize audio when playlist changes
  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsReady(false);
      setHasError(false);
      
      // Prepare the first track without playing
      const firstTrack = playlist[0];
      if (firstTrack?.verseKey) {
        // Get fresh audio URL using the global selectedReciter
        getVerseAudio({ 
          verseKey: firstTrack.verseKey,
          reciterId: selectedReciter
        }).then(audioData => {
          if (audioData?.url && audioRef.current) {
            console.log("Loading audio URL:", audioData.url);
            audioRef.current.src = audioData.url;
            audioRef.current.load();
            
            // Auto-play if enabled
            if (userPreferences?.autoPlay) {
              setTimeout(() => {
                togglePlayPause();
              }, 1500);
            }
          }
        }).catch(error => {
          console.error("Error loading initial audio:", error);
          setHasError(true);
          toast.error("خطأ في تحميل الصوت");
        });
      }
    }
  }, [playlist.length, currentPage, selectedReciter]);

  // Play/pause toggle with better error handling
  const togglePlayPause = async () => {
    if (!audioRef.current || playlist.length === 0) {
      toast.error("لا يوجد صوت متاح للتشغيل");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      
      const currentTrack = playlist[currentTrackIndex];
      if (!currentTrack?.verseKey) {
        throw new Error("معلومات الآية غير متاحة");
      }

      // Get fresh audio URL using the global selectedReciter
      const audioData = await getVerseAudio({ 
        verseKey: currentTrack.verseKey,
        reciterId: selectedReciter
      });
      
      if (!audioData?.url) {
        throw new Error("رابط الصوت غير متاح");
      }

      // Set up the audio source if different
      if (audioRef.current.src !== audioData.url) {
        console.log("Setting new audio source:", audioData.url);
        audioRef.current.src = audioData.url;
        audioRef.current.load();
      }

      // Wait for audio to be ready with timeout
      const audioReady = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("انتهت مهلة تحميل الصوت"));
        }, 10000); // 10 second timeout

        const handleCanPlay = () => {
          clearTimeout(timeout);
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
          audioRef.current?.removeEventListener('error', handleError);
          audioRef.current?.removeEventListener('loadstart', handleLoadStart);
          resolve();
        };
        
        const handleError = (e: any) => {
          clearTimeout(timeout);
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
          audioRef.current?.removeEventListener('error', handleError);
          audioRef.current?.removeEventListener('loadstart', handleLoadStart);
          console.error("Audio loading error:", e);
          reject(new Error("فشل في تحميل الملف الصوتي"));
        };

        const handleLoadStart = () => {
          console.log("Audio loading started");
        };
        
        if (audioRef.current) {
          audioRef.current.addEventListener('canplay', handleCanPlay);
          audioRef.current.addEventListener('error', handleError);
          audioRef.current.addEventListener('loadstart', handleLoadStart);
          
          // If already ready, resolve immediately
          if (audioRef.current.readyState >= 3) {
            handleCanPlay();
          }
        }
      });

      await audioReady;
      
      // Try to play
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      
      setIsPlaying(true);
      setIsReady(true);
      toast.success("بدء التشغيل");
      
    } catch (error: any) {
      console.error("Error toggling playback:", error);
      setHasError(true);
      setIsPlaying(false);
      
      // More specific error messages
      let errorMessage = "خطأ في تشغيل الصوت";
      if (error.message.includes("timeout") || error.message.includes("انتهت مهلة")) {
        errorMessage = "انتهت مهلة تحميل الصوت - تحقق من الاتصال";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "خطأ في الشبكة - تحقق من الاتصال";
      } else if (error.message.includes("decode") || error.message.includes("format")) {
        errorMessage = "تنسيق الملف الصوتي غير مدعوم";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Next track with better error handling
  const nextTrack = async () => {
    if (currentTrackIndex < playlist.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextIndex);
      setCurrentTime(0);
      setHasError(false);
      
      if (audioRef.current && playlist[nextIndex]) {
        try {
          // Get fresh audio URL using the global selectedReciter
          const verseKey = playlist[nextIndex].verseKey;
          const audioData = await getVerseAudio({ 
            verseKey: verseKey,
            reciterId: selectedReciter
          });
          
          if (!audioData?.url) {
            throw new Error("رابط الصوت غير متاح");
          }
          
          audioRef.current.src = audioData.url;
          audioRef.current.load();
          
          if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
          }
        } catch (error) {
          console.error("Error loading next track:", error);
          setHasError(true);
          toast.error("خطأ في تحميل الصوت التالي");
        }
      }
    } else {
      toast.info("نهاية قائمة التشغيل");
    }
  };

  // Previous track with better error handling
  const prevTrack = async () => {
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      setCurrentTime(0);
      setHasError(false);
      
      if (audioRef.current && playlist[prevIndex]) {
        try {
          // Get fresh audio URL using the global selectedReciter
          const verseKey = playlist[prevIndex].verseKey;
          const audioData = await getVerseAudio({ 
            verseKey: verseKey,
            reciterId: selectedReciter
          });
          
          if (!audioData?.url) {
            throw new Error("رابط الصوت غير متاح");
          }
          
          audioRef.current.src = audioData.url;
          audioRef.current.load();
          
          if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
            }
          }
        } catch (error) {
          console.error("Error loading previous track:", error);
          setHasError(true);
          toast.error("خطأ في تحميل الصوت السابق");
        }
      }
    } else {
      toast.info("بداية قائمة التشغيل");
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle duration change
  const handleDurationChange = () => {
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle track end
  const handleEnded = () => {
    setIsPlaying(false);
    nextTrack();
  };

  // Handle audio errors
  const handleError = (e: any) => {
    console.error("Audio error:", e);
    setHasError(true);
    setIsPlaying(false);
    toast.error("خطأ في تشغيل الصوت");
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Don't render if no controls or playlist
  if (!showControls || playlist.length === 0) {
    return null;
  }

  const currentTrack = playlist[currentTrackIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-[#8b7355] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="truncate">
              <div className="text-sm font-medium truncate">
                {currentTrack?.verseKey || "لا يوجد صوت"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={prevTrack}
              disabled={currentTrackIndex === 0 || isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button 
              onClick={togglePlayPause}
              disabled={hasError}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8b7355] text-white hover:bg-[#7a6548] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button 
              onClick={nextTrack}
              disabled={currentTrackIndex === playlist.length - 1 || isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-8 text-right">{formatTime(currentTime)}</span>
          <div 
            className="h-1.5 bg-gray-200 rounded-full flex-1 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-[#8b7355] rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}
