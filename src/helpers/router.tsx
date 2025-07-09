import { createHashRouter } from "react-router-dom";
import MainComponent from "../main";

export default createHashRouter([
  {
    path: "/main_window",
    element: <MainComponent />,
    errorElement: <MainComponent />,
  },
  {
    path: "/",
    element: <MainComponent />,
  },
]);
