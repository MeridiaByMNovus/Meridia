export function handle_set_settings(useMainContextIn: any) {
  setTimeout(() => {
    useMainContextIn.handle_set_tab({
      name: "Settings",
      id: "settings",
      icon: "icons/file_type_python.svg",
      component: "Settings",
      props: null,
    });
  }, 0);
}
