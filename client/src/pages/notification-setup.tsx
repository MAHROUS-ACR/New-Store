import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

export default function NotificationSetupPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      <div className="px-5 pt-3 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => setLocation("/")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">
          {language === "ar" ? "إعداد الإشعارات" : "Notifications"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-sm text-gray-600">
          {language === "ar" 
            ? "سيتم تفعيل الإشعارات قريباً"
            : "Notifications will be enabled soon"}
        </p>
      </div>
    </div>
  );
}
