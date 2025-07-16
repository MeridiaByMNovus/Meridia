import { useLayoutEffect } from "react";
import { useAppDispatch } from "../../../helpers/hooks";
import { set_folder_structure } from "../../../helpers/state_manager";

export function useAppSetup() {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    window.electron?.get_folder().then((folder) => {
      if (!localStorage.getItem("mnovus_meridia")) {
        localStorage.setItem("mnovus_meridia", "false");
      }
      if (folder) dispatch(set_folder_structure(folder));
    });
  }, []);
}
