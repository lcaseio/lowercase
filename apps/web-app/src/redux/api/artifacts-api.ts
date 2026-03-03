import type { GetArtifactReq, GetArtifactRes } from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const artifactsApi = createApi({
  reducerPath: "artifactsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    getArtifact: builder.query<GetArtifactRes, GetArtifactReq>({
      query: (args) => ({
        url: `artifacts/${args.hash}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetArtifactQuery } = artifactsApi;
