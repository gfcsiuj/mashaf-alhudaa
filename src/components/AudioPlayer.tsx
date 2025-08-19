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
  onPlayFromEmpty?: () => void;
  autoPlay?: boolean;
  startPlaying?: boolean;
  onPlaybackStarted?: () => void;
}

export const AudioPlayer = memo(function AudioPlayer({ playlist, showControls, isInHeader = false, onTrackChange, onPlaylistEnded, onPlayFromEmpty, autoPlay = false, startPlaying = false, onPlaybackStarted }: AudioPlayerProps) {
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

  // Effect to load playlist and prepare the audio track
  useEffect(() => {
    if (playlist && playlist.length > 0 && audioRef.current) {
      stopOtherAudioPlayers();

      setCurrentTrackIndex(0);
      setCurrentTime(0);
      setDuration(0);
      setHasError(false);

      const audioUrl = playlist[0].url;
      if (audioUrl && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
        try {
          if (!activeAudioPlayers.includes(audioRef.current)) {
            activeAudioPlayers.push(audioRef.current);
          }
          audioRef.current.src = audioUrl;
          audioRef.current.load();
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

    // Cleanup function to pause and remove the player when the component unmounts
    return () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      activeAudioPlayers = activeAudioPlayers.filter(player => player !== audioRef.current);
    };
  }, [playlist, onTrackChange]);

  // Effect to handle auto-playing when `startPlaying` is true
  useEffect(() => {
    if (startPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (onPlaybackStarted) {
              onPlaybackStarted();
            }
          })
          .catch(e => {
            console.error("Play failed", e);
            toast.error("فشل تشغيل الصوت تلقائياً. قد تحتاج للنقر على زر التشغيل.");
            setIsPlaying(false);
          });
      }
    } else if (!startPlaying) {
      // If startPlaying becomes false, ensure we reflect the correct playing state.
      // This handles cases where playback might not have started.
      if (audioRef.current?.paused) {
        setIsPlaying(false);
      }
    }
  }, [startPlaying, playlist, onPlaybackStarted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (playlist.length === 0) {
      if (onPlayFromEmpty) onPlayFromEmpty();
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

  const changeTrack = (newIndex: number, shouldPlay = true) => {
    if (newIndex >= 0 && newIndex < playlist.length) {
      setCurrentTrackIndex(newIndex);
      if (audioRef.current) {
        const nextTrack = playlist[newIndex];
        if (!nextTrack || !nextTrack.url) {
          toast.error("رابط المقطع التالي غير صالح");
          setIsPlaying(false);
          return;
        }

        try {
          audioRef.current.src = nextTrack.url;
          audioRef.current.load();
          if (shouldPlay) {
            audioRef.current.play().catch(error => {
              setIsPlaying(false);
              toast.error("فشل تشغيل المقطع التالي: " + error.message);
            });
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
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
      if (onPlaylistEnded) onPlaylistEnded();
    }
  };

  const playNextTrack = () => changeTrack(currentTrackIndex + 1, true);
  const prevTrack = () => changeTrack(currentTrackIndex - 1, isPlaying);

  const handleEnded = () => {
    playNextTrack();
  };
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
