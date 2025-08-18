import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

let activeAudioPlayers: HTMLAudioElement[] = [];

interface AudioPlayerProps {
  initialPlaylist?: Array<{ verseKey: string; url: string; }>;
  showControls: boolean;
  isInHeader?: boolean;
  onTrackChange?: (verseKey: string) => void;
  onPlaylistEnded?: () => void;
}

export interface AudioPlayerRef {
  playAudio: (playlist: Array<{ verseKey: string; url: string; }>) => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ initialPlaylist = [], showControls, isInHeader = false, onTrackChange, onPlaylistEnded }, ref) => {
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const stopOtherAudioPlayers = () => {
    const currentPlayer = audioRef.current;
    activeAudioPlayers.forEach(player => {
      if (player !== currentPlayer && !player.paused) {
        player.pause();
      }
    });
  };

  useImperativeHandle(ref, () => ({
    playAudio: (newPlaylist) => {
      if (!audioRef.current) return;
      
      stopOtherAudioPlayers();
      setPlaylist(newPlaylist);
      setCurrentTrackIndex(0);

      const audioUrl = newPlaylist[0]?.url;
      if (audioUrl) {
        try {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => {
              console.error("Play failed", e);
              toast.error("فشل تشغيل الصوت");
              setIsPlaying(false);
            });
          if (onTrackChange) onTrackChange(newPlaylist[0].verseKey);
        } catch (error) {
          toast.error("خطأ في تحميل الصوت: " + (error as Error).message);
        }
      }
    }
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (!activeAudioPlayers.includes(audio)) {
        activeAudioPlayers.push(audio);
      }
      return () => {
        if (audio && !audio.paused) {
          audio.pause();
        }
        activeAudioPlayers = activeAudioPlayers.filter(p => p !== audio);
      };
    }
  }, []);

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopOtherAudioPlayers();
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const changeTrack = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < playlist.length) {
      setCurrentTrackIndex(newIndex);
      const nextTrack = playlist[newIndex];
      if (audioRef.current && nextTrack?.url) {
        audioRef.current.src = nextTrack.url;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(() => setIsPlaying(false));
        }
        if (onTrackChange) onTrackChange(nextTrack.verseKey);
      }
    } else if (newIndex >= playlist.length) {
      setIsPlaying(false);
      setCurrentTrackIndex(0);
      if (onPlaylistEnded) onPlaylistEnded();
    }
  };

  const playNextTrack = () => changeTrack(currentTrackIndex + 1);
  const prevTrack = () => changeTrack(currentTrackIndex - 1);

  const handleEnded = () => {
    setIsPlaying(false);
    playNextTrack();
  };

  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };

  return (
    <div className={isInHeader ? "header-audio-player" : "audio-player-ui"}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} />
      {showControls && (
        <div className="w-full flex items-center gap-4 text-white">
          <button onClick={prevTrack} disabled={playlist.length === 0 || currentTrackIndex <= 0} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50">
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlayPause} disabled={playlist.length === 0} className="p-3 bg-white text-[var(--color-accent)] rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={playNextTrack} disabled={playlist.length === 0 || currentTrackIndex >= playlist.length - 1} className="p-2 rounded-full hover:bg-white/20 disabled:opacity-50">
            <SkipForward size={20} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs w-12 text-center">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => { if(audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value)}} className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer" />
            <span className="text-xs w-12 text-center">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if(!audioRef.current) return;
              const newMuted = !isMuted;
              audioRef.current.muted = newMuted;
              setIsMuted(newMuted);
            }} className="p-2 rounded-full hover:bg-white/20">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => {
              if(!audioRef.current) return;
              const newVolume = parseFloat(e.target.value);
              setVolume(newVolume);
              setIsMuted(newVolume === 0);
              audioRef.current.volume = newVolume;
            }} className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer" />
          </div>
          <div className="hidden md:block text-sm font-mono bg-white/10 px-2 py-1 rounded">
            {playlist[currentTrackIndex]?.verseKey}
          </div>
        </div>
      )}
    </div>
  );
});
