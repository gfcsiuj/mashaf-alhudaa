import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

// متغير عام لتتبع مشغلات الصوت النشطة
let activeAudioPlayers: HTMLAudioElement[] = [];

interface AudioPlayerProps {
  // تعديل مهم: استقبل قائمة تشغيل تحتوي على روابط كاملة وجاهزة
  playlist: Array<{
    verseKey: string;
    url: string; // الرابط يجب أن يكون كاملاً وجاهزاً للتشغيل
  }>;
  showControls: boolean;
  // لم نعد بحاجة لـ currentPage و selectedReciter هنا
  isInHeader?: boolean; // إضافة خاصية لتحديد ما إذا كان المشغل في الشريط العلوي
}

export function AudioPlayer({ playlist, showControls, isInHeader = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  // Initialize audio when playlist changes
  useEffect(() => {
    // إذا كانت هناك قائمة تشغيل جديدة، قم بإعدادها
    if (playlist && playlist.length > 0 && audioRef.current) {
      setCurrentTrackIndex(0);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setHasError(false);
      
      // ببساطة: جهز أول ملف صوتي في القائمة
      const audioUrl = playlist[0].url;
      console.log("Loading audio URL:", audioUrl);
      
      // التأكد من أن الرابط صالح
      if (audioUrl && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
        try {
          // إضافة مشغل الصوت الحالي إلى قائمة المشغلات النشطة
          if (!activeAudioPlayers.includes(audioRef.current)) {
            activeAudioPlayers.push(audioRef.current);
          }
          
          audioRef.current.src = audioUrl;
          audioRef.current.load(); // أمر للمتصفح بتحميل البيانات الوصفية للملف
          console.log("Audio loaded successfully");
        } catch (error) {
          console.error("Error loading audio:", error);
          setHasError(true);
          toast.error("خطأ في تحميل الصوت: " + (error as Error).message);
        }
      } else {
        console.error("Invalid audio URL:", audioUrl);
        setHasError(true);
        toast.error("رابط الصوت غير صالح");
      }
    }
    
    // دالة التنظيف - إزالة مشغل الصوت من القائمة عند إزالة المكون
    return () => {
      if (audioRef.current) {
        // إيقاف التشغيل
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        
        // إزالة من قائمة المشغلات النشطة
        activeAudioPlayers = activeAudioPlayers.filter(player => player !== audioRef.current);
      }
    };
  }, [playlist]); // اعتمد فقط على قائمة التشغيل

  // تبسيط وظيفة التشغيل والإيقاف
  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) {
      toast.error("لا يوجد صوت متاح للتشغيل");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // إيقاف جميع مشغلات الصوت الأخرى قبل التشغيل
      stopOtherAudioPlayers();
      
      // التأكد من أن الرابط صالح قبل التشغيل
      const currentTrack = playlist[currentTrackIndex];
      if (!currentTrack || !currentTrack.url) {
        toast.error("رابط الصوت غير صالح");
        return;
      }
      
      // التحقق من صحة عنوان URL
      if (!currentTrack.url.startsWith('http://') && !currentTrack.url.startsWith('https://')) {
        console.error("Invalid audio URL format:", currentTrack.url);
        toast.error("تنسيق رابط الصوت غير صالح");
        return;
      }
      
      console.log("Playing audio:", currentTrack.url);
      
      // استخدم .catch() لمعالجة الأخطاء التي تمنع التشغيل التلقائي
      audioRef.current.play().catch(error => {
        console.error("Audio play failed:", error);
        toast.error("فشل تشغيل الصوت: " + error.message);
        setIsPlaying(false);
        
        // عرض معلومات إضافية عن الخطأ
        if (error.name === "NotSupportedError") {
          console.error("Audio format not supported");
          toast.error("تنسيق الصوت غير مدعوم في المتصفح");
        } else if (error.name === "NotAllowedError") {
          console.error("Autoplay not allowed");
          toast.error("المتصفح لا يسمح بالتشغيل التلقائي");
        }
      });
      setIsPlaying(true);
    }
  };

  // منطق التشغيل المتتابع - الانتقال للمقطع التالي
  const playNextTrack = () => {
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex < playlist.length) {
      setCurrentTrackIndex(nextIndex);
      if (audioRef.current) {
        // إيقاف جميع مشغلات الصوت الأخرى قبل التشغيل
        stopOtherAudioPlayers();
        
        // التأكد من أن الرابط صالح
        const nextTrack = playlist[nextIndex];
        if (!nextTrack || !nextTrack.url) {
          console.error("Invalid next track URL");
          toast.error("رابط المقطع التالي غير صالح");
          return;
        }
        
        // التحقق من صحة عنوان URL
        if (!nextTrack.url.startsWith('http://') && !nextTrack.url.startsWith('https://')) {
          console.error("Invalid next track URL format:", nextTrack.url);
          toast.error("تنسيق رابط المقطع التالي غير صالح");
          return;
        }
        
        console.log("Playing next track:", nextTrack.url);
        
        try {
          // قم بتغيير المصدر إلى الملف التالي في القائمة
          audioRef.current.src = nextTrack.url;
          // ثم قم بتشغيله
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(error => {
              console.error("Failed to play next track:", error);
              setIsPlaying(false);
              toast.error("فشل تشغيل المقطع التالي: " + error.message);
              
              // عرض معلومات إضافية عن الخطأ
              if (error.name === "NotSupportedError") {
                console.error("Next track format not supported");
                toast.error("تنسيق المقطع التالي غير مدعوم في المتصفح");
              }
            });
          }
        } catch (error) {
          console.error("Error setting next track:", error);
          toast.error("خطأ في إعداد المقطع التالي");
          setIsPlaying(false);
        }
      }
    } else {
      // لقد انتهت القائمة
      setIsPlaying(false);
      setCurrentTrackIndex(0); // أعد المؤشر إلى البداية
      if (audioRef.current && playlist[0] && playlist[0].url) {
        try {
          audioRef.current.src = playlist[0].url;
          audioRef.current.load();
        } catch (error) {
          console.error("Error resetting playlist:", error);
        }
      }
      toast.info("نهاية التلاوة");
    }
  };

  // الانتقال للمقطع السابق
  const prevTrack = () => {
    const prevIndex = currentTrackIndex - 1;
    if (prevIndex >= 0) {
      setCurrentTrackIndex(prevIndex);
      if (audioRef.current) {
        // إيقاف جميع مشغلات الصوت الأخرى قبل التشغيل
        stopOtherAudioPlayers();
        
        // التأكد من أن الرابط صالح
        const prevTrack = playlist[prevIndex];
        if (!prevTrack || !prevTrack.url) {
          console.error("Invalid previous track URL");
          toast.error("رابط المقطع السابق غير صالح");
          return;
        }
        
        // التحقق من صحة عنوان URL
        if (!prevTrack.url.startsWith('http://') && !prevTrack.url.startsWith('https://')) {
          console.error("Invalid previous track URL format:", prevTrack.url);
          toast.error("تنسيق رابط المقطع السابق غير صالح");
          return;
        }
        
        console.log("Playing previous track:", prevTrack.url);
        
        try {
          // قم بتغيير المصدر إلى الملف السابق في القائمة
          audioRef.current.src = prevTrack.url;
          // ثم قم بتشغيله
          audioRef.current.load();
          if (isPlaying) {
            audioRef.current.play().catch(error => {
              console.error("Failed to play previous track:", error);
              setIsPlaying(false);
              toast.error("فشل تشغيل المقطع السابق: " + error.message);
              
              // عرض معلومات إضافية عن الخطأ
              if (error.name === "NotSupportedError") {
                console.error("Previous track format not supported");
                toast.error("تنسيق المقطع السابق غير مدعوم في المتصفح");
              }
            });
          }
        } catch (error) {
          console.error("Error setting previous track:", error);
          toast.error("خطأ في إعداد المقطع السابق");
          setIsPlaying(false);
        }
      }
    } else {
      toast.info("بداية التلاوة");
    }
  };

  // هذه الدالة التي سيتم استدعاؤها تلقائياً عند انتهاء كل مقطع
  const handleEnded = () => {
    playNextTrack();
  };

  // تحديث الوقت الحالي أثناء التشغيل
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // تحديث المدة عند تحميل البيانات الوصفية
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // معالجة أخطاء تحميل الصوت
  const handleError = (e: any) => {
    console.error("Audio error:", e);
    setHasError(true);
    setIsPlaying(false);
    
    // الحصول على معلومات أكثر تفصيلاً عن الخطأ
    const errorElement = e.target as HTMLAudioElement;
    const errorCode = errorElement.error ? errorElement.error.code : 0;
    const errorMessage = errorElement.error ? errorElement.error.message : "خطأ غير معروف";
    
    console.error(`Audio error code: ${errorCode}, message: ${errorMessage}`);
    
    // عرض رسائل خطأ أكثر تفصيلاً بناءً على نوع الخطأ
    switch (errorCode) {
      case MediaError.MEDIA_ERR_ABORTED:
        toast.error("تم إلغاء تشغيل الصوت");
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        toast.error("خطأ في الشبكة أثناء تحميل الصوت");
        break;
      case MediaError.MEDIA_ERR_DECODE:
        toast.error("خطأ في فك تشفير ملف الصوت");
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        toast.error("تنسيق الصوت غير مدعوم أو الرابط غير صالح");
        break;
      default:
        toast.error("حدث خطأ أثناء تحميل الصوت: " + errorMessage);
    }
    
    // طباعة عنوان URL الحالي للتصحيح
    if (audioRef.current) {
      console.log("Current audio source URL:", audioRef.current.src);
    }
  };

  // تغيير موضع التشغيل
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className={isInHeader ? "header-audio-player" : "audio-player"}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={handleEnded}
      />

      {playlist.length > 0 && (
        <>
          {showControls && (
            <div className="audio-controls">
              <button
                onClick={prevTrack}
                disabled={currentTrackIndex <= 0}
                className="control-button"
                aria-label="Previous Track"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
                </svg>
              </button>

              <button
                onClick={togglePlayPause}
                className="control-button play-pause"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={playNextTrack}
                disabled={currentTrackIndex >= playlist.length - 1}
                className="control-button"
                aria-label="Next Track"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
                </svg>
              </button>
              
              <div className="track-info">
                <span className="verse-key">{playlist[currentTrackIndex]?.verseKey}</span>
              </div>
            </div>
          )}

          {showControls && (
            <div className="progress-container">
              <span className="audio-time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="progress-bar"
                disabled={!duration}
              />
              <span className="audio-time">{formatTime(duration)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
