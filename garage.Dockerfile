# Garage image with the config baked in.
#
# We deliberately do NOT bind-mount garage.toml from the host. On Coolify's Docker Compose build
# pack, a relative bind mount of a repo file (`./garage.toml`) doesn't resolve, so Docker creates an
# empty *directory* at /etc/garage.toml and Garage crash-loops with "Loading configuration... Is a
# directory (os error 21)". Baking the file into the image avoids any host-path resolution.
#
# garage.toml rarely changes; when it does, Coolify rebuilds this on the next deploy.
FROM dxflrs/garage:v1.0.1
COPY garage.toml /etc/garage.toml
