import { FolderOutlined, PlusOutlined } from "@ant-design/icons/lib";

export function Projects({ setActiveTab }: any) {
  return (
    <div className="projects-wrapper">
      <div className="heading">Welcome to Meridia</div>
      <div className="detail">Create a new project from stratch.</div>
      <div className="buttons">
        <button onClick={() => setActiveTab("new-project")}>
          <span className="icon">
            <PlusOutlined color="var(--blue-color)" />
          </span>
          <span className="title">New Project</span>
        </button>
        <button onClick={() => window.electron.open_set_folder()}>
          <span className="icon">
            <FolderOutlined color="var(--blue-color)" />
          </span>
          <span className="title">Open</span>
        </button>
      </div>
    </div>
  );
}
