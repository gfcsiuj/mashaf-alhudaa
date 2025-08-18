import { useState, useRef, useEffect, memo } from "react";
import { toast } from "sonner";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

// متغير عام لتتبع مشغلات الصوت النشطة
let activeAudioPlayers: HTMLAudioElement[] = [];

interface AudioPlayerProps {
  playlist: Array<{
    verseKey: string;
    url: string;
  }>;
  showControls: boolean;
  isInHeader?: boolean;
  onTrackChange?: (verseKey: string) => void;
  onPlaylistEnded?: () => void;
  autoPlay?: boolean;
  startPlaying?: boolean;
}

export const AudioPlayer = memo(function AudioPlayer({ playlist, showControls, isInHeader = false, onTrackChange, onPlaylistEnded, autoPlay = false, startPlaying = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Function to format time in minutes:seconds
  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // دالة لإيقاف جميع مشغلات الصوت الأخرى
  const stopOtherAudioPlayers = () => {
    // نحتفظ بالمشغل الحالي ونوقف المشغلات الأخرى فقط
    // هذا يمنع إيقاف الصوت عند النقر على الشاشة
    const currentPlayer = audioRef.current;
    
    activeAudioPlayers.forEach(player => {
      // نتأكد من أن المشغل ليس هو المشغل الحالي قبل إيقافه
      if (player !== currentPlayer && !player.paused) {
        player.pause();
      }
    });
  };

  useEffect(() => {
    if (playlist && playlist.length > 0 && audioRef.current) {
      setCurrentTrackIndex(0);
      setIsPlaying(startPlaying); // Set playing state based on prop
      setCurrentTime(0);
      setDuration(0);
      setHasError(false);
      
      const audioUrl = playlist[0].url;
      if (audioUrl && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
        try {
          stopOtherAudioPlayers();
          if (!activeAudioPlayers.includes(audioRef.current)) {
            activeAudioPlayers.push(audioRef.current);
          }
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          if (startPlaying) {
            audioRef.current.play().catch(e => {
              console.error("Play failed", e);
              setIsPlaying(false);
            });
          }
          if (onTrackChange) onTrackChange(playlist[0].verseKey);
        } catch (error) {
          setHasError(true);
          toast.error("خطأ في تحميل الصوت: " + (error as Error).message);
        }
      } else {
        setHasError(true);
        toast.error("رابط الصوت غير صالح");
      }
    }
    
    return () => {
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        activeAudioPlayers = activeAudioPlayers.filter(player => player !== audioRef.current);
      }
    };
  }, [playlist, onTrackChange, startPlaying]);

  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) {
      toast.error("لا يوجد صوت متاح للتشغيل");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopOtherAudioPlayers();
      const currentTrack = playlist[currentTrackIndex];
      if (!currentTrack || !currentTrack.url) {
        toast.error("رابط الصوت غير صالح");
        return;
      }
      
      audioRef.current.play().catch(error => {
        toast.error("فشل تشغيل الصوت: " + error.message);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const changeTrack = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < playlist.length) {
      setCurrentTrackIndex(newIndex);
      if (audioRef.current) {
        stopOtherAudioPlayers();
        const nextTrack = playlist[newIndex];
        if (!nextTrack || !nextTrack.url) {
          toast.error("رابط المقطع التالي غير صالح");
          return;
        }
        
        try {
          audioRef.current.src = nextTrack.url;
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(error => {
              setIsPlaying(false);
              toast.error("فشل تشغيل المقطع التالي: " + error.message);
            });
          }
          if (onTrackChange) onTrackChange(nextTrack.verseKey);
        } catch (error) {
          toast.error("خطأ في إعداد المقطع التالي");
          setIsPlaying(false);
        }
      }
    } else if (newIndex >= playlist.length) {
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      if (audioRef.current && playlist[0] && playlist[0].url) {
        audioRef.current.src = playlist[0].url;
        audioRef.current.load();
        if (onTrackChange) onTrackChange(playlist[0].verseKey);
      }
      toast.info("نهاية التلاوة");
      if (onPlaylistEnded) onPlaylistEnded();
    }
  };

  const playNextTrack = () => changeTrack(currentTrackIndex + 1);
  const prevTrack = () => changeTrack(currentTrackIndex - 1);

  const handleEnded = () => playNextTrack();
  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };

  const handleError = (e: any) => {
    setHasError(true);
    setIsPlaying(false);
    const errorElement = e.target as HTMLAudioElement;
    const errorCode = errorElement.error ? errorElement.error.code : 0;
    const errorMessage = errorElement.error ? errorElement.error.message : "خطأ غير معروف";
    
    switch (errorCode) {
      case MediaError.MEDIA_ERR_ABORTED: toast.error("تم إلغاء تشغيل الصوت"); break;
      case MediaError.MEDIA_ERR_NETWORK: toast.error("خطأ في الشبكة أثناء تحميل الصوت"); break;
      case MediaError.MEDIA_ERR_DECODE: toast.error("خطأ في فك تشفير ملف الصوت"); break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: toast.error("تنسيق الصوت غير مدعوم أو الرابط غير صالح"); break;
      default: toast.error("حدث خطأ أثناء تحميل الصوت: " + errorMessage);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume > 0 ? volume : 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  return (
    <div className={isInHeader ? "header-audio-player" : "audio-player-ui"}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onError={handleError} onEnded={handleEnded} />

      {playlist.length > 0 && showControls && (
        <div className="w-full flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <button onClick={prevTrack} disabled={currentTrackIndex <= 0} className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipBack size={20} />
            </button>
            <button onClick={togglePlayPause} className="p-3 bg-white text-[var(--color-accent)] rounded-full hover:bg-gray-200 transition-transform transform active:scale-95">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={playNextTrack} disabled={currentTrackIndex >= playlist.length - 1} className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs w-12 text-center">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer audio-progress" disabled={!duration} />
            <span className="text-xs w-12 text-center">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer volume-slider" />
          </div>

          <div className="hidden md:block text-sm font-mono bg-white/10 px-2 py-1 rounded">
            {playlist[currentTrackIndex]?.verseKey}
          </div>
        </div>
      )}
    </div>
  );
});
