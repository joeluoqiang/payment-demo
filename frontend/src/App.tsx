
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PaymentPage from './pages/PaymentPage';
import PaymentResultPage from './pages/PaymentResultPage';
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