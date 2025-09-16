# 支付集成演示网站

这是一个完整的支付产品演示网站，展示了LinkPay、Drop-in和Direct API三种不同的支付集成方式。

## 项目结构

```
payment demo/
├── frontend/          # React + TypeScript 前端
├── backend/           # Go + Gin 后端
└── README.md
```

## 功能特性

- 🌍 多国家/地区支持（全球、中国香港、韩国、日本、马来西亚、印尼、泰国、新加坡）
- 🗣️ 多语言支持（英文、中文，可扩展）
- 💰 多币种支持（USD、HKD、KRW、JPY、MYR、IDR、THB、SGD）
- 🔄 三种支付方式：
  - **LinkPay**: 重定向式支付链接
  - **Drop-in**: 嵌入式支付组件
  - **Direct API**: 直接API调用（包含3DS认证）
- 🎯 多环境支持（UAT测试环境、生产环境）

## 快速开始

### 1. 启动后端服务

```bash
cd backend
go mod tidy
go run cmd/server/main.go
```

后端服务将在 http://localhost:8080 启动

### 2. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 3. 访问应用

打开浏览器访问 http://localhost:5173

## 配置真实支付接口

### 获取API密钥

1. 访问 [Evonet开发者中心](https://developer.evonetonline.com/)
2. 注册账户并获取KeyID和SignKey
3. 在backend目录下复制.env.example为.env
4. 填入你的API配置：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env` 文件：

```env
EVONET_KEY_ID=your_actual_key_id
EVONET_SIGN_KEY=your_actual_sign_key
```

### API文档参考

- [Drop-in集成文档](https://developer.evonetonline.com/v2.0/docs/drop-in-integration-step-en)
- [LinkPay集成文档](https://developer.evonetonline.com/v2.0/docs/linkpay-integration-step)
- [Direct API集成文档](https://developer.evonetonline.com/v2.0/docs/direct-api-integration)

## 演示模式

如果没有配置真实的API密钥，系统将运行在演示模式下，返回模拟的支付响应，方便开发和测试。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Ant Design (UI组件库)
- React Router (路由)
- React i18next (国际化)
- Axios (HTTP客户端)

### 后端
- Go 1.21+
- Gin (Web框架)
- 标准库(net/http, crypto等)

## 开发说明

### 目录结构

**前端 (frontend/)**
```
src/
├── components/        # 可复用组件
├── pages/            # 页面组件
├── hooks/            # 自定义Hooks
├── services/         # API服务
├── locales/          # 国际化文件
├── types/            # TypeScript类型定义
├── context/          # React Context
└── utils/            # 工具函数
```

**后端 (backend/)**
```
cmd/server/           # 应用入口
config/              # 配置管理
internal/
├── api/             # HTTP路由和处理器
├── service/         # 业务逻辑
├── models/          # 数据模型
└── utils/           # 工具函数
```

### 添加新支付方式

1. 在 `backend/internal/models/models.go` 中添加新的支付方式结构
2. 在 `backend/internal/service/payment.go` 中实现支付逻辑
3. 在 `frontend/src/pages/PaymentPage.tsx` 中添加前端支持
4. 更新场景配置和多语言文件

### 添加新语言

1. 在 `frontend/src/locales/` 中添加新的语言文件
2. 更新 `frontend/src/locales/index.ts` 中的配置
3. 在 `frontend/src/hooks/useAppState.ts` 中更新语言映射

## 注意事项

- 测试卡号：4895330111111119 (有效期：12/31, CVV：390)
- UAT环境用于测试，生产环境用于真实交易
- 确保在生产环境中正确配置webhook URL
- 支付成功后会触发webhook通知，需要返回"SUCCESS"确认

## 支持与帮助

如有问题，请参考：
- [Evonet API文档](https://developer.evonetonline.com/v2.0/)
- [技术支持联系方式](https://developer.evonetonline.com/contact)