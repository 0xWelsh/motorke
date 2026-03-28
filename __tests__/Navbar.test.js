import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Navbar Component', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    mockRouter.push.mockClear();
  });

  it('renders sign in and sign up links when no user is provided', () => {
    render(<Navbar user={null} />);
    
    // Check for Sign In and Join Standard links
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join standard/i })).toBeInTheDocument();
  });

  it('renders user menu when user is provided', () => {
    const user = { name: 'John Doe', email: 'john@example.com', role: 'USER' };
    render(<Navbar user={user} />);
    
    // Check for user initials
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    
    // Sign in links should not be present
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('renders admin link only for admin users in the dropdown', () => {
    const adminUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' };
    render(<Navbar user={adminUser} />);
    
    // Open user menu
    const menuButton = screen.getByRole('button', { name: /A Admin/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByRole('link', { name: /administration/i })).toBeInTheDocument();
    
    // Should not have Dealer Portal
    expect(screen.queryByRole('link', { name: /dealer portal/i })).not.toBeInTheDocument();
  });

  it('renders dealer link only for dealer users in the dropdown', () => {
    const dealerUser = { name: 'Dealer User', email: 'dealer@example.com', role: 'DEALER' };
    render(<Navbar user={dealerUser} />);
    
    // Open user menu
    const menuButton = screen.getByRole('button', { name: /D Dealer/i });
    fireEvent.click(menuButton);
    
    expect(screen.getByRole('link', { name: /dealer portal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /post unit/i })).toBeInTheDocument();
  });
});
