#!/bin/bash
MESA_LIBGBM_PATH=$(nix-build '<nixpkgs>' -A libgbm --no-out-link 2>/dev/null)
if [ -n "$MESA_LIBGBM_PATH" ]; then
  export LD_LIBRARY_PATH="$MESA_LIBGBM_PATH/lib:$LD_LIBRARY_PATH"
  echo "Set LD_LIBRARY_PATH to include libgbm from: $MESA_LIBGBM_PATH/lib"
else
  echo "WARNING: Could not find libgbm via nix-build. Playwright may fail to launch Chromium."
fi
