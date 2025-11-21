import { useState } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useUser();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    try {
      login(username);
      toast.success(`Welcome ${username}!`);
      setTimeout(() => setLocation("/"), 500);
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileWrapper>
      <div className="w-full flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Flux Wallet</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="username">
              Your Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              data-testid="input-username"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-login"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Sign in to place orders and view your order history
        </p>
      </div>
    </MobileWrapper>
  );
}
