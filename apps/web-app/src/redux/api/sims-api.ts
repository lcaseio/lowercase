import {
  type GetSimsRes,
  type GetRunEventsReq,
  type GetRunEventsRes,
  type PostSimsRes,
  type PostSimsReq,
} from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const simsApi = createApi({
  reducerPath: "simsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    postSims: builder.mutation<PostSimsRes, PostSimsReq>({
      query: (arg) => ({
        url: "sims",
        method: "POST",
        body: arg,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    listAllSims: builder.query<GetSimsRes, void>({
      query: () => ({
        url: "sims",
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

export const { useListAllSimsQuery, usePostSimsMutation } = simsApi;
