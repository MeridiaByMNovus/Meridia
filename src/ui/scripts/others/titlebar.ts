export const MaximizeSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="#D1D1D1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export const RestoreSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M19,3 C20.0543909,3 20.9181678,3.81587733 20.9945144,4.85073759 L21,5 L21,15 C21,16.0543909 20.18415,16.9181678 19.1492661,16.9945144 L19,17 L17,17 L17,19 C17,20.0543909 16.18415,20.9181678 15.1492661,20.9945144 L15,21 L5,21 C3.94563773,21 3.08183483,20.18415 3.00548573,19.1492661 L3,19 L3,9 C3,7.94563773 3.81587733,7.08183483 4.85073759,7.00548573 L5,7 L7,7 L7,5 C7,3.94563773 7.81587733,3.08183483 8.85073759,3.00548573 L9,3 L19,3 Z M15,9 L5,9 L5,19 L15,19 L15,9 Z M19,5 L9,5 L9,7 L15,7 L15.1492661,7.00548573 C16.1324058,7.07801738 16.9178674,7.86122607 16.9939557,8.84334947 L17,9 L17,15 L19,15 L19,5 Z" fill="#d1d1d1"/>
</svg>
`;

export async function titlebar({ main }: { main: boolean }) {
  const menuItems = await window.electron.getMenu();
  const menuDiv: HTMLDivElement | null = document.querySelector(".menu");

  function handleMenuClick(menuId: string) {
    window.electron.ipcRenderer.send("menu-click", menuId);
  }

  if (menuDiv) {
    menuItems.forEach((item: any, index: number) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "menu-item";

      const itemTextDiv = document.createElement("div");
      itemTextDiv.className = "menu-item-text";
      itemTextDiv.innerText = item.label;

      const shortcutSpan = document.createElement("span");
      shortcutSpan.className = "shortcut";
      if (item.accelerator) {
        shortcutSpan.innerText = item.accelerator;
      }

      itemTextDiv.appendChild(shortcutSpan);
      itemDiv.appendChild(itemTextDiv);

      const submenuDiv = document.createElement("div");
      submenuDiv.className = "submenu";
      submenuDiv.style.display = "none";

      if (item.submenu) {
        item.submenu.forEach((sub: any) => {
          const submenuItem = document.createElement("div");
          submenuItem.className =
            sub.label === "" ? "separator" : "submenu-item";
          submenuItem.innerText = sub.label;

          const subShortcut = document.createElement("span");
          subShortcut.className = "shortcut";
          if (sub.accelerator) {
            subShortcut.innerText = sub.accelerator;
          }

          submenuItem.appendChild(subShortcut);
          submenuItem.onclick = (e) => {
            e.stopPropagation();
            handleMenuClick(sub.id);
            submenuDiv.style.display = "none";
          };

          submenuDiv.appendChild(submenuItem);
        });

        itemDiv.appendChild(submenuDiv);
      }

      itemDiv.onclick = () => {
        handleMenuClick(item.id);
      };

      itemDiv.onmouseenter = () => {
        const allSubmenus = document.querySelectorAll(
          ".submenu"
        ) as NodeListOf<HTMLDivElement>;
        allSubmenus.forEach((el) => (el.style.display = "none"));

        if (item.submenu) {
          submenuDiv.style.display = "block";
        }
      };

      menuDiv.appendChild(itemDiv);
    });

    menuDiv.onmouseleave = () => {
      const allSubmenus = document.querySelectorAll(
        ".submenu"
      ) as NodeListOf<HTMLDivElement>;
      allSubmenus.forEach((el) => (el.style.display = "none"));
    };
  }

  const minimizeBtn = document.querySelector(
    ".window-controls .button-minimize"
  );
  const maximizeBtn = document.querySelector(
    ".window-controls .button-restore-maximize"
  );
  const closeBtn = document.querySelector(".window-controls .button-close");

  const toggleMaxRestoreIcon = (isMaximized: boolean) => {
    if (!maximizeBtn) return;
    maximizeBtn.innerHTML = "";
    const icon = document.createElement("div");
    icon.className = "window-icon";
    icon.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "svg")
    );
    maximizeBtn.innerHTML = isMaximized ? RestoreSVG : MaximizeSVG;
  };

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      window.electron.ipcRenderer.invoke("minimize", `${main && "main"}`);
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", async () => {
      const isMaximized = await window.electron.ipcRenderer.invoke(
        "isMaximized",
        `${main && "main"}`
      );
      if (isMaximized) {
        window.electron.ipcRenderer.invoke("restore", `${main && "main"}`);
        toggleMaxRestoreIcon(false);
      } else {
        window.electron.ipcRenderer.invoke("maximize", `${main && "main"}`);
        toggleMaxRestoreIcon(true);
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.electron.ipcRenderer.invoke("close", `${main && "main"}`);
    });
  }

  window.electron.ipcRenderer.on("window-changed-to-maximized", () => {
    toggleMaxRestoreIcon(true);
  });

  window.electron.ipcRenderer.on("window-changed-to-restore", () => {
    toggleMaxRestoreIcon(false);
  });
}
