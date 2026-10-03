# Skills instaladas

Este directorio contiene skills de Claude Code (`.claude/skills/<nombre>/SKILL.md`), instaladas
desde sus repos de origen en GitHub con `npx skills add`. Claude las activa automáticamente según
el contexto de la conversación, o pueden invocarse explícitamente con `/<nombre>`.

| Skill | Fuente | Para qué sirve |
|---|---|---|
| `find-skills` | vercel-labs/skills | Descubre e instala skills de agentes IA desde repos de GitHub, npm o Notion. |
| `agent-browser` | vercel-labs/agent-browser | CLI de automatización de navegador para agentes: navegar, rellenar formularios, capturas, scraping, testing de apps web. |
| `code-review` | mattpocock/skills | Revisión de código para bugs de corrección y limpieza de reutilización/simplificación/eficiencia. |
| `design-mobile-apps` | designed-by-ai/skills | Diseña apps móviles o pantallas UI (Sleek), implementación en HTML/React Native/SwiftUI. |
| `skill-creator` | anthropics/skills | Crea, modifica y evalúa skills de Claude Code. |
| `imagegen-frontend-mobile` | leonxlnx/taste-skill | Genera conceptos de pantallas móviles premium (solo imágenes, no código). |
| `clerk-backend-api` | clerk/skills | Explorador y ejecutor de la API REST backend de Clerk (usuarios, organizaciones, etc.). |
| `nodejs-backend-patterns` | wshobson/agents | Patrones de backend Node.js (Express/Fastify): middleware, auth, errores, diseño de API. |
| `vercel-react-view-transitions` | vercel-labs/agent-skills | Animaciones con la View Transition API de React (transiciones de página, elementos compartidos). |
| `ai-avatar-video` | prime-skills/runcomfy-agent-skills | Videos de avatar IA / talking-head / lip-sync vía RunComfy. |
| `hyperframes-animation` | heygen-com/hyperframes | Conocimiento de animación para HyperFrames: reglas de movimiento, blueprints de escena, adaptadores de runtime. |
| `review-animations` | emilkowalski/skills | Revisión de animaciones de UI. |
| `ui-animation` | mblode/agent-skills | Construye, revisa y mide movimiento de UI: springs, gestos, scroll, easing. |
| `prompt-master` | nidhinjs/prompt-master | Genera prompts optimizados para herramientas de IA (LLMs, Cursor, Midjourney, etc.). |
| `agent-reach` | panniantong/agent-reach | Investigación/búsqueda en 16 plataformas web (redes sociales, dev, finanzas, video). |
| `gstack` | garrytan/gstack | Router de la suite de skills gstack. |

*Nota: `css-animations` (heygen-com/hyperframes) no existe en ese repo — pendiente de aclarar con el usuario. `antibrow/anti-detect-browser-skills → browser-mcp-agent` se omitió (kit de evasión de detección/multi-cuenta). `mukul975/Anthropic-Cybersecurity-Skills` (818 skills) quedó bloqueado por el clasificador de seguridad del sistema — pendiente de decisión del usuario.*
