FROM node:18-bullseye AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_SUPABASE_URL=https://adam-api.bytecrafts.in
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_LLM_API_URL=""
ARG VITE_LLM_API_KEY=""
RUN if [ -f .env.local ]; then \
            cp .env.local .env; \
        elif [ -f .env ]; then \
            echo ".env present"; \
        else \
            printf 'VITE_SUPABASE_URL="%s"\nVITE_SUPABASE_ANON_KEY="%s"\nVITE_LLM_API_URL="%s"\nVITE_LLM_API_KEY="%s"\n' "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" "$VITE_LLM_API_URL" "$VITE_LLM_API_KEY" > .env; \
        fi

ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost || exit 1
CMD ["nginx", "-g", "daemon off;"]