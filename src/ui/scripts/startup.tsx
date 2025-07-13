import { useLayoutEffect, useContext } from "react";
import { useAppDispatch, useAppSelector } from "../../helpers/hooks";
import { set_folder_structure } from "../../helpers/state_manager";

import { MainContext } from "../../helpers/functions";

export function useAppSetup({ setOpen }: { setOpen: (v: boolean) => void }) {
  const dispatch = useAppDispatch();
  const layout = useAppSelector((state) => state.main.layout);
  const useMainContextIn = useContext(MainContext);

  useLayoutEffect(() => {
    window.electron?.get_folder().then((folder) => {
      if (!localStorage.getItem("mnovus_meridia")) {
        localStorage.setItem("mnovus_meridia", "false");
      }
      if (folder) dispatch(set_folder_structure(folder));
    });
  }, []);
}
