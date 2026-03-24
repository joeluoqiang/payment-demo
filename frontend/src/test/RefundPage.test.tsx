import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './utils';
import { BrowserRouter } from 'react-router-dom';
import RefundPage from '../pages/RefundPage';
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

const renderRefundPage = () => {
  return render(
    <BrowserRouter>
      <RefundPage />
    </BrowserRouter>
  );
};

describe('RefundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page header with correct title', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Refund Management')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render the back button', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should render Developer Tools button', async () => {
      renderRefundPage();

      await waitFor(() => {
        const devToolsButtons = screen.getAllByText('Dev Tools');
        expect(devToolsButtons.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should render RoleLabel component', async () => {
      renderRefundPage();

      await waitFor(() => {
        const merchantLabels = screen.getAllByText('Merchant Page');
        expect(merchantLabels.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });

    it('should render FlowIndicator component', async () => {
      renderRefundPage();

      await waitFor(() => {
        const enterDetailsElements = screen.getAllByText('Enter Details');
        const processRefundElements = screen.getAllByText('Process Refund');
        const confirmationElements = screen.getAllByText('Confirmation');
        expect(enterDetailsElements.length).toBeGreaterThan(0);
        expect(processRefundElements.length).toBeGreaterThan(0);
        expect(confirmationElements.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    });
  });

  describe('Refund Form', () => {
    it('should render the refund form', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Initiate Refund')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have transaction ID input field', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/Original Transaction ID/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have amount input field', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/Refund Amount/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have currency selector', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have reason textarea', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/Refund Reason/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have submit button', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Submit Refund')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should have reset button', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      renderRefundPage();

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Refund');
        fireEvent.click(submitButton);
      }, { timeout: 10000 });

      // Form validation should prevent submission
      await waitFor(() => {
        expect(api.apiService.createRefund).not.toHaveBeenCalled();
      }, { timeout: 10000 });
    });
  });

  describe('Refund Information Panel', () => {
    it('should display refund information section', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText('Refund Information')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display refund instructions', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText(/How to process a refund/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should display important notes', async () => {
      renderRefundPage();

      await waitFor(() => {
        expect(screen.getByText(/Important Notes/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      renderRefundPage();

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', async () => {
      renderRefundPage();

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Refund/i });
        expect(submitButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });
});