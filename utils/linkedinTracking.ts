// utils/linkedinTracking.ts

// LinkedIn tracking data interface
interface LinkedInConversionData {
  conversion_id: string;
  conversion_value?: number;
  currency?: string;
  email?: string;
  seniority_level?: string;
  stack?: string;
  [key: string]: string | number | boolean | undefined;
}

// Additional data that can be passed to tracking
interface TrackingAdditionalData {
  conversion_value?: number;
  currency?: string;
  email?: string;
  seniority_level?: string;
  stack?: string;
  user_id?: string;
  campaign_id?: string;
  source?: string;
  medium?: string;
  [key: string]: string | number | boolean | undefined;
}

// Main tracking function
export const trackLinkedInConversion = (
  conversionId: string, 
  additionalData?: TrackingAdditionalData
): void => {
  if (typeof window !== 'undefined' && window.lintrk) {
    const trackingData: LinkedInConversionData = {
      conversion_id: conversionId,
      ...additionalData
    };
    
    window.lintrk('track', trackingData);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('LinkedIn conversion tracked:', trackingData);
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('LinkedIn tracking not available');
    }
  }
};

// Debug function to test LinkedIn tracking
export const debugLinkedInTracking = (): void => {
  if (typeof window === 'undefined') {
    console.log('Server-side - LinkedIn tracking not available');
    return;
  }

  console.log('=== LinkedIn Tracking Debug ===');
  console.log('lintrk function:', typeof window.lintrk);
  console.log('Partner ID:', process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID);
  
  if (window.lintrk) {
    console.log('✅ LinkedIn tracking is ready');
    // Test conversion
    window.lintrk('track', { conversion_id: 'debug_test' });
    console.log('🔥 Test conversion fired');
  } else {
    console.log('❌ LinkedIn tracking not loaded');
  }
};

// Specific tracking functions for common conversions
export const trackSubscription = (data: {
  email?: string;
  seniority_level?: string;
  stack?: string;
}): void => {
  trackLinkedInConversion('subscribe', data);
};

export const trackLeadGeneration = (data: {
  conversion_value?: number;
  currency?: string;
  source?: string;
}): void => {
  trackLinkedInConversion('lead_generation', data);
};

export const trackSignup = (data: {
  user_id?: string;
  email?: string;
}): void => {
  trackLinkedInConversion('signup', data);
};

// Type guard to check if LinkedIn tracking is available
export const isLinkedInTrackingAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.lintrk === 'function';
};

// Usage examples:
// trackSubscription({
//   email: 'user@example.com',
//   seniority_level: 'senior',
//   stack: 'frontend'
// });

// trackLeadGeneration({
//   conversion_value: 25.00,
//   currency: 'USD',
//   source: 'organic'
// });

// if (isLinkedInTrackingAvailable()) {
//   trackSubscription({ seniority_level: seniorityLevel, stack: stack });
// }