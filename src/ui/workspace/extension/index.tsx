import React from "react";
import data from "../../../hooks/extensionsData.json";
import { MainContext } from "../../../helpers/functions";
import { ExtensionComponent } from "./extension";

export function Extension() {
  const useMainContextIn = React.useContext(MainContext);

  const handleExtensionClick = (ext: any) => {
    const tabId = `ext-${ext.id}`;

    useMainContextIn.handle_set_tab({
      name: ext.name,
      id: tabId,
      icon: "extension",
      component: "ExtensionPage",
      props: ext,
    });
  };

  return (
    <div className="extension-wrapper">
      <div className="title">Extension</div>
      <div className="extension-scroll">
        <ExtensionComponent
          extensions={data}
          onExtensionClick={handleExtensionClick}
        />
      </div>
    </div>
  );
}
