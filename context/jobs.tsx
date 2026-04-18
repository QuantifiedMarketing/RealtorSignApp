import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  completedAt?: Date;
  photoUri?: string;
}

export interface NewJobInput {
  address: string;
  preferredDate: Date;
  notes: string;
  pinCoords: { latitude: number; longitude: number } | null;
}

interface JobsContextType {
  jobs: Job[];
  isLoadingJobs: boolean;
  submitJob: (input: NewJobInput, agentId: string, agentName: string) => Promise<Job>;
  getJobsByAgent: (agentId: string) => Job[];
  updateStatus: (jobId: string, status: JobStatus) => Promise<void>;
  setJobPhoto: (jobId: string, photoUri: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

function rowToJob(row: Record<string, any>): Job {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentName: row.agent_name,
    address: row.address,
    // preferred_date is a date string (YYYY-MM-DD); append time to avoid UTC shift
    preferredDate: new Date(row.preferred_date + 'T12:00:00'),
    notes: row.notes ?? '',
    pinCoords:
      row.pin_lat != null && row.pin_lng != null
        ? { latitude: row.pin_lat, longitude: row.pin_lng }
        : null,
    status: row.status,
    submittedAt: new Date(row.submitted_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    photoUri: row.photo_uri ?? undefined,
  };
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (!error && data) {
      setJobs(data.map(rowToJob));
    }
    setIsLoadingJobs(false);
  };

  useEffect(() => {
    loadJobs();

    // Real-time subscription — refetch on any jobs table change
    const channel = supabase
      .channel('jobs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        () => loadJobs(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const submitJob = async (
    input: NewJobInput,
    agentId: string,
    agentName: string,
  ): Promise<Job> => {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        agent_id: agentId,
        agent_name: agentName,
        address: input.address,
        pin_lat: input.pinCoords?.latitude ?? null,
        pin_lng: input.pinCoords?.longitude ?? null,
        preferred_date: input.preferredDate.toISOString().split('T')[0],
        notes: input.notes,
        status: 'pending',
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? 'Failed to submit job');
    const job = rowToJob(data);
    setJobs(prev => [job, ...prev]);
    return job;
  };

  const getJobsByAgent = (agentId: string) =>
    jobs.filter(j => j.agentId === agentId);

  const updateStatus = async (jobId: string, status: JobStatus) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from('jobs').update(patch).eq('id', jobId);
    if (!error) {
      setJobs(prev =>
        prev.map(j => (j.id === jobId ? { ...j, status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } : j)),
      );
    }
  };

  const setJobPhoto = async (jobId: string, photoUri: string) => {
    const { error } = await supabase.from('jobs').update({ photo_uri: photoUri }).eq('id', jobId);
    if (!error) {
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, photoUri } : j)));
    }
  };

  return (
    <JobsContext.Provider
      value={{ jobs, isLoadingJobs, submitJob, getJobsByAgent, updateStatus, setJobPhoto, refreshJobs: loadJobs }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
