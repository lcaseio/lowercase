import { useEffect } from "react";
import { useAppDispatch } from "./redux/typed-hooks";
import { wsConnect, wsDisconnect } from "./redux/middleware/ws";

export function WsBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      wsConnect({
        url: "ws://localhost:3000/ws",
      }),
    );
    return () => {
      dispatch(wsDisconnect());
    };
  }, [dispatch]);

  return null;
}
