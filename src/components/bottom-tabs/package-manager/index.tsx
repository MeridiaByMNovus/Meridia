import { SearchOutlined } from "@ant-design/icons";
import { Splitter } from "antd/es";
import "./index.css";

const packages = [
  { name: "Django", version: "4.2.4 → 5.0a1" },
  { name: "Markdown", version: "3.4.3 → 3.5" },
  { name: "asgiref", version: "3.6.0 → 3.7.2" },
  { name: "bleach", version: "6.0.0 → 6.1.0" },
  { name: "django-crispy", version: "6.5.1 → 6.7.0" },
  { name: "django-filter", version: "2.0.0 → 2.1.0" },
  { name: "pip", version: "22.3.1 → 23.2.1" },
];

export const PackageManager = () => {
  return (
    <div className="package-manager">
      <Splitter
        style={{
          height: "100%",
          width: "100vw",
          justifyContent: "space-between",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Splitter.Panel defaultSize="40%" min="20%" max="70%">
          <div className="part-section">
            <div className=" header">
              <p>PYTHON PACKAGES</p>
              <div className="search-input">
                <SearchOutlined />
                <input type="search" placeholder="Search packages..." />
              </div>
            </div>
            <div className="installed-section">
              <ul>
                {packages.map((pkg) => (
                  <li key={pkg.name}>
                    <span>{pkg.name}</span>
                    <span className="version">{pkg.version}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="part-section">
            <div className="package-details">
              <h2>Django</h2>
              <p>
                Django is a high-level Python web framework that encourages
                rapid development and clean, pragmatic design.
              </p>
              <a
                href="https://docs.djangoproject.com/en/stable/"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://docs.djangoproject.com/en/stable/
              </a>
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};
