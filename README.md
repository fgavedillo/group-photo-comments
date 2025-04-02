# Welcome to your PRLconecta project

## Project info

**URL**: https://lovable.dev/projects/15ec66d6-6812-4bdb-aee9-7936d3c1744c

## Changelog

### 2025-04-02: Mejoras en chat y servicio de correos

- **Funcionalidad de chat**:
  - Solucionado problema de envío de mensajes en el chat
  - Corregido el manejo de imágenes adjuntas en mensajes
  - Mejorado el sistema para mostrar errores

- **Servicio de correos**:
  - Creada nueva Edge Function `send-email-v2` para manejo robusto de correos
  - Implementado sistema de envío de correos individuales por incidencia
  - Implementado sistema de resumen agrupado de incidencias
  - Mejorada la plantilla HTML para correos

- **Mejoras técnicas**:
  - Robustez en manejo de sesiones de usuario
  - Mejor manejo de errores en el cliente
  - Logs detallados para facilitar depuración

## Funcionalidades principales

1. **Chat interactivo**: Sistema de mensajería con soporte para imágenes.
2. **Gestión de incidencias**: Seguimiento y resolución de problemas reportados.
3. **Notificaciones por email**: Alertas automáticas sobre incidencias.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/15ec66d6-6812-4bdb-aee9-7936d3c1744c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (base de datos, autenticación y funciones serverless)
- Resend (servicio de envío de correos)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/15ec66d6-6812-4bdb-aee9-7936d3c1744c) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
