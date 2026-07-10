import {createRoot} from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/index.css";

import{
connectSocket
}from"./app/services/socketService";

connectSocket();

createRoot(
document.getElementById("root")
).render(
<App/>
);