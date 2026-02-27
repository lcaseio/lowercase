import {
  RunDetailsControllerContext,
  type RunDetailsController,
} from "./use-run-details-controller";

export function RunDetailsControllerProvider({
  value,
  children,
}: {
  value: RunDetailsController;
  children: React.ReactNode;
}) {
  return (
    <RunDetailsControllerContext.Provider value={value}>
      {children}
    </RunDetailsControllerContext.Provider>
  );
}
