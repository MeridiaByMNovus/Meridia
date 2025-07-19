import { CodeOutlined, FolderOutlined } from "@ant-design/icons/lib";

export function RightSidebar() {
  return (
    <div className="panel-sidebar panel-sidebar-right">
      <button className="active">
        <FolderOutlined />
      </button>
      <button>
        <CodeOutlined />
      </button>
    </div>
  );
}
