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
}

export function AudioPlayer({ playlist, currentPage, showControls }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const userPreferences = useQuery(api.quran.getUserPreferences);

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
      if (firstTrack?.audioUrl) {
        console.log("Loading audio URL:", firstTrack.audioUrl);
        audioRef.current.src = firstTrack.audioUrl;
        audioRef.current.load();
        
        // Auto-play if enabled
        if (userPreferences?.autoPlay) {
          setTimeout(() => {
            togglePlayPause();
          }, 1500);
        }
      }
    }
  }, [playlist.length, currentPage]);

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
      if (!currentTrack?.audioUrl) {
        throw new Error("رابط الصوت غير متاح");
      }

      // Set up the audio source if different
      if (audioRef.current.src !== currentTrack.audioUrl) {
        console.log("Setting new audio source:", currentTrack.audioUrl);
        audioRef.current.src = currentTrack.audioUrl;
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
        audioRef.current.src = playlist[nextIndex].audioUrl;
        audioRef.current.load();
        if (isPlaying) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
            await audioRef.current.play();
          } catch (error) {
            console.error("Error playing next track:", error);
            setIsPlaying(false);
            setHasError(true);
            toast.error("خطأ في تشغيل الآية التالية");
          }
        }
      }
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
        audioRef.current.src = playlist[prevIndex].audioUrl;
        audioRef.current.load();
        if (isPlaying) {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
            await audioRef.current.play();
          } catch (error) {
            console.error("Error playing previous track:", error);
            setIsPlaying(false);
            setHasError(true);
            toast.error("خطأ في تشغيل الآية السابقة");
          }
        }
      }
    }
  };

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
      setIsReady(true);
      console.log("Audio metadata loaded, duration:", audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (currentTrackIndex < playlist.length - 1) {
      nextTrack();
    } else {
      toast.success("انتهت تلاوة الصفحة");
      setCurrentTrackIndex(0);
      setCurrentTime(0);
    }
  };

  const handleError = (e: any) => {
    console.error("Audio error:", e);
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(true);
    
    // Get more specific error information
    if (audioRef.current?.error) {
      const error = audioRef.current.error;
      console.error("Audio error code:", error.code, "message:", error.message);
      
      let errorMessage = "خطأ في تحميل الملف الصوتي";
      switch (error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = "تم إلغاء تحميل الصوت";
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = "خطأ في الشبكة أثناء تحميل الصوت";
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = "خطأ في فك تشفير الملف الصوتي";
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = "تنسيق الملف الصوتي غير مدعوم";
          break;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCanPlay = () => {
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    console.log("Audio can play");
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    console.log("Audio load started");
  };

  const handleWaiting = () => {
    setIsLoading(true);
    console.log("Audio waiting for data");
  };

  const handlePlaying = () => {
    setIsLoading(false);
    console.log("Audio playing");
  };

  // Seek to position
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || hasError) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time
  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!showControls || playlist.length === 0) return null;

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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate font-ui">
                {currentTrack ? `الآية ${currentTrack.verseKey}` : 'صفحة ' + currentPage}
              </p>
              <p className="text-xs text-gray-500 font-ui">
                {currentTrackIndex + 1} من {playlist.length}
                {hasError && <span className="text-red-500 mr-2">• خطأ في التحميل</span>}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevTrack}
              disabled={currentTrackIndex === 0}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="السابق"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-colors ${
                hasError 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-[#8b7355] hover:bg-[#6b5b47] text-white'
              } disabled:opacity-50`}
              title={hasError ? "إعادة المحاولة" : isPlaying ? "إيقاف" : "تشغيل"}
            >
              {isLoading ? (
                <div className="w-5 h-5 spinner border-white border-t-transparent"></div>
              ) : hasError ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
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
              disabled={currentTrackIndex === playlist.length - 1}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="التالي"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Time Display */}
          <div className="text-xs text-gray-500 ml-4 font-ui min-w-[60px] text-left">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Progress Bar */}
        {duration > 0 && !hasError && (
          <div className="progress-bar" onClick={handleSeek}>
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            >
              <div className="progress-handle"></div>
            </div>
          </div>
        )}

        {/* Error indicator */}
        {hasError && (
          <div className="mt-2 text-xs text-red-500 text-center font-ui">
            خطأ في تحميل الصوت - انقر على زر التشغيل لإعادة المحاولة
          </div>
        )}
      </div>

      {/* Hidden Audio Element with all event handlers */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  );
}
