import Logo from "../../../../assets/logo.png";

interface SidebarProps {
  activeTab: string;
  setActiveTab: any;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const sidebar_data = ["Projects", "Plugins", "Settings"];
  return (
    <div className="sidebar">
      <div className="tree">
        <div className="version">
          <div className="part">
            <img src={Logo} alt="logo" />
          </div>
          <div className="part">
            <div className="title">Meridia</div>
            <div className="version">2025.1.1</div>
          </div>
        </div>
        {sidebar_data.map((item) => (
          <div
            className={`tree-item  ${activeTab === item.toLowerCase() && "tree-item-active"}`}
            key={item}
            onClick={() => setActiveTab(item.toLowerCase())}
            id="projects"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
