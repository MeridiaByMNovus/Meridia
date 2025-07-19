export async function applyTheme(path: string) {
  const root = document.documentElement;

  const response = await fetch(path);
  const theme = await response.json();

  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value as string);
  }
}
