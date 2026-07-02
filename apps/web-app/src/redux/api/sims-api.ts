import {
  type GetSimsRes,
  type PostSimsRes,
  type PostSimsReq,
  type GetSimSpecRes,
  type GetSimSpecReq,
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
    getSim: builder.query<GetSimSpecRes, GetSimSpecReq>({
      query: (arg) => ({
        url: `sims/${arg.simId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useListAllSimsQuery, usePostSimsMutation, useGetSimQuery } =
  simsApi;
