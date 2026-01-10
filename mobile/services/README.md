# Services Directory

This directory is responsible for all communication with external services, most notably the backend API. It abstracts away the details of the network requests, making it easier for the rest of the application to interact with the API.

## API Service

The primary service is the `api.ts` file, which is created using **RTK Query**. RTK Query is a powerful data fetching and caching tool that is built on top of Redux Toolkit. It provides a declarative way to define API endpoints and automatically handles caching, re-fetching, and optimistic updates.

## Defining Endpoints

We define our API endpoints by creating an "API slice" using `createApi` from RTK Query. For example:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.contacto.dz/v1' }),
  endpoints: (builder) => ({
    getProfessionals: builder.query({
      query: (params) => ({ url: 'professionals', params }),
    }),
    getProfessionalById: builder.query({
      query: (id) => `professionals/${id}`,
    }),
    // ... other endpoints
  }),
});

export const { useGetProfessionalsQuery, useGetProfessionalByIdQuery } = apiSlice;
```

## Usage in Components

Once the API slice is created, we can use the auto-generated React hooks in our components to fetch data. RTK Query will automatically handle the loading and error states, as well as caching the data.

```typescript
import { useGetProfessionalsQuery } from '../services/api';

function ProfessionalList() {
  const { data: professionals, error, isLoading } = useGetProfessionalsQuery();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // ... render the list of professionals
}
```

By centralizing our API logic in this directory, we create a single source of truth for how the application interacts with the backend, which makes the code more maintainable and easier to test.
