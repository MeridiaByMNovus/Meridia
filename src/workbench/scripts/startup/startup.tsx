import { useLayoutEffect } from "react";
import { useAppDispatch } from "../../react-hooks/hooks";
import { set_folder_structure } from "../../react-hooks/state_manager";

export function useAppSetup() {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    window.electron?.get_folder().then((folder) => {
      if (folder) dispatch(set_folder_structure(folder));
    });
  }, []);
}
