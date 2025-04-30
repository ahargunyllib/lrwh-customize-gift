# Code Convention

- Filenames should be written in `kebab-case` (`-`) separating words for consistency and readability (e.g., `user-profile.tsx`, `user-details.tsx`).
- Variables should be named using `camelCase`, and they should be descriptive to convey their purpose clearly. Avoid using single-letter variable names.
- Page and Component Functions use traditional function declarations for defining pages and components. This ensures consistency across the codebase and aligns with React conventions (e.g., `function MyComponent() { ... }`).
- Logical Functions use arrow functions for defining logical functions or utility functions that perform a specific task or calculation. This is often preferred for concise syntax and binding behavior (e.g., `const calculateTotal = (items: Item[]) => items.reduce((sum, item) => sum + item.price, 0);`).
- Functions should be named using `camelCase`, starting with a verb to describe what the function does (e.g., `fetchData`, `submitForm`).
- Component names should be written in PascalCase to distinguish them from regular functions and variables (e.g., `UserProfile`, `ButtonComponent`).
- Use `type` for Props and Parameters when specifying the type of props or parameters, use the `type` keyword instead of `interface`. This helps maintain consistency across the codebase and allows for simpler type declarations (e.g., `type ButtonProps = { label: string; onClick: () => void; }`).
- Domain Types are shared across features (e.g., `User`, `News`, etc.) should be declared in the `shared` directory to provide consistent types throughout the project. These types are generally more abstract and reusable across different parts of the application.
- Feature-Specific Types are specific to a particular feature should reside within the `features/<feature-name>/types` directory. These types are meant to serve only the functionality within that feature and should not be shared across other features unless necessary.
- Use named exports for logical functions or variables to improve clarity and ensure easy identification when importing (e.g., `export const dateFormatter = () => { ... };`).
- Use default exports for the component in a file. This is typically reserved for the primary export of a module (e.g., `export default HomeComponent;`).
- Use barrel exports for group exports in an `index.ts` file within each `components` module to make imports cleaner and easier. For example, export all components from the `components/index.ts` file, allowing imports like `import { Button, Header } from './components';` instead of deep imports.
- Single-letter variable names should be avoided, as they provide little context for their purpose. Instead, use descriptive names to make the code more readable and maintainable (e.g., use `userId` instead of `u`, `itemCount` instead of `i`).

# Commit Message Convention

This website follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

Commit message will be checked using husky and commit lint, you can't commit if not using the proper convention below.

### Format

`<type>(optional scope): <description>`
Example: `feat(pre-event): add speakers section`

### 1. Type

Available types are:

- feat → Changes about addition or removal of a feature. Ex: `feat: add table on landing page`, `feat: remove table from landing page`
- fix → Bug fixing, followed by the bug. Ex: `fix: illustration overflows in mobile view`
- docs → Update documentation (README.md)
- style → Updating style, and not changing any logic in the code (reorder imports, fix whitespace, remove comments)
- chore → Installing new dependencies, or bumping deps
- refactor → Changes in code, same output, but different approach
- ci → Update github workflows, husky
- test → Update testing suite, cypress files
- revert → when reverting commits
- perf → Fixing something regarding performance (deriving state, using memo, callback)
- vercel → Blank commit to trigger vercel deployment. Ex: `vercel: trigger deployment`

### 2. Optional Scope

Labels per page Ex: `feat(pre-event): add date label`

\*If there is no scope needed, you don't need to write it

### 3. Description

Description must fully explain what is being done.

Add BREAKING CHANGE in the description if there is a significant change.

**If there are multiple changes, then commit one by one**

- After colon, there are a single space Ex: `feat: add something`
- When using `fix` type, state the issue Ex: `fix: file size limiter not working`
- Use imperative, and present tense: "change" not "changed" or "changes"
- Don't use capitals in front of the sentence
- Don't add full stop (.) at the end of the sentence


### References
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Theodorus Clarence's Conventional Commit Readme](https://theodorusclarence.com/shorts/conventional-commit-readme)
