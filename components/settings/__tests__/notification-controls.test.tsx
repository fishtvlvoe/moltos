import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationControls } from '../notification-controls';

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn(),
    },
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('NotificationControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders three toggle switches for each channel', () => {
    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    expect(screen.getByText('郵件通知')).toBeInTheDocument();
    expect(screen.getByText('應用內通知')).toBeInTheDocument();
    expect(screen.getByText('推播通知')).toBeInTheDocument();
  });

  it('displays toggle switches with correct initial state', () => {
    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    const { container } = render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    const buttons = container.querySelectorAll('button[role="switch"]');
    expect(buttons).toHaveLength(3);

    expect(buttons[0]).toHaveAttribute('aria-checked', 'true'); // email
    expect(buttons[1]).toHaveAttribute('aria-checked', 'true'); // in_app
    expect(buttons[2]).toHaveAttribute('aria-checked', 'false'); // push
  });

  it('handles toggle click and updates UI optimistically', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    const { container } = render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    const pushToggle = container.querySelectorAll('button[role="switch"]')[2];
    fireEvent.click(pushToggle);

    // Check optimistic update (UI should show enabled)
    await waitFor(() => {
      expect(pushToggle).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('reverts UI state on API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Server error' }),
    });

    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    const { container } = render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    const pushToggle = container.querySelectorAll('button[role="switch"]')[2];
    const initialState = pushToggle.getAttribute('aria-checked');

    fireEvent.click(pushToggle);

    // State should revert after error
    await waitFor(() => {
      expect(pushToggle).toHaveAttribute('aria-checked', initialState);
    });
  });

  it('calls correct API endpoint with correct payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    const { container } = render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    const emailToggle = container.querySelectorAll('button[role="switch"]')[0];
    fireEvent.click(emailToggle);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/settings/notifications',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ channel: 'email', enabled: false }),
        })
      );
    });
  });

  it('disables toggles during loading', async () => {
    // Make the request hang
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            500
          );
        })
    );

    const preferences = {
      email: true,
      in_app: true,
      push: false,
    };

    const { container } = render(
      <NotificationControls
        userEmail="test@example.com"
        initialPreferences={preferences}
      />
    );

    const buttons = container.querySelectorAll('button[role="switch"]');
    fireEvent.click(buttons[0]);

    // All buttons should be disabled during loading
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
