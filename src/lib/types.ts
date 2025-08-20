export interface Verse {
    id: number;
    verse_key: string;
    text_uthmani: string;
    chapter_id: number;
    verse_number: number;
    page_number: number;
    audio?: {
      url: string;
      duration?: number;
    };
    translations?: any[];
    tafsirs?: any[];
  }
