import type {
  GetEvalsReq,
  GetEvalsRes,
  PostEvalsReq,
  PostEvalsRes,
} from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const evalsApi = createApi({
  reducerPath: "evalsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    requestEval: builder.mutation<PostEvalsRes, PostEvalsReq>({
      query: (arg) => ({
        url: "evals",
        method: "POST",
        body: arg,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    listEvalsByTargetShape: builder.query<
      GetEvalsRes,
      { flowId: string; stepId: string; exportName: string }
    >({
      query: (arg) => ({
        url: "evals",
        method: "GET",
        params: arg satisfies GetEvalsReq,
      }),
    }),
    listEvalsByExperimentId: builder.query<GetEvalsRes, { experimentId: string }>(
      {
        query: (arg) => ({
          url: "evals",
          method: "GET",
          params: arg satisfies GetEvalsReq,
        }),
      },
    ),
  }),
});

export const {
  useRequestEvalMutation,
  useListEvalsByTargetShapeQuery,
  useListEvalsByExperimentIdQuery,
} = evalsApi;
