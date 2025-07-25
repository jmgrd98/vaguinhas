// Update your LinkedInSignIn component
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FaLinkedin } from "react-icons/fa";
import { toast } from "sonner";

interface LinkedInSignInProps {
  stack: string;
  seniorityLevel: string;
}

export default function LinkedInSignIn({ stack, seniorityLevel }: LinkedInSignInProps) {
  const handleLinkedInSignIn = async () => {
    if (!stack || !seniorityLevel) {
      toast.error('Please select your area and professional level first');
      return;
    }
    
    // Store in multiple places for redundancy
    const oauthData = JSON.stringify({ 
      stack, 
      seniorityLevel,
      timestamp: Date.now()
    });
    
    // 1. Session storage
    sessionStorage.setItem('oauth_params', oauthData);
    
    // 2. Cookie (more reliable across redirects)
    document.cookie = `oauth_params=${encodeURIComponent(oauthData)}; path=/; max-age=3600; SameSite=Lax`;
    
    // 3. Pass through state parameter (most reliable)
    const stateData = btoa(JSON.stringify({ stack, seniorityLevel }));
    
    // Use signIn with state parameter
    await signIn("linkedin", { 
      callbackUrl: `/auth/callback?state=${stateData}`,
      redirect: true 
    });
  };

  return (
    <Button 
      className="cursor-pointer w-1/3 bg-transparent text-[#8B8B8B] border border-[#8B8B8B] hover:text-white hover:bg-[#8B8B8B] transition-colors" 
      onClick={handleLinkedInSignIn}
      disabled={!stack || !seniorityLevel}
    >
      <FaLinkedin className="mr-2" /> Sign in with LinkedIn
    </Button>
  );
}