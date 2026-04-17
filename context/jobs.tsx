import React, { createContext, ReactNode, useContext, useState } from 'react';

export type JobStatus = 'pending' | 'active' | 'completed' | 'takedown_requested';

export interface Job {
  id: string;
  agentId: string;
  agentName: string;
  address: string;
  preferredDate: Date;
  notes: string;
  pinCoords: { latitude: number; longitude: number } | null;
  status: JobStatus;
  submittedAt: Date;
}

export interface NewJobInput {
  address: string;
  preferredDate: Date;
  notes: string;
  pinCoords: { latitude: number; longitude: number } | null;
}

interface JobsContextType {
  jobs: Job[];
  submitJob: (input: NewJobInput, agentId: string, agentName: string) => Job;
  getJobsByAgent: (agentId: string) => Job[];
  updateStatus: (jobId: string, status: JobStatus) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);

  const submitJob = (input: NewJobInput, agentId: string, agentName: string): Job => {
    const job: Job = {
      id: `job_${Date.now()}`,
      agentId,
      agentName,
      address: input.address,
      preferredDate: input.preferredDate,
      notes: input.notes,
      pinCoords: input.pinCoords,
      status: 'pending',
      submittedAt: new Date(),
    };
    setJobs(prev => [job, ...prev]);
    return job;
  };

  const getJobsByAgent = (agentId: string) =>
    jobs.filter(j => j.agentId === agentId);

  const updateStatus = (jobId: string, status: JobStatus) =>
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status } : j)));

  return (
    <JobsContext.Provider value={{ jobs, submitJob, getJobsByAgent, updateStatus }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
