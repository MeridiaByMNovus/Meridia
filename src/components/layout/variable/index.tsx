import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  createTableColumn,
} from "@fluentui/react-components";
import { CloseOutlined } from "@ant-design/icons/lib";
import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import PerfectScrollbar from "react-perfect-scrollbar";
import Tooltip from "../../../../support/ui-kit/tooltip/Tooltip";
import { update_right_panel_active } from "../../../helpers/state-manager";
import "./style.css";

export const VariableSection = () => {
  const vars = useAppSelector((state) => state.main.env_vars);
  const dispatch = useAppDispatch();

  // Convert vars object to an array for the table
  const items = Object.entries(vars).map(([key, data]: any) => ({
    name: key,
    type: data.type,
    value: data.value,
  }));

  const columns = [
    createTableColumn({
      columnId: "name",
      renderHeaderCell: () => <>Name</>,
      renderCell: (item: any) => <TableCell>{item.name}</TableCell>,
    }),
    createTableColumn({
      columnId: "type",
      renderHeaderCell: () => <>Type</>,
      renderCell: (item: any) => <TableCell>{item.type}</TableCell>,
    }),
    createTableColumn({
      columnId: "value",
      renderHeaderCell: () => <>Value</>,
      renderCell: (item: any) => <TableCell>{item.value}</TableCell>,
    }),
  ];

  return (
    <div className="variable-wrapper">
      <div className="title">
        <p className="variable-title">VARIABLES</p>
        <Tooltip text="Hide" position="left">
          <button onClick={() => dispatch(update_right_panel_active(false))}>
            <CloseOutlined />
          </button>
        </Tooltip>
      </div>

      <div className="table-container">
        <PerfectScrollbar>
          <Table className="styled-table">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHeaderCell
                    key={column.columnId}
                    className="table-header"
                  >
                    {column.renderHeaderCell()}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow
                  key={item.name}
                  className={
                    index % 2 === 0 ? "table-row even" : "table-row odd"
                  }
                >
                  {columns.map((column) => (
                    <TableCell key={column.columnId} className="table-cell">
                      {column.renderCell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PerfectScrollbar>
      </div>
    </div>
  );
};
