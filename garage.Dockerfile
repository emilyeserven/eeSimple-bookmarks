# Garage image with the config baked in AND a shell available.
#
# Two things this solves for Coolify's Docker Compose build pack:
#   1. Bind-mounting ./garage.toml is unreliable — the relative path doesn't resolve, so Docker
#      creates an empty *directory* at /etc/garage.toml and Garage crash-loops with
#      "Loading configuration... Is a directory (os error 21)". Baking the file in avoids that.
#   2. The upstream dxflrs/garage image is FROM scratch — no shell — so Coolify's container
#      "Terminal" can't open (no bash/sh) and you can't run the one-time `garage` layout/key
#      bootstrap from the UI. Re-basing the static binary onto Alpine gives the container /bin/sh.
#
# The garage binary is statically linked, so it runs unchanged on Alpine. garage.toml rarely
# changes; when it does, Coolify rebuilds this on the next deploy.
FROM dxflrs/garage:v1.0.1 AS upstream

FROM alpine:3.20
COPY --from=upstream /garage /garage
COPY garage.toml /etc/garage.toml
ENTRYPOINT ["/garage"]
CMD ["server"]
