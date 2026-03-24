
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PaymentPage from './pages/PaymentPage';
import PaymentResultPage from './pages/PaymentResultPage';
import SubscriptionPage from './pages/SubscriptionPage';
import RefundPage from './pages/RefundPage';
import { AppProvider, useApp } from './context/AppContext';
import './App.css';

function AppContent() {
  const { state } = useApp();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/payment"
          element={
            state.selectedCountry && state.selectedScenario ? (
              <PaymentPage
                country={state.selectedCountry}
                scenario={state.selectedScenario}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/subscription-result" element={<PaymentResultPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;