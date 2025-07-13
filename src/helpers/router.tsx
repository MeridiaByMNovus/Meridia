import { createHashRouter } from "react-router-dom";
import MainComponent from "../ui/workspace/main";

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
