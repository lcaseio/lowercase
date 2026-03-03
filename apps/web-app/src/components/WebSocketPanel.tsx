import { wsConnect, wsDisconnect } from "../redux/middleware/ws";
import { useAppDispatch, useAppSelector } from "../redux/typed-hooks";

export function WebSocketPanel() {
  const status = useAppSelector((state) => state.ws.status);
  const dispatch = useAppDispatch();

  let btnText = "";
  if (status === "closed" || status === "error") btnText = "Connect";
  if (status === "open") btnText = "Disconnect";
  if (status === "connecting") btnText = "Connecting...";

  const handleConnection = () => {
    if (status === "closed" || status === "error") {
      dispatch(wsConnect({ url: "ws://localhost:3000/ws" }));
    } else if (status === "open") {
      dispatch(wsDisconnect());
    }
  };

  return (
    <div>
      <h3>Web Socket Panel</h3>
      <p>Status: {status}</p>
      <button onClick={handleConnection} disabled={status === "connecting"}>
        {btnText}
      </button>
      <button>Echo "Hello World" Message</button>
    </div>
  );
}
