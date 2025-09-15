export interface Country {
  code: string;
  name: string;
  currency: string;
  language: string;
}

export interface PaymentScenario {
  id: string;
  name: string;
  environment: string;
  type: string;
  description: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  merchantTransId: string;
  paymentType: string;
  paymentMethod?: string;
  returnUrl: string;
  webhookUrl: string;
  cardInfo?: CardInfo;
}

export interface CardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
}

export interface PaymentResponse {
  success: boolean;
  sessionId?: string;
  linkUrl?: string;
  merchantTransId: string;
  status: string;
  message: string;
  data?: any;
  action?: ActionInfo;
}

export interface ActionInfo {
  type: string;
  data: any;
}

export interface AppState {
  selectedCountry: Country | null;
  selectedScenario: PaymentScenario | null;
  countries: Country[];
  scenarios: PaymentScenario[];
  language: string;
}