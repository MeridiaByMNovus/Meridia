# Meridia IDE

Meridia is a modern, extensible, and lightweight Integrated Development Environment (IDE) designed to streamline your development workflow. Built with Electron, Vite, and TypeScript, Meridia is **especially made for Python workflows**—providing advanced tools for Python development, data science, and analytics. Meridia aims to provide a fast, customizable, and user-friendly experience for developers working across multiple languages and platforms.

## Studio: The Data Center

Meridia features a powerful data center called **Studio**, designed for data analytics, simulation, and more:

- **Data Analytics**: Import, analyze, and visualize datasets directly within the IDE.
- **Simulations**: Run simulations based on your data, supporting scientific and engineering workflows.
- **Automation**: Automate repetitive data tasks and workflows.
- **Extensible**: Studio is built to support future modules for machine learning, reporting, and more.

Studio makes Meridia an excellent choice for data scientists, analysts, and engineers who need more than just code editing.

## Features

- **Python-first Workflow**: Optimized for Python development, data science, and scripting.
- **Studio Data Center**: Advanced analytics, simulation, and data management tools.
- **Explorer**: Navigate and manage your project files and folders with an intuitive sidebar.
- **Integrated Terminal**: Access a powerful terminal emulator directly within the IDE for running commands and scripts.
- **Customizable Themes**: Personalize your coding environment with built-in themes or create your own.
- **Command Palette**: Quickly access commands and features using a searchable command palette.
- **Project Management**: Organize, open, and manage multiple projects efficiently.
- **Plugin Architecture**: Extend Meridia’s functionality with plugins and custom integrations (planned).
- **Welcome Wizard**: Onboarding experience to help new users get started quickly.
- **Python Environment Detection**: Automatically detects available Python environments for seamless Python development.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Python](https://python.org/) (v3.11.x or higher recommended)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/MeridiaByMNovus/Meridia.git
   cd Meridia
   ```

2. **Create a `.env` file:**

   After cloning, create a `.env` file in the root directory. Add the following line:

   ```properties
   NODE_ENV=development
   ```

   - Set `NODE_ENV=production` for production builds.

3. **Install dependencies:**

   ```sh
   npm install
   ```

4. **Run the development server:**

   ```sh
   npm run watch
   ```

5. **Build for production:**

   ```sh
   npm run package
   ```

## Scripts

- `npm run dev` — Start the development server
- `npm run package` — Build the project for production
- `npm run lint` — Lint the codebase

## Contributing

Contributions are welcome! Please open issues or pull requests for bug fixes, new features, or improvements. See the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (to be added).

## Future Plans

- **Studio Expansion**: Add modules for machine learning, advanced reporting, and interactive dashboards.
- **Plugin Marketplace**: Allow users to discover and install plugins directly from the IDE.
- **Remote Development**: Support for remote workspaces and cloud-based development.
- **Debugging Tools**: Integrated debugging for multiple languages.
- **Collaboration**: Real-time collaboration features for pair programming.
- **Enhanced Language Support**: LSP integration for more languages and better code intelligence.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Note:** This project is under active development. Features and UI may change frequently. Feedback and suggestions are highly appreciated!
