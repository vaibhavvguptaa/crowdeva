"use client";
import React, { useMemo } from 'react';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
  minimal?: boolean; // if true, only show failing requirements
}

const rules = [
  { id: 'len', test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { id: 'upper', test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { id: 'lower', test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { id: 'num', test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { id: 'sym', test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One symbol' }
];

export const passwordMeetsAll = (password: string) => rules.every(r => r.test(password));

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password, className = '', minimal = false }) => {
  const evaluated = useMemo(() => rules.map(r => ({ ...r, ok: r.test(password) })), [password]);
  const visible = minimal ? evaluated.filter(r => !r.ok) : evaluated;
  if (!password) return null;
  return (
    <ul className={`mt-2 space-y-1 text-xs ${className}`} aria-live="polite">
      {visible.map(r => (
        <li key={r.id} className={`flex items-center gap-1 ${r.ok ? 'text-green-600' : 'text-gray-600'}`}>
          <span aria-hidden="true">{r.ok ? '✔' : '•'}</span>
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  );
};
