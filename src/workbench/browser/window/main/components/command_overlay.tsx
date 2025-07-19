import React from "react";
import { Command } from "cmdk";
import { commands } from "../../../../contrib/data/commands";

export function CommandOverlay({
  search,
  setSearch,
  handleCommandSelect,
  setOpen,
}: any) {
  return (
    <div className="overlay" onClick={() => setOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
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
                    {cmd.shortcut.split("+").map((key, index, arr) => (
                      <React.Fragment key={index}>
                        <span className="shortcut-box">{key}</span>
                        {index < arr.length - 1 && (
                          <span className="plus">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
