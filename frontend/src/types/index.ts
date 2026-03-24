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

export type ViewMode = 'merchant' | 'developer';

export interface AppState {
  selectedCountry: Country | null;
  selectedScenario: PaymentScenario | null;
  countries: Country[];
  scenarios: PaymentScenario[];
  language: string;
  viewMode: ViewMode;
  roleLabelsEnabled: boolean;
  recording: boolean;
  region: string;
}

// ================= Subscription Types =================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface SubscriptionRequest {
  planId: string;
  merchantTransId: string;
  returnUrl: string;
  webhookUrl: string;
}

export interface Subscription {
  id: string;
  merchantTransId: string;
  planId: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface SubscriptionResponse {
  success: boolean;
  sessionId?: string;
  linkUrl?: string;
  merchantTransId: string;
  subscriptionId?: string;
  status: string;
  message: string;
}

// ================= Refund Types =================

export interface RefundRequest {
  amount: number;
  currency: string;
  merchantTransId: string;
  refundTransId: string;
  reason: string;
}

export interface Refund {
  id: string;
  merchantTransId: string;
  refundTransId: string;
  originalAmount: number;
  refundAmount: number;
  currency: string;
  status: string;
  reason: string;
  createdAt: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  refundTransId: string;
  merchantTransId: string;
  status: string;
  message: string;
  amount: number;
  currency: string;
}

// ================= Scenario Type =================

export type ScenarioType = 'payment' | 'subscription' | 'refund';