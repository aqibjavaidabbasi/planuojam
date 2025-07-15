const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export const fetchAPI = async (
    { path, options = {} }: { path: string; options?: RequestInit }
) => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return {message:'data fetched', data: res.json()};
};
