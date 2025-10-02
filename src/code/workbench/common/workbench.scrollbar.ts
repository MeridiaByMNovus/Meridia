import PerfectScrollbar from "perfect-scrollbar";

const _scrollbarEl = document.querySelectorAll(".scrollbar-container");
const _scrollbars: PerfectScrollbar[] = [];

_scrollbarEl.forEach((_el) => {
  const yDisable = _el.classList.contains("y-disable");
  const xDisable = _el.classList.contains("x-disable");

  const _scrollbar = new PerfectScrollbar(_el, {
    suppressScrollX: xDisable,
    suppressScrollY: yDisable,
    useBothWheelAxes: true,
    wheelPropagation: false,
  });

  _scrollbars.push(_scrollbar);

  let updateTimeout: NodeJS.Timeout;
  const debouncedUpdate = () => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      _scrollbar.update();
    }, 16);
  };

  const mutationObserver = new MutationObserver((mutations) => {
    const hasRelevantChanges = mutations.some(
      (mutation) =>
        mutation.type === "childList" ||
        (mutation.type === "attributes" &&
          mutation.attributeName === "style" &&
          ((mutation.target as HTMLElement).style.height !== undefined ||
            (mutation.target as HTMLElement).style.width !== undefined))
    );

    if (hasRelevantChanges) {
      debouncedUpdate();
    }
  });

  mutationObserver.observe(_el, {
    childList: false,
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
    attributeOldValue: false,
  });
});
