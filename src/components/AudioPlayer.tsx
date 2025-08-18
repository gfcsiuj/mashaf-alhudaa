import { useState, useRef, useEffect, memo } from "react";
import { toast } from "sonner";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

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
  onPlaybackStarted?: () => void;
}

export const AudioPlayer = memo(function AudioPlayer({ playlist, showControls, isInHeader = false, onTrackChange, onPlaylistEnded, autoPlay = false, startPlaying = false, onPlaybackStarted }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const stopOtherAudioPlayers = () => {
    const currentPlayer = audioRef.current;
    activeAudioPlayers.forEach(player => {
      if (player !== currentPlayer && !player.paused) {
        player.pause();
      }
    });
  };

  useEffect(() => {
    if (playlist && playlist.length > 0 && audioRef.current) {
      setCurrentTrackIndex(0);
      setIsPlaying(startPlaying);
      setCurrentTime(0);
      setDuration(0);
      
      const audioUrl = playlist[0].url;
      if (audioUrl) {
        try {
          stopOtherAudioPlayers();
          if (!activeAudioPlayers.includes(audioRef.current)) {
            activeAudioPlayers.push(audioRef.current);
          }
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          if (startPlaying) {
            audioRef.current.play()
              .then(() => {
                if (onPlaybackStarted) onPlaybackStarted();
              })
              .catch(e => {
                console.error("Play failed", e);
                setIsPlaying(false);
              });
          }
          if (onTrackChange) onTrackChange(playlist[0].verseKey);
        } catch (error) {
          toast.error("خطأ في تحميل الصوت");
        }
      } else {
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
  }, [playlist, onTrackChange, startPlaying, onPlaybackStarted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopOtherAudioPlayers();
      audioRef.current.play().catch(e => {
        toast.error("فشل تشغيل الصوت");
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const changeTrack = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < playlist.length) {
      setCurrentTrackIndex(newIndex);
      if (audioRef.current) {
        const nextTrack = playlist[newIndex];
        if (nextTrack && nextTrack.url) {
          audioRef.current.src = nextTrack.url;
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(() => setIsPlaying(false));
          }
          if (onTrackChange) onTrackChange(nextTrack.verseKey);
        }
      }
    } else if (newIndex >= playlist.length) {
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      if (audioRef.current && playlist[0] && playlist[0].url) {
        audioRef.current.src = playlist[0].url;
      }
      if (onPlaylistEnded) onPlaylistEnded();
    }
  };

  const playNextTrack = () => changeTrack(currentTrackIndex + 1);
  const prevTrack = () => changeTrack(currentTrackIndex - 1);

  const handleEnded = () => {
    if (autoPlay) {
      playNextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) audioRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div className={isInHeader ? "header-audio-player" : "audio-player-ui"}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} />
      {playlist.length > 0 && showControls && (
        <div className="w-full flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <button onClick={prevTrack} disabled={currentTrackIndex <= 0} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50">
              <SkipBack size={20} />
            </button>
            <button onClick={togglePlayPause} className="p-3 bg-white text-accent rounded-full hover:bg-gray-200">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={playNextTrack} disabled={currentTrackIndex >= playlist.length - 1} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50">
              <SkipForward size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs w-12 text-center">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer" />
            <span className="text-xs w-12 text-center">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/20">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer" />
          </div>
          <div className="hidden md:block text-sm font-mono bg-white/10 px-2 py-1 rounded">
            {playlist[currentTrackIndex]?.verseKey}
          </div>
        </div>
      )}
    </div>
  );
});
