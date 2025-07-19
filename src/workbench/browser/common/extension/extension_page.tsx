export function ExtensionPage({
  name,
  author,
  description,
  path,
  icon,
}: {
  name: string;
  author: string;
  description: string;
  path: string;
  icon: string;
}) {
  return (
    <div className="extension-page">
      <div className="info">
        <div className="icon-section">
          <img src="icons/file_type_python.svg" alt={name} />
        </div>
        <div className="details-section">
          <h2 className="title">{name}</h2>
          <div className="meta">
            <span className="author">{author}</span>
          </div>
          <div className="actions">
            <button className="install-btn">Install</button>
          </div>
        </div>
      </div>
      <div className="description-scroll">
        <p>{description}</p>
      </div>
    </div>
  );
}
