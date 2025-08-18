import { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';

interface AudioPanelProps {
  onClose: () => void;
  audioPlaylist: any[];
}

export function AudioPanel({ onClose, audioPlaylist }: AudioPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 font-ui">تشغيل الصوت</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {audioPlaylist && audioPlaylist.length > 0 ? (
            <div className="space-y-4">
              <AudioPlayer 
                playlist={audioPlaylist} 
                showControls={true}
              />
              <p className="text-sm text-gray-500 text-center mt-4 font-ui">
                يمكنك الاستماع إلى تلاوة الصفحة الحالية
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-ui">لا يوجد صوت متاح للتشغيل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}