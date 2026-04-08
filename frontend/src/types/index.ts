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

// 订阅套餐
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
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
  // 订阅相关字段
  isRecurring?: boolean;
  userReference?: string;
}

export interface CardInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
}

// 后续订阅支付请求
export interface RecurringPaymentRequest {
  tokenValue: string;
  amount: number;
  currency: string;
  merchantTransId: string;
  returnUrl: string;
  webhookUrl: string;
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
  // 订阅相关字段
  tokenValue?: string;
  userReference?: string;
}

export interface ActionInfo {
  type: string;
  data: any;
}

// Token存储信息
export interface StoredToken {
  tokenValue: string;
  userReference: string;
  createdAt: string;
}

export interface AppState {
  selectedCountry: Country | null;
  selectedScenario: PaymentScenario | null;
  countries: Country[];
  scenarios: PaymentScenario[];
  language: string;
  // 新增支付分类
  paymentCategory: 'one-time' | 'recurring';
  // 选中的订阅套餐
  selectedPlan: SubscriptionPlan | null;
}

// 开发者模式相关类型
export interface ApiLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response';
  apiName: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  status?: number;
  duration?: number;
}

export interface PendingRedirect {
  url: string;
  label: string;
}