import QueryString from "qs";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
const REVALIDATION_TIME = 3600; // 1 hour

// Reusable fetch options
const FETCH_OPTIONS = {
  next: { revalidate: REVALIDATION_TIME },
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

  console.log("fetching from :: ", url);

  const response = await fetch(url, FETCH_OPTIONS);

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
    throw new Error(`Something went wrong: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
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

  console.log("fetching with token from :: ", url);

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
    throw new Error(`Something went wrong: ${response.status}`);
  }
  const data = await response.json();
  return data;
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

  console.log(
    "posting to :: ",
    url,
    "with body ::",
    body,
    "and headers ::",
    mergedHeaders
  );

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
    throw new Error(`Something went wrong: ${response.status}`);
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
    throw new Error("No authentication token found. Please log in.");
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

  console.log(
    "posting with token to :: ",
    url,
    "with body ::",
    body,
    "and headers ::",
    mergedHeaders
  );

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
    throw new Error(`Something went wrong: ${response.status}`);
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
    throw new Error("No authentication token found. Please log in.");
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

  console.log(
    "updating to :: ",
    url,
    "with body ::",
    body,
    "and headers ::",
    mergedHeaders
  );

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
    throw new Error(`Something went wrong: ${response.status}`);
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
    throw new Error("No authentication token found. Please log in.");
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

  console.log(
    "deleting from :: ",
    url,
    "with headers ::",
    mergedHeaders
  );

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

  console.log("response status::", response.status)

  // Check for unexpected response statuses
  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Something went wrong: ${response.status}`);
  }
}
