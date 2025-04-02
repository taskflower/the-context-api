# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `yarn dev`: Run development server with hot-reload
- `yarn build`: Compile TypeScript to JavaScript
- `yarn start`: Run the compiled application

## Code Style Guidelines
- **Imports**: Group imports by type (core, third-party, local) with a blank line between groups
- **Formatting**: Use strict TypeScript (tsconfig.json), 2-space indentation
- **Types**: Define interfaces/types in separate `.types.ts` files; use explicit typing
- **Naming**: 
  - camelCase for variables, functions
  - PascalCase for classes, interfaces, types
  - kebab-case for file names
- **Error Handling**: Use ApiError class for all errors with appropriate ErrorCodes
- **Project Structure**: Follow service-based architecture with routes, services, and utilities
- **Middleware**: Custom middleware in middleware/ folder
- **Express Pattern**: Routes -> Service -> Utils pattern for request handling

## Security & Performance
- Always validate user input
- Implement proper error handling with status codes
- Use rate limiting for API endpoints