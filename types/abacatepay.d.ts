declare module 'abacatepay-nodejs-sdk' {
  export class AbacatePay {
    constructor(apiKey: string);
    payment: {
      create(data: PaymentCreateParams): Promise<Payment>;
    };
  }

  interface PaymentCreateParams {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
    customer?: string | null;
    payment_method?: string | null;
  }

  interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_url: string;
    created_at: string;
    // Add other fields you need
  }
}