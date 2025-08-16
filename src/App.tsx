import { QuranReader } from "./components/QuranReader";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <QuranReader />
      
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e5e5',
            color: '#2c2c2c',
            fontFamily: 'Noto Sans Arabic, Cairo, sans-serif'
          }
        }}
      />
    </div>
  );
}
