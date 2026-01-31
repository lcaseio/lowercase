import type { PostJsonFlowReq, PostJsonFlowRes } from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const flowsApi = createApi({
  reducerPath: "flowsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    addJsonFlow: builder.mutation<PostJsonFlowRes, PostJsonFlowReq>({
      query: (arg) => ({
        url: "flows",
        method: "POST",
        body: arg.body,
      }),
    }),
  }),
});

export const { useAddJsonFlowMutation } = flowsApi;
