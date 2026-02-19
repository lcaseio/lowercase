import type {
  GetRunEventsReq,
  GetRunEventsRes,
  GetRunsRes,
  PostRunsReq,
  PostRunsRes,
} from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const runsApi = createApi({
  reducerPath: "runsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    requestRun: builder.mutation<PostRunsRes, PostRunsReq>({
      query: (arg) => ({
        url: "runs",
        method: "POST",
        body: arg,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    listAllRuns: builder.query<GetRunsRes, void>({
      query: () => ({
        url: "runs",
        method: "GET",
      }),
    }),

    getAllRunEvents: builder.query<GetRunEventsRes, GetRunEventsReq>({
      query: (args: GetRunEventsReq) => ({
        url: `runs/details?runId=${args.runId}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useRequestRunMutation,
  useListAllRunsQuery,
  useGetAllRunEventsQuery,
} = runsApi;
