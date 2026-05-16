import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/NotificationsBell', () => {
  return function MockNotificationsBell() {
    return <div data-testid="notifications-bell" />;
  };
});

describe('Navbar Component', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    mockRouter.push.mockClear();
  });

  it('renders sign in and sign up links when no user is provided', () => {
    render(<Navbar user={null} />);
    
    // Check for Sign In and Join links
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join/i })).toBeInTheDocument();
  });

  it('renders user menu when user is provided', () => {
    const user = { name: 'John Doe', email: 'john@example.com', role: 'BUYER' };
    render(<Navbar user={user} />);
    
    // Check for user menu trigger and initial
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    
    // Sign in links should not be present
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('renders admin link only for admin users in the dropdown', () => {
    const adminUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' };
    render(<Navbar user={adminUser} />);
    
    // Open user menu
    const menuButton = screen.getByRole('button', { name: / Menu$/ });
    fireEvent.click(menuButton);
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    
    // Should not have dealer portal entry
    expect(screen.queryByRole('link', { name: /portal/i })).not.toBeInTheDocument();
  });

  it('renders dealer link only for dealer users in the dropdown', () => {
    const dealerUser = { name: 'Dealer User', email: 'dealer@example.com', role: 'DEALER' };
    render(<Navbar user={dealerUser} />);
    
    // Open user menu
    const menuButton = screen.getByRole('button', { name: / Menu$/ });
    fireEvent.click(menuButton);
    
    expect(screen.getByRole('link', { name: /^portal$/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });
});
