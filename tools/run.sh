#!/bin/sh
# The ray-ds tools from anywhere: tools/run.sh build, tools/run.sh webtest…
# They run from tools/ (`ray run` reads the ray.toml of the directory it runs
# in, which brings the ray_ds package); paths given to them stay the caller's.
RAY_DS_CWD=$(pwd) && export RAY_DS_CWD && cd "$(dirname "$0")" && exec ray run src/main.ray "$@"
