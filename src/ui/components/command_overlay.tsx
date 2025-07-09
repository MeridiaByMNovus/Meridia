import React from "react";
import { Command } from "cmdk";
import { commands } from "../shell/commands";

export function CommandOverlay({
  search,
  setSearch,
  handleCommandSelect,
  setOpen,
}: any) {
  return (
    <Command>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command..."
        className="command-input"
        autoFocus
      />
      <Command.List>
        {commands
          .filter((cmd) =>
            cmd.label.toLowerCase().includes(search.toLowerCase())
          )
          .map((cmd) => (
            <Command.Item
              key={cmd.id}
              onSelect={() => {
                handleCommandSelect(cmd.id);
                setOpen(false);
              }}
              className="command-item"
            >
              <span>{cmd.label}</span>
              <div className="shortcut-container">
                {cmd.shortcut.map((key, index) => (
                  <React.Fragment key={index}>
                    <span className="shortcut-box">{key}</span>
                    {index < cmd.shortcut.length - 1 && (
                      <span className="plus">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </Command.Item>
          ))}
      </Command.List>
    </Command>
  );
}
