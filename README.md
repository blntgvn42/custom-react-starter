# Custom React Starter

A modern React project starter with optional Tailwind CSS, i18n support, and authentication pages.

## Quick Start

```bash
npx @bulent.guven/custom-react-starter my-app
```

## Features

- 🚀 React + TypeScript setup
- 🎨 Optional Tailwind CSS integration
- 🌐 Optional i18n (internationalization) support
- 🔐 Optional authentication pages (login, register)
- 📦 Multiple package manager support (npm, pnpm, yarn, bun)

## Usage

```bash
npx @bulent.guven/custom-react-starter <project-name> [options]
```

### Options

- `--help, -h`: Show help message
- `--tailwind`: Add Tailwind CSS support
- `--i18n`: Add i18n (internationalization) support with English and Turkish translations
- `--pm=<manager>`: Specify package manager (npm, pnpm, yarn, bun). Default: pnpm
- `--auth-pages`: Add authentication pages (login, register)
- `--all, -a`: Enable all features (Tailwind CSS, i18n, auth pages)

### Examples

```bash
# Create a basic project
npx @bulent.guven/custom-react-starter my-app

# Create a project with Tailwind CSS
npx @bulent.guven/custom-react-starter my-app --tailwind

# Create a project with all features using yarn
npx @bulent.guven/custom-react-starter my-app --all --pm=yarn

# Create a project with i18n and auth pages
npx @bulent.guven/custom-react-starter my-app --i18n --auth-pages
```

## What's Included

### Base Setup
- React with TypeScript
- Vite for fast development and building
- TanStack Router for type-safe routing
- ESLint and Prettier for code quality

### Optional Features

#### Tailwind CSS
- Utility-first CSS framework
- PostCSS configuration
- Basic styling setup

#### Internationalization (i18n)
- i18next integration
- Browser language detection
- English and Turkish translations
- Type-safe translations

#### Authentication Pages
- Login page
- Registration page
- Basic routing setup

## License

MIT
