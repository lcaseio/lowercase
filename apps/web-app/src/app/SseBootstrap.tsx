import { useEffect } from "react";
import { useAppDispatch } from "@/redux/typed-hooks";
import { sseConnect, sseDisconnect } from "@/redux/middleware/sse";

export function SseBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      sseConnect({
        url: "http://localhost:3000/events",
      }),
    );
    return () => {
      dispatch(sseDisconnect());
    };
  }, [dispatch]);

  return null;
}
