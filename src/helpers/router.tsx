import { createHashRouter } from "react-router-dom";
import MainComponent from "../components/utilites/main";
import Folders from "../components/sidebar/folders";

import { Tools } from "../components/tools/index";

export default createHashRouter([
  {
    path: "/main_window",
    element: <MainComponent />,
    errorElement: <MainComponent />,
    children: [
      {
        path: "",
        element: <Folders />,
        index: true,
      },
    ],
  },
  {
    path: "/toolswindow",
    element: <Tools />,
    errorElement: <Tools />,
  },

  {
    path: "/",
    element: <MainComponent />,
  },
]);
