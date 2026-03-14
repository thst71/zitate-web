import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const modalContent = screen.getByText('Modal content');
    await user.click(modalContent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render custom children', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <button>Custom Button</button>
        <input placeholder="Custom Input" />
      </Modal>
    );

    expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom Input')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });
});
