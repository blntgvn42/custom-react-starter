# Custom React Starter

A modern React project starter with an interactive CLI to set up your project with optional features like Tailwind CSS, i18n support, and authentication pages.

## Quick Start

```bash
npx @bulent.guven/custom-react-starter
```

## Features

- 🚀 React + TypeScript setup
- 🎨 Optional Tailwind CSS integration
- 🌐 Optional i18n (internationalization) support
- 🔐 Optional authentication pages
- 📦 Multiple package manager support
- 💻 Interactive CLI interface

## Usage

Simply run the CLI command and follow the interactive prompts:

```bash
npx @bulent.guven/custom-react-starter
```

You'll be asked to:
1. Enter your project name
2. Choose your preferred package manager (npm, pnpm, yarn, or bun)
3. Select the features you want to include:
   - Tailwind CSS
   - i18n (internationalization)
   - Authentication pages

## What's Included

### Base Setup
- React with TypeScript
- Vite for fast development and building
- TanStack Router for type-safe routing
- ESLint and Prettier for code quality
- Git initialization with initial commit

### Optional Features

#### Tailwind CSS
- Utility-first CSS framework
- PostCSS configuration
- Basic styling setup
- Vite plugin configuration

#### Internationalization (i18n)
- i18next integration
- Browser language detection
- English and Turkish translations
- Type-safe translations
- Automatic configuration in main.tsx

#### Authentication Pages
- Login page template
- Registration page template
- Authentication-specific layout
- Basic routing setup

## Available Scripts

Once your project is created, you can run:

```bash
# Start development server
pnpm start

# Build for production
pnpm build
```

## Package Manager Support

The CLI supports multiple package managers:
- pnpm (default)
- npm
- yarn
- bun

Choose your preferred package manager during project setup.

## License

MIT
