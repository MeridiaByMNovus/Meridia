import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../helpers/store";
import { Explorer } from "../workspace/explorer";
import { Extension } from "../workspace/extension";
import { Terminal } from "../workspace/terminal";
import { Console } from "../workspace/console";

export function main() {
  const default_top_tab = "explorer";
  const default_bottom_tab = "terminal";

  const top_container = document.querySelector(".top-active-tabs");
  const bottom_container = document.querySelector(".bottom-active-tabs");
  if (!top_container || !bottom_container) return;

  const TopTabs = () => (
    <div style={{ height: "100%" }}>
      <div id="tab-explorer" style={{ display: "block", height: "100%" }}>
        <Explorer />
      </div>
      <div id="tab-extension" style={{ display: "none", height: "100%" }}>
        <Extension />
      </div>
    </div>
  );

  const BottomTabs = () => (
    <div className="scroll-wrapper" style={{ height: "100%" }}>
      <div id="tab-terminal" style={{ display: "block", height: "100%" }}>
        <Terminal />
      </div>
      <div id="tab-console" style={{ display: "none", height: "100%" }}>
        <Console />
      </div>
    </div>
  );

  createRoot(top_container).render(
    <Provider store={store}>
      <TopTabs />
    </Provider>
  );
  createRoot(bottom_container).render(
    <Provider store={store}>
      <BottomTabs />
    </Provider>
  );

  document.querySelectorAll(".sidebar-set-button").forEach((btn) => {
    const parent = btn.closest(".top, .bottom");
    if (!parent) return;

    const isTop = parent.classList.contains("top");
    const tabType = isTop ? "top" : "bottom";
    const id = btn.id;

    if (
      (isTop && id === default_top_tab) ||
      (!isTop && id === default_bottom_tab)
    ) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      const tabSelector = `.${tabType}-active-tabs [id^='tab-']`;
      const buttonSelector = `.${tabType} .sidebar-set-button`;

      document.querySelectorAll(tabSelector).forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      document.querySelectorAll(buttonSelector).forEach((el) => {
        el.classList.remove("active");
      });

      const target = document.getElementById(`tab-${id}`);
      if (target) {
        target.style.display = "block";
        btn.classList.add("active");
      }
    });
  });
}
