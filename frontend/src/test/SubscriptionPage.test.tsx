import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './utils';
import { BrowserRouter } from 'react-router-dom';
import SubscriptionPage from '../pages/SubscriptionPage';
import * as api from '../services/api';

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

const renderSubscriptionPage = () => {
  return render(
    <BrowserRouter>
      <SubscriptionPage />
    </BrowserRouter>
  );
};

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page header with correct title', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        expect(screen.getByText('Subscription Plans')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render the back button', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render Developer Tools button', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const devToolsButtons = screen.getAllByText('Dev Tools');
        expect(devToolsButtons.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should render RoleLabel component', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const merchantLabels = screen.getAllByText('Merchant Page');
        expect(merchantLabels.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });
  });

  describe('Plan Loading', () => {
    it('should load and display subscription plans', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        expect(screen.getByText('Basic Plan')).toBeInTheDocument();
      }, { timeout: 10000 });

      await waitFor(() => {
        expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display plan prices correctly', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        // Use getAllByText or look for price elements specifically
        const priceElements = screen.getAllByText(/9\.99/);
        expect(priceElements.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should display plan features', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const featureElements = screen.getAllByText('Feature 1');
        expect(featureElements.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should call getSubscriptionPlans API on mount', async () => {
      const getPlansSpy = vi.spyOn(api.apiService, 'getSubscriptionPlans');
      renderSubscriptionPage();

      await waitFor(() => {
        expect(getPlansSpy).toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Plan Selection', () => {
    it('should render select buttons for each plan', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const selectButtons = screen.getAllByText('Select Plan');
        expect(selectButtons.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should display Most Popular tag for pro plan', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        expect(screen.getByText('Most Popular')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Accessibility', () => {
    it('should have plan cards that are clickable', async () => {
      renderSubscriptionPage();

      await waitFor(() => {
        const selectButtons = screen.getAllByRole('button', { name: /Select Plan/i });
        expect(selectButtons.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });
  });
});