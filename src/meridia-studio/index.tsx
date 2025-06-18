/* eslint-disable @typescript-eslint/ban-types */
import { useEffect, useState } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import { ArrowLeftIcon } from "@primer/octicons-react";

import { ReactComponent as ExcelIcon } from "../assets/files/excel.svg";

import "./styles/index.css";

export default function MeridiaStudio() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  function scrollRecent(direction: number) {
    const container = document.querySelector(".recent-variables");
    if (container) {
      const scrollAmount = 22 * 16 + 16;
      container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  }

  const recentVariables = [
    {
      1: [
        {
          name: "Revenue Q1",
          type: "excel",
          path: "C:\\data\\revenue.xlsx",
          sheet: "Q1",
        },
      ],
      2: [
        {
          name: "Expenses Q1",
          type: "excel",
          path: "C:\\data\\expenses.xlsx",
          sheet: "Q1",
        },
      ],
      3: [
        {
          name: "Revenue Q2",
          type: "excel",
          path: "C:\\data\\revenue.xlsx",
          sheet: "Q2",
        },
      ],
      4: [
        {
          name: "Expenses Q2",
          type: "excel",
          path: "C:\\data\\expenses.xlsx",
          sheet: "Q2",
        },
      ],
      5: [
        {
          name: "Customer List",
          type: "excel",
          path: "C:\\data\\customers.xlsx",
          sheet: "Sheet1",
        },
      ],
      6: [
        {
          name: "Marketing",
          type: "excel",
          path: "C:\\data\\marketing.xlsx",
          sheet: "Leads",
        },
      ],
      7: [
        {
          name: "Inventory",
          type: "excel",
          path: "C:\\data\\inventory.xlsx",
          sheet: "Current",
        },
      ],
      8: [
        {
          name: "Sales Q1",
          type: "excel",
          path: "C:\\data\\sales.xlsx",
          sheet: "Q1",
        },
      ],
    },
  ];

  useEffect(() => {
    const backButton = document.querySelector(
      ".back-button"
    ) as HTMLButtonElement | null;

    if (backButton) {
      backButton.classList.add(currentStep === 1 && "disabled");
    }
  }, [currentStep]);

  function nextStep() {
    if (currentStep <= 5) return;
    setCurrentStep((prev: number) => prev + 1);
  }

  function previousStep() {
    if (currentStep === 1) return;
    setCurrentStep((prev: number) => prev - 1);
  }

  const StepsContent: any = {
    1: (
      <div className="studio-content step-1">
        <p className="heading">Meridia Studio</p>
        <p className="recent-text">Recent</p>
        <div className="carousel-controls">
          <button onClick={() => scrollRecent(-1)}>‹</button>
          <button onClick={() => scrollRecent(1)}>›</button>
        </div>

        <div className="recent-variables">
          {Object.values(recentVariables[0])
            .flat()
            .map((variable, index) => (
              <div className="variable" key={index}>
                <p className="name">{variable.name}</p>
                <div className="details">
                  <div className="part">
                    <ExcelIcon />
                  </div>
                  <div className="part">
                    <p className="type">{variable.type}</p>
                    <p className="path">{variable.path}</p>
                    <p className="sheet">{variable.sheet}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    ),
    2: (
      <div>
        <p>Step 2 content</p>
      </div>
    ),
    3: (
      <div>
        <p>Step 3 content</p>
      </div>
    ),
    4: (
      <div>
        <p>Step 4 content</p>
      </div>
    ),
    5: (
      <div>
        <p>Step 5 content</p>
      </div>
    ),
  };

  return (
    <PerfectScrollbar>
      <div className="studio-wrapper">
        <button className="back-button" onClick={previousStep}>
          <ArrowLeftIcon />
        </button>
        {StepsContent[currentStep]}
      </div>
    </PerfectScrollbar>
  );
}
