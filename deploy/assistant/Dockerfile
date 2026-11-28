# Cumino's assistant in a container (AST-8, AST-14): the container is the
# cage. Built from the repository's root (`compose.yaml`'s context): the
# assistant bundled for Node (`packages/assistant/build/bundle.ts`), the
# repository's documents for the copy's `repo/` (AST-11), and Claude Code at
# a pinned version. It runs as the user `compose.yaml` names, its root
# read-only, with the folders it needs mounted and nothing else.
# [Q, C, 28 Nov 2026] (Alessandro, 28 Nov 2026: «Invece di un servizio
# Ubuntu puoi deployare il nodo in un container Docker»)

ARG NODE_IMAGE=node:24.22.3-slim

FROM ${NODE_IMAGE} AS build
RUN corepack enable
WORKDIR /src
COPY . .
ARG Q_COMMIT=unknown
ARG Q_VERSION=unknown
RUN pnpm install --frozen-lockfile --filter "@q-mino/assistant..." \
 && Q_COMMIT="${Q_COMMIT}" Q_VERSION="${Q_VERSION}" node packages/assistant/build/bundle.ts --out /out \
 && mkdir -p /out/repo \
 && cp --parents README.md docs/*.md $(find packages -name README.md -not -path '*/node_modules/*') /out/repo/ \
 && rm -f /out/repo/docs/CLAUDE.md

FROM ${NODE_IMAGE}
# Claude Code, pinned (AST-9): its npm package installs the native binary of the platform.
ARG CLAUDE_CODE_VERSION=2.1.302
RUN npm install --global "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
 && npm cache clean --force \
 && claude --version
COPY --from=build /out /opt/cumino-assistente
# Its settings in the container (AST-14): the folders as compose.yaml mounts them.
ENV NODE_ENV=production \
    HOME=/tmp/home \
    CUMINO_ASSISTANT_CAGE=the_container \
    CUMINO_ASSISTANT_CLAUDE=/usr/local/bin/claude \
    CUMINO_ASSISTANT_DATA=/data \
    CUMINO_ASSISTANT_CONFIG=/config \
    CUMINO_ASSISTANT_SOURCE=/srv/source \
    CUMINO_ASSISTANT_NOTES=/srv/notes \
    CUMINO_ASSISTANT_REPOSITORY=/opt/cumino-assistente/repo
USER 1000:1000
WORKDIR /tmp
STOPSIGNAL SIGTERM
CMD ["node", "--enable-source-maps", "--disable-warning=ExperimentalWarning", "/opt/cumino-assistente/assistant.mjs"]
