import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, beforeEach, vi, expect, Mock } from 'vitest';
import WorkflowActivityChart from '../../../src/components/dashboard/charts/workflowActivityChart';
import IssueTrackerChart from '../../../src/components/dashboard/charts/issueTrackerChart';

// Mock the fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Dashboard Chart Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WorkflowActivityChart', () => {
    it('fetches and displays workflow data', async () => {
      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { date: 'Mon', total: 42, completed: 35, inProgress: 7 },
          { date: 'Tue', total: 56, completed: 48, inProgress: 8 },
          { date: 'Wed', total: 78, completed: 65, inProgress: 13 },
        ],
      });

      render(<WorkflowActivityChart projectId="llm-evaluation-gpt4" />);
      
      // Check loading state
      expect(screen.getByText('Current Week')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      });
      
      // Verify data is displayed
      expect(screen.getByText('176')).toBeInTheDocument(); // Total tasks
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      render(<WorkflowActivityChart projectId="llm-evaluation-gpt4" />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });
    });
  });

  describe('IssueTrackerChart', () => {
    it('fetches and displays issue data', async () => {
      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'tm-001', name: 'Alex Johnson', issues: 7 },
          { id: 'tm-002', name: 'Maria Garcia', issues: 3 },
          { id: 'tm-003', name: 'David Kim', issues: 12 },
        ],
      });

      render(<IssueTrackerChart projectId="llm-evaluation-gpt4" />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Issues')).toBeInTheDocument();
      });
      
      // Verify data is displayed (7+3+12 = 22 total issues)
      expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      render(<IssueTrackerChart projectId="llm-evaluation-gpt4" />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument();
      });
    });
  });
});