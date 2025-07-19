export function NewProjectFooter({ setActiveTab, onCreate }: any) {
  return (
    <div>
      <span>
        <button onClick={onCreate}>Create</button>
      </span>
      <span>
        <button onClick={() => setActiveTab("projects")}>Cancel</button>
      </span>
    </div>
  );
}
