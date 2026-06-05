# 🚀 Payment Demo - 服务运行状态

## ✅ 服务已启动成功！

### 📌 访问链接

#### 🌐 前端应用（主页面）
**URL:** http://localhost:5173

**主要功能页面:**
- 首页（选择国家和支付方式）: http://localhost:5173/
- 一次性支付页面: http://localhost:5173/payment
- **订阅支付页面:**
  - LinkPay订阅: http://localhost:5173/subscription-payment?type=linkpay
  - Drop-in订阅: http://localhost:5173/subscription-payment?type=dropin
  - Direct API订阅: http://localhost:5173/subscription-payment?type=directapi
- 支付结果页面: http://localhost:5173/payment-result

#### 🔧 后端API服务
**Base URL:** http://localhost:8080

**核心API端点:**
- 健康检查: http://localhost:8080/health
- 国家列表: http://localhost:8080/api/v1/countries
- 支付场景: http://localhost:8080/api/v1/scenarios
- **订阅套餐列表: http://localhost:8080/api/v1/subscription-plans**
- 配置信息: http://localhost:8080/api/v1/config

---

## 📦 订阅功能演示路径

### 方式1: 从首页开始
1. 访问 http://localhost:5173
2. 选择国家/地区（例如：Global - USD）
3. 选择支付方式（LinkPay/Drop-in/Direct API）
4. 点击"Continue to Payment"
5. 在支付类型选择中选择"Subscription Payment（订阅支付）"

### 方式2: 直接访问订阅页面
- **LinkPay订阅**: http://localhost:5173/subscription-payment?type=linkpay
- **Drop-in订阅**: http://localhost:5173/subscription-payment?type=dropin
- **Direct API订阅**: http://localhost:5173/subscription-payment?type=directapi

---

## 💎 订阅套餐

系统提供三个订阅套餐：

| 套餐名称 | 价格 | 周期 | 描述 |
|---------|------|------|------|
| **Basic Plan** | $1 USD | 月付 | 基础功能 |
| **Premium Plan** | $10 USD | 月付 | 高级功能 |
| **Enterprise Plan** | $100 USD | 月付 | 企业级无限访问 |

---

## 🧪 测试卡信息

**卡号:** 4895 3301 1111 1119  
**有效期:** 12/31  
**CVV:** 390  
**持卡人:** John Doe  
**3DS验证码（OTP）:** 123456

---

## 🛠️ 技术架构

### 前端
- **框架:** React 19 + TypeScript + Vite
- **UI库:** Ant Design 5.x
- **路由:** React Router 7.x
- **国际化:** i18next + react-i18next
- **HTTP客户端:** Axios

### 后端
- **语言:** Go 1.24.2
- **框架:** Gin Web Framework
- **支付网关:** Evonet Payment API

---

## 📊 服务状态

| 服务 | 端口 | 状态 | PID |
|------|------|------|-----|
| 前端服务 | 5173 | ✅ Running | Terminal 4 |
| 后端服务 | 8080 | ✅ Running | Terminal 3 |

---

## 🔄 订阅支付流程

### 首次订阅流程
1. 用户选择订阅套餐（Basic/Premium/Enterprise）
2. 输入支付信息（或跳转支付页面）
3. 完成首次支付
4. 系统生成并保存Token（用于后续自动扣款）
5. 返回支付结果页面

### Token管理
- **用户标识:** 通过Cookie存储`userReference`
- **Token存储:** 内存存储（生产环境建议使用数据库）
- **查询Token:** GET `/api/v1/tokens/{userReference}`

### 后续扣款
- **API端点:** POST `/api/v1/payment/recurring`
- **使用已保存的Token进行免密支付**
- 无需用户再次输入卡号信息

---

## 🎯 功能特性

✅ 多区域支持（8个国家/地区）  
✅ 多币种支持（USD, HKD, KRW, JPY, MYR, IDR, THB, SGD）  
✅ 多语言支持（英文、中文、日文、韩文）  
✅ 三种支付方式（LinkPay、Drop-in、Direct API）  
✅ **完整的订阅支付功能**  
✅ Token管理和后续扣款  
✅ 开发者模式（API日志查看）  
✅ 环境切换（UAT/Production）  

---

## 🔧 停止服务

如需停止服务，在终端执行：
```bash
# 查看运行中的进程
ps aux | grep -E "go run|vite"

# 或使用 Kiro 停止进程（如果可用）
```

---

## 📝 注意事项

⚠️ **当前运行在Demo模式**  
- 后端配置了演示API密钥
- 支付不会真实扣款
- Token存储在内存中（服务重启后丢失）

🔐 **生产环境配置**  
如需使用真实支付API，请：
1. 访问 https://developer.evonetonline.com/ 获取真实API密钥
2. 编辑 `/Users/joe/dev project/payment-demo/backend/.env`
3. 更新 `EVONET_KEY_ID` 和 `EVONET_SIGN_KEY`
4. 重启后端服务

---

**生成时间:** 2026-06-05 09:12  
**状态:** ✅ 所有服务正常运行
