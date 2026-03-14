/**
 * Layout Component - Main app shell
 */
import { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return <main className="layout">{children}</main>;
}
