# Multi-stage Dockerfile to build the Vite React app and serve with Nginx
FROM node:18-bullseye AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests and install (pnpm respects pnpm-lock.yaml)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source + production env (VITE_* vars baked at build time)
COPY . .
COPY .env.production .env.production
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

## Serve with nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
RUN mkdir -p /etc/nginx/conf.d && cat > /etc/nginx/conf.d/default.conf <<'NGINX_CONF'
server {
	listen 80;
	server_name _;
	root /usr/share/nginx/html;
	index index.html;

	gzip on;
	gzip_types text/css application/javascript application/json image/svg+xml;

	location / {
		try_files $uri $uri/ /index.html;
	}

	location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|woff2?)$ {
		expires 30d;
		add_header Cache-Control "public, max-age=2592000, immutable";
	}
}
NGINX_CONF
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost || exit 1
