import type {
  GetArtifactReq,
  GetArtifactRes,
  GetArtifactsReq,
  GetArtifactsRes,
  PostArtifactFileRes,
  PostJsonArtifactReq,
  PostJsonArtifactRes,
} from "@lcase/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const artifactsApi = createApi({
  reducerPath: "artifactsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/" }),
  tagTypes: ["Artifacts"],
  endpoints: (builder) => ({
    listArtifacts: builder.query<GetArtifactsRes, GetArtifactsReq | void>({
      query: (args) => ({
        url: "artifacts",
        method: "GET",
        params: args
          ? {
              ...(args.flowId ? { flowId: args.flowId } : {}),
              ...(args.flowVersionId
                ? { flowVersionId: args.flowVersionId }
                : {}),
              ...(args.curated ? { curated: args.curated } : {}),
            }
          : undefined,
      }),
      providesTags: ["Artifacts"],
    }),
    getArtifact: builder.query<GetArtifactRes, GetArtifactReq>({
      query: (args) => ({
        url: `artifacts/${args.hash}`,
        method: "GET",
      }),
    }),
    addJsonArtifact: builder.mutation<PostJsonArtifactRes, PostJsonArtifactReq>(
      {
        query: (arg) => ({
          url: "artifacts/json",
          method: "POST",
          body: arg,
          headers: { "Content-Type": "application/json" },
        }),
        invalidatesTags: ["Artifacts"],
      },
    ),
    uploadArtifactFile: builder.mutation<
      PostArtifactFileRes,
      { file: File; label?: string }
    >({
      query: ({ file, label }) => {
        const formData = new FormData();
        formData.append("file", file);
        if (label) formData.append("label", label);
        return {
          url: "artifacts/files",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Artifacts"],
    }),
  }),
});

export const {
  useListArtifactsQuery,
  useGetArtifactQuery,
  useLazyGetArtifactQuery,
  useAddJsonArtifactMutation,
  useUploadArtifactFileMutation,
} = artifactsApi;
