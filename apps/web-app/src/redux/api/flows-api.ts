import type {
  GetFlowsRes,
  PostFlowFileRes,
  PostJsonFlowReq,
  PostJsonFlowRes,
} from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const flowsApi = createApi({
  reducerPath: "flowsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  endpoints: (builder) => ({
    getFlows: builder.query<GetFlowsRes, void>({
      query: () => "flows",
    }),
    addJsonFlow: builder.mutation<PostJsonFlowRes, PostJsonFlowReq>({
      query: (arg) => ({
        url: "flows",
        method: "POST",
        body: arg.body,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    uploadFlowFile: builder.mutation<PostFlowFileRes, { files: File[] }>({
      query: ({ files }) => {
        const formData = new FormData();
        for (const file of files) formData.append("files", file);
        return {
          url: "flows/files",
          method: "POST",
          body: formData,
          // browser will set headers for us correctly
        };
      },
    }),
  }),
});

export const {
  useAddJsonFlowMutation,
  useUploadFlowFileMutation,
  useGetFlowsQuery,
} = flowsApi;
