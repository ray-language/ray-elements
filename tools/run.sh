#!/bin/sh
# The ray-elements tools from anywhere: tools/run.sh build, tools/run.sh webtest…
# They run from tools/ (`ray run` reads the ray.toml of the directory it runs
# in, which brings the elements package); paths given to them stay the caller's.
RAY_ELEMENTS_CWD=$(pwd) && export RAY_ELEMENTS_CWD && cd "$(dirname "$0")" && exec ray run src/main.ray "$@"
