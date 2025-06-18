import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

const sampleData = [
  {
    id: 1,
    name: "Alice",
    age: 25,
    city: "New York",
    job: "Engineer",
    salary: 70000,
    department: "IT",
    status: "Active",
  },
  {
    id: 2,
    name: "Bob",
    age: 30,
    city: "Los Angeles",
    job: "Designer",
    salary: 65000,
    department: "Marketing",
    status: "Inactive",
  },
  {
    id: 3,
    name: "Charlie",
    age: 22,
    city: "Chicago",
    job: "Developer",
    salary: 75000,
    department: "IT",
    status: "Active",
  },
  {
    id: 4,
    name: "David",
    age: 28,
    city: "Houston",
    job: "Manager",
    salary: 90000,
    department: "Sales",
    status: "Active",
  },
  {
    id: 5,
    name: "Eve",
    age: 35,
    city: "San Francisco",
    job: "Analyst",
    salary: 80000,
    department: "Finance",
    status: "Inactive",
  },
  {
    id: 6,
    name: "Frank",
    age: 40,
    city: "Seattle",
    job: "HR",
    salary: 60000,
    department: "Human Resources",
    status: "Active",
  },
  {
    id: 7,
    name: "Grace",
    age: 27,
    city: "Boston",
    job: "Product Manager",
    salary: 85000,
    department: "Product",
    status: "Active",
  },
  {
    id: 8,
    name: "Hank",
    age: 32,
    city: "Denver",
    job: "Support Engineer",
    salary: 72000,
    department: "IT",
    status: "Inactive",
  },
  {
    id: 9,
    name: "Ivy",
    age: 29,
    city: "Austin",
    job: "Marketing Lead",
    salary: 88000,
    department: "Marketing",
    status: "Active",
  },
  {
    id: 10,
    name: "Jack",
    age: 31,
    city: "Miami",
    job: "Sales Executive",
    salary: 70000,
    department: "Sales",
    status: "Active",
  },
];

export const Table = ({ data }: any) => {
  console.log("table data", data);
  const dynamicColumns =
    sampleData && sampleData.length > 0
      ? Object.keys(sampleData[0]).map((key) => (
          <Column
            key={key}
            field={key}
            header={key.charAt(0).toUpperCase() + key.slice(1)}
          />
        ))
      : null;

  return (
    <div className="table-container">
      <DataTable
        value={sampleData}
        resizableColumns
        showGridlines
        tableStyle={{ minWidth: "10rem" }}
        width="100%"
        style={{
          overflow: "hidden",
        }}
      >
        {dynamicColumns}
      </DataTable>
    </div>
  );
};
