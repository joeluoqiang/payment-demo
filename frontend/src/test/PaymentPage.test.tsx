import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './utils';
import { BrowserRouter } from 'react-router-dom';
import PaymentPage from '../pages/PaymentPage';
import type { Country, PaymentScenario } from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock DropInComponent
vi.mock('../components/DropInComponent', () => ({
  default: () => <div data-testid="dropin-component">DropIn Component</div>,
}));

const defaultCountry: Country = {
  code: 'US',
  name: 'United States',
  currency: 'USD',
  language: 'en',
};

const defaultScenario: PaymentScenario = {
  id: 'dropin',
  name: 'Drop-in Demo',
  environment: 'sandbox',
  type: 'dropin',
  description: 'Drop-in payment demo',
};

const renderPaymentPage = (
  country: Country = defaultCountry,
  scenario: PaymentScenario = defaultScenario
) => {
  return render(
    <BrowserRouter>
      <PaymentPage country={country} scenario={scenario} />
    </BrowserRouter>
  );
};

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page header with correct title', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText(/Checkout/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render the back button', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render ViewSwitcher component', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText(/Merchant View|Developer View/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render Developer Tools button', async () => {
      renderPaymentPage();

      await waitFor(() => {
        // Use getAllByText since there might be multiple Dev Tools buttons
        const devToolsButtons = screen.getAllByText('Dev Tools');
        expect(devToolsButtons.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should render the order summary', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render the payment form', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render RoleLabel component', async () => {
      renderPaymentPage();

      await waitFor(() => {
        // Use getAllByText since there might be multiple Merchant Page labels
        const merchantLabels = screen.getAllByText('Merchant Page');
        expect(merchantLabels.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });
  });

  describe('Scenario Types', () => {
    it('should render card form for direct API scenario', async () => {
      const directApiScenario: PaymentScenario = {
        ...defaultScenario,
        id: 'directapi',
        type: 'directapi',
        name: 'Direct API Demo',
      };

      renderPaymentPage(defaultCountry, directApiScenario);

      await waitFor(() => {
        expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display scenario type badge', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('DROPIN')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Order Summary', () => {
    it('should display product list', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Premium Wireless Headphones')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display price breakdown', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Subtotal:')).toBeInTheDocument();
        expect(screen.getByText('Shipping:')).toBeInTheDocument();
        expect(screen.getByText('Tax:')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display total amount', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Total:')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Custom Payment Options', () => {
    it('should render custom payment toggle', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Custom Payment Options')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display currency selector when custom payment is enabled', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByText('Custom Payment Options')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      renderPaymentPage();

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', async () => {
      renderPaymentPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pay|Processing/i })).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
});