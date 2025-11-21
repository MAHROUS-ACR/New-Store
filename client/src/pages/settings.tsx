import { useState } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft, Database, Save } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const [projectId, setProjectId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = async () => {
    if (!projectId || !privateKey || !clientEmail) {
      toast.error("Please fill in all Firebase configuration fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/firebase/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      if (response.ok) {
        toast.success("Firebase configuration saved successfully!");
        setProjectId("");
        setPrivateKey("");
        setClientEmail("");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save configuration");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileWrapper>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pb-4 pt-2 flex items-center gap-4 border-b border-gray-100">
          <button
            onClick={() => setLocation("/")}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Firebase Settings</h1>
            <p className="text-xs text-muted-foreground">Configure your data store</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 pb-24">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">Setup Instructions</p>
                <ol className="text-blue-800 space-y-1 list-decimal list-inside text-xs leading-relaxed">
                  <li>Go to Firebase Console → Project Settings</li>
                  <li>Navigate to Service Accounts tab</li>
                  <li>Click "Generate New Private Key"</li>
                  <li>Copy the values from the JSON file below</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="projectId">
                Project ID
              </label>
              <input
                id="projectId"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="your-project-id"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="input-project-id"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="clientEmail">
                Client Email
              </label>
              <input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                data-testid="input-client-email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="privateKey">
                Private Key
              </label>
              <textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={6}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs resize-none"
                data-testid="input-private-key"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include the full key with BEGIN and END markers
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-save-config"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </div>
    </MobileWrapper>
  );
}
