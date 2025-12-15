import QueryString from "qs";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
const REVALIDATION_TIME = 3600; // 1 hour

// Reusable fetch options with increased timeout
const FETCH_OPTIONS = {
  next: { revalidate: REVALIDATION_TIME },
  // Add signal timeout to prevent hanging requests
  signal: AbortSignal.timeout(30000), // 30 second timeout per request
} as const;

/**
 * Build query string for Strapi populate and filters
 */
export function createQuery(
  populate: object,
  additionalParams: object = {}
): string {
  return QueryString.stringify(
    {
      populate,
      ...additionalParams,
    },
    { encodeValuesOnly: true }
  );
}

/**
 * Fetch from Strapi API
 */
export async function fetchAPI(
  endpoint: string,
  query: string,
  filters?: Record<string, unknown>
) {
  // This function intentionally does NOT handle tokens to avoid breaking existing usages.
  // If you need token support, use the new fetchAPIWithToken function below.
  const url = filters
    ? `${API_URL}/api/${endpoint}?${query}&${QueryString.stringify(filters, {
        encodeValuesOnly: true,
      })}`
    : `${API_URL}/api/${endpoint}?${query}`;

  // console.log("fetching from :: ", url);

  const response = await fetch(url, FETCH_OPTIONS);

  if (!response.ok) {
    console.log(url)
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message || `Strapi API error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200) {
    throw new Error('Errors.Api.generic');
  }

  
  const data = await response.json();
  return data.data || data;
}

export async function fetchAPIWithMeta(
  endpoint: string,
  query: string,
  filters?: Record<string, unknown>
) {
  const url = filters
    ? `${API_URL}/api/${endpoint}?${query}&${QueryString.stringify(filters, {
        encodeValuesOnly: true,
      })}`
    : `${API_URL}/api/${endpoint}?${query}`;

  const response = await fetch(url, FETCH_OPTIONS);

  if (!response.ok) {
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message || `Strapi API error! status: ${response.status}`
    );
  }

  if (response.status !== 200) {
    throw new Error('Errors.Api.generic');
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch from Strapi API with Authorization token
 * Usage: fetchAPIWithToken(endpoint, query, filters, token)
 */
export async function fetchAPIWithToken(
  endpoint: string,
  query: string,
  filters: Record<string, unknown> = {},
  token: string
) {
  const url = Object.keys(filters).length
    ? `${API_URL}/api/${endpoint}?${query}&${QueryString.stringify(filters, {
        encodeValuesOnly: true,
      })}`
    : `${API_URL}/api/${endpoint}?${query}`;

  // console.log("fetching with token from :: ", url);

  const fetchOptions: RequestInit = {
    ...FETCH_OPTIONS,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message || `Strapi API error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200) {
    throw new Error('Errors.Api.generic');
  }
  const data = await response.json();
  return data;
}

// Upload multiple files with JWT token to Strapi Upload plugin
// Returns the array of uploaded file objects from Strapi
export async function uploadFilesWithToken(files: File[]) {
  // Try to get the token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error('Errors.Auth.noToken');
  }

  const url = `${API_URL}/api/upload`;
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.warn("DEBUG LOGGG::: upload error", errorData);
    throw new Error(errorData?.error?.message || `Upload failed with status ${response.status}`);
  }

  // 200 or 201 typically
  const data = await response.json();
  // Strapi returns an array of file objects
  return Array.isArray(data) ? data : [data];
}

// POST API function
// To send auth headers, pass them in the `options.headers` object when calling postAPI.
// For example: postAPI('some-endpoint', data, { headers: { Authorization: `Bearer ${token}` } })
export async function postAPI(
  endpoint: string,
  body: Record<string, unknown>,
  options: RequestInit = {}
) {
  const url = `${API_URL}/api/${endpoint}`;
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: mergedHeaders,
    body: JSON.stringify(body),
    ...options,
  };

  // Ensure headers are not overwritten by ...options
  fetchOptions.headers = mergedHeaders;

  // console.log(
  //   "posting to :: ",
  //   url,
  //   "with body ::",
  //   body,
  //   "and headers ::",
  //   mergedHeaders
  // );

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
        `Strapi API POST error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Errors.Api.generic');
  }
  const data = await response.json();
  return data;
}

// POST API function with JWT token in headers
// Always fetch the token inside this function. If not found, throw an error.
export async function postAPIWithToken(
  endpoint: string,
  body: Record<string, unknown>,
  options: RequestInit = {},
  query?: string,
) {
  // Try to get the token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error('Errors.Auth.noToken');
  }

  const url = `${API_URL}/api/${endpoint}${query ? `?${query}` : ''}`;
  const mergedHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: mergedHeaders,
    body: JSON.stringify(body),
    ...options,
  };

  // Ensure headers are not overwritten by ...options
  fetchOptions.headers = mergedHeaders;

  // console.log(
  //   "posting with token to :: ",
  //   url,
  //   "with body ::",
  //   body,
  //   "and headers ::",
  //   mergedHeaders
  // );

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
        `Strapi API POST error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Errors.Api.generic');
  }
  const data = await response.json();
  return data;
}

// PUT API function
// Always fetch the token inside this function. If not found, throw an error.
export async function putAPI(
  endpoint: string,
  body: Record<string, unknown>,
  options: RequestInit = {},
  query?: string,
) {
  // Try to get the token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error('Errors.Auth.noToken');
  }

  const url = `${API_URL}/api/${endpoint}${query ? `?${query}` : ''}`;
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions: RequestInit = {
    method: "PUT",
    headers: mergedHeaders,
    body: JSON.stringify(body),
    ...options,
  };

  // Ensure headers are not overwritten by ...options
  fetchOptions.headers = mergedHeaders;

  // console.log(
  //   "updating to :: ",
  //   url,
  //   "with body ::",
  //   body,
  //   "and headers ::",
  //   mergedHeaders
  // );

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
        `Strapi API PUT error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Errors.Api.generic');
  }
  const data = await response.json();
  return data;
}


// DELETE API function
// Always fetch the token inside this function. If not found, throw an error.
export async function deleteAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  // Try to get the token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    throw new Error('Errors.Auth.noToken');
  }

  const url = `${API_URL}/api/${endpoint}`;
  const mergedHeaders = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions: RequestInit = {
    method: "DELETE",
    headers: mergedHeaders,
    ...options,
  };

  // Ensure headers are not overwritten by ...options
  fetchOptions.headers = mergedHeaders;

  // console.log(
  //   "deleting from :: ",
  //   url,
  //   "with headers ::",
  //   mergedHeaders
  // );

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    // Handle errors (e.g., 400, 401, 500, etc.)
    const errorData = await response.json();
    console.warn("DEBUG LOGGG:::", errorData);
    throw new Error(
      errorData.error?.message ||
        `Strapi API DELETE error! status: ${response.status}`
    );
  }

  // Check for unexpected response statuses
  if (response.status !== 200 && response.status !== 204) {
    throw new Error('Errors.Api.generic');
  }
}
