import { useMemo, useState } from "react";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { ArtifactList } from "@/components/artifacts/ArtifactList";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";
import { AddArtifact } from "@/components/artifacts/AddArtifact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Artifacts() {
  const { data, isLoading, error } = useListArtifactsQuery();
  const artifacts = useMemo(() => (data?.ok ? data.value : []), [data]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Artifacts</h2>
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List + Viewer</TabsTrigger>
            <TabsTrigger value="create">
              Create + Upload An Artifact
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] mb-5">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold mb-3">Artifact List</h3>
                  {isLoading ? <div>Loading artifacts...</div> : null}
                  {data?.ok === false ? <div>Error: {data.error}</div> : null}
                  {error ? <div>Error loading artifacts</div> : null}
                  {!isLoading && data?.ok && artifacts.length === 0 ? (
                    <div>No indexed artifacts found</div>
                  ) : null}
                  {data?.ok ? (
                    <ArtifactList
                      artifacts={artifacts}
                      selectedHash={selectedHash}
                      onSelect={setSelectedHash}
                    />
                  ) : null}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-3">Artifact Viewer</h3>
                <ArtifactViewer hash={selectedHash} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="create">
            <AddArtifact />
          </TabsContent>
        </Tabs>
      </Main>
    </div>
  );
}
