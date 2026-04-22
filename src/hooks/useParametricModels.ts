import { useQuery } from '@tanstack/react-query';
import { ModelConfig } from '@/types/misc';

const LLM_API_URL = import.meta.env.VITE_LLM_API_URL as string;
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY as string;

interface RemoteModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

function toModelConfig(m: RemoteModel): ModelConfig {
  return {
    id: m.id,
    name: m.id,
    description: m.owned_by,
    supportsTools: true,
    supportsVision: true,
    provider: m.owned_by,
  };
}

async function fetchModels(): Promise<ModelConfig[]> {
  const res = await fetch(`${LLM_API_URL}/models`, {
    headers: { Authorization: `Bearer ${LLM_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  const data: { data: RemoteModel[] } = await res.json();
  return data.data.map(toModelConfig);
}

export function useParametricModels() {
  return useQuery({
    queryKey: ['parametric-models'],
    queryFn: fetchModels,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
