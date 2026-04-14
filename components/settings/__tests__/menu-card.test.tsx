import React from 'react';
import { render, screen } from '@testing-library/react';
import { MenuCard } from '../menu-card';

describe('MenuCard', () => {
  it('renders all 5 menu items with correct labels', () => {
    render(<MenuCard />);
    expect(screen.getByText('通知設定')).toBeInTheDocument();
    expect(screen.getByText('提醒排程')).toBeInTheDocument();
    expect(screen.getByText('Gmail 整合')).toBeInTheDocument();
    expect(screen.getByText('資訊來源')).toBeInTheDocument();
    expect(screen.getByText('隱私與資料')).toBeInTheDocument();
  });

  it('renders SVG icons for each menu item', () => {
    const { container } = render(<MenuCard />);
    // 檢查 5 個 SVG icon（Lucide icon 會產生 svg 元素）
    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(5);
  });

  it('navigates to correct routes on click', () => {
    render(<MenuCard />);
    const notificationLink = screen.getByTestId('menu-item-通知設定').closest('a');
    const reminderLink = screen.getByTestId('menu-item-提醒排程').closest('a');
    const gmailLink = screen.getByTestId('menu-item-Gmail 整合').closest('a');
    const sourceLink = screen.getByTestId('menu-item-資訊來源').closest('a');
    const privacyLink = screen.getByTestId('menu-item-隱私與資料').closest('a');

    expect(notificationLink).toHaveAttribute('href', '/settings/notifications');
    expect(reminderLink).toHaveAttribute('href', '/settings/reminders');
    expect(gmailLink).toHaveAttribute('href', '/settings/gmail');
    expect(sourceLink).toHaveAttribute('href', '/settings/sources');
    expect(privacyLink).toHaveAttribute('href', '/settings/privacy');
  });

  it('has proper touch target size for mobile accessibility', () => {
    const { container } = render(<MenuCard />);
    const menuItems = container.querySelectorAll('[data-testid^="menu-item-"]');
    menuItems.forEach((item) => {
      const link = item.closest('a');
      expect(link).toHaveClass('block'); // Display block for full width
      const div = link?.querySelector('div[class*="flex"]');
      expect(div).toHaveClass('py-3.5'); // ~56px height, exceeds 44×44px minimum
    });
  });
});
