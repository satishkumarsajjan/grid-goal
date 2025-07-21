# Contributing to GridGoal

First off, thank you for considering contributing to GridGoal! We are excited to build this project with a community of passionate developers. Every contribution, from a small bug fix to a new feature, is highly valued.

This document provides guidelines to ensure a smooth and effective contribution process for everyone.

### Code of Conduct

This project and everyone participating in it is governed by the [GridGoal Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

### How Can I Contribute?

There are many ways to contribute:

- **Reporting Bugs:** Find a bug? Please open an issue and use the "Bug Report" template. Provide as much detail as possible.
- **Suggesting Enhancements:** Have an idea for a new feature or an improvement to an existing one? Open an issue using the "Feature Request" template.
- **Writing Code:** Pick an open issue, especially one labeled `help wanted` or `good first issue`, and submit a pull request.
- **Improving Documentation:** Documentation is still in planning stage, will be ready to build once the planning stage gets over.

### Your First Code Contribution

Ready to dive in? Here’s the standard workflow for submitting a code change:

1.  **Find an Issue:** Look for an existing issue that you want to work on. If you have a new idea, please open an issue first to discuss it with the maintainers. This prevents wasted effort.
2.  **Fork the Repository:** Click the "Fork" button on the top right of the GitHub page.
3.  **Clone Your Fork:**
    ```bash
    git clone https://github.com/satishkumarsajjan/grid-goal.git
    cd grid-goal
    ```
4.  **Create a Branch:** Create a descriptive branch name for your feature or fix.
    ```bash
    git checkout -b feat/add-new-chart
    # or
    git checkout -b fix/timer-bug
    ```
5.  **Set Up Your Environment:** Follow the "Getting Started" guide in the main `README.md` to get your local development environment running.
6.  **Make Your Changes:** Write your code! Follow the coding style and conventions outlined below.
7.  **Commit Your Changes:** We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps us automate releases and makes the commit history easy to read.

    - `feat:` A new feature.
    - `fix:` A bug fix.
    - `docs:` Documentation only changes.
    - `style:` Changes that do not affect the meaning of the code (white-space, formatting).
    - `refactor:` A code change that neither fixes a bug nor adds a feature.
    - `chore:` Changes to the build process or auxiliary tools.

    ```bash
    git commit -m "feat: Add daily goal progress card to dashboard"
    ```

8.  **Push to Your Fork:**
    ```bash
    git push origin feat/add-new-chart
    ```
9.  **Open a Pull Request:** Go to the original GridGoal repository on GitHub and open a pull request. Fill out the template, linking it to the original issue.

### Coding Style & Conventions

- **TypeScript:** All new code should be written in TypeScript.
- **Formatting:** We use Prettier for automatic code formatting. Please run `pnpm format` before committing your changes.
- **Linting:** We use ESLint to catch common errors. Please run `pnpm lint` to check your code.
- **Component Naming:** React components should be in `PascalCase`.
- **File Naming:** Files should be in `kebab-case` (e.g., `goal-navigator.tsx`).

Thank you again for your interest in making GridGoal better!
