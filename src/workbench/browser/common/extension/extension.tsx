import { useState } from "react";
import {
  AppstoreOutlined,
  CloseOutlined,
  FilterOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons/lib";

export function ExtensionComponent({
  extensions,
  onExtensionClick,
}: {
  extensions: {
    id: string;
    name: string;
    path: string;
    description: string;
    author: string;
  }[];
  onExtensionClick: (ext: {
    id: string;
    name: string;
    path: string;
    description: string;
    author: string;
  }) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = extensions.filter((ext) => {
    const t = search.toLowerCase();
    return (
      ext.name.toLowerCase().includes(t) || ext.author.toLowerCase().includes(t)
    );
  });

  return (
    <div className="extension-list">
      <div className="extension-search-bar">
        <input
          type="text"
          placeholder="Search Extensions in ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="search-icons">
          <UnorderedListOutlined />
          {search && <CloseOutlined onClick={() => setSearch("")} />}
          <FilterOutlined />
        </div>
      </div>

      {filtered.map((ext) => (
        <div
          key={ext.id}
          className="extension-item"
          onClick={() =>
            onExtensionClick({
              id: ext.id,
              name: ext.name,
              path: ext.path,
              description: ext.description,
              author: ext.author,
            })
          }
        >
          <div className="extension-icon">
            <AppstoreOutlined />
          </div>
          <div className="extension-info">
            <div className="extension-name">{ext.name}</div>
            <div className="extension-description">{ext.description}</div>
            <div className="extension-author">By {ext.author}</div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="extension-no-results">No extensions found.</div>
      )}
    </div>
  );
}
