import { CodeOutlined, FolderOutlined } from "@ant-design/icons/lib";

export function RightSidebar() {
  return (
    <div className="right-sidebar">
      <button className="active">
        <FolderOutlined />
      </button>
      <button>
        <CodeOutlined />
      </button>
    </div>
  );
}
