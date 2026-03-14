import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

describe('Header', () => {
  it('should render app title', () => {
    render(<Header onCreateClick={() => {}} />);

    expect(screen.getByText('Zitate')).toBeInTheDocument();
  });

  it('should render create button', () => {
    render(<Header onCreateClick={() => {}} />);

    const button = screen.getByRole('button', { name: /new entry/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onCreateClick when button is clicked', async () => {
    const user = userEvent.setup();
    const onCreateClick = vi.fn();

    render(<Header onCreateClick={onCreateClick} />);

    const button = screen.getByRole('button', { name: /new entry/i });
    await user.click(button);

    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('should have proper header structure', () => {
    const { container } = render(<Header onCreateClick={() => {}} />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('header');
  });

  it('should render plus icon in button', () => {
    render(<Header onCreateClick={() => {}} />);

    const button = screen.getByRole('button', { name: /new entry/i });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
