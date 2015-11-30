#!/usr/bin/env bash
# -*- bash -*-
#
#

# Array is used.
# Inspired from: http://stackoverflow.com/a/3811396/841803
orig_args=("$@")
action="$1"
shift

set -u -e -o pipefail

eval "$(bash_setup show_err_line_trap)"

layout="Public/applets/MUE/layout.mustache"
error_files=(
  ./Public/403.html
  ./Public/404.html
  ./Public/500.html
)

# === Color codes: =============================================
# FROM: http://www.ibm.com/developerworks/aix/library/au-learningtput/
# FROM: http://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
GREEN=$(tput setaf 2)
GREEN_BG=$(tput setab 2)
WHITE=$(tput setaf 7)
BOLD_WHITE_ON_GREEN=$(tput bold)${WHITE}${GREEN_BG}
BOLD_WHITE=$(tput bold)${WHITE}
RESET_COLOR=$(tput sgr0)
ORANGE='\e[0;33m'
RED='\e[0;31m'
BG_RED='\e[1;31m'
# ==============================================================

case "$action" in

  "help"|"--help")
    bash_setup print_help $0
    exit 0
    ;;

  "procs")
    ps aux | grep -E "node|megauni|pm2|inotif" --color
    ;;

  "deploy")
    # === $ deploy
    # === To be used in both production and development envs.
    # === Install npm and bower packages.
    # === Updates npm and bower packages.
    # === Renders all stylus and html files ($ render)
    npm install
    npm update
    node_modules/bower/bin/bower install
    node_modules/bower/bin/bower update
    $0 render
    ;;

  "compile_stylus")
    # ===  $ bin/megauni.js  compile_stylus
    # ===  $ bin/megauni.js  compile_stylus   path/to/file.styl
    files="$@"
    if [[ -z "$files" || "$files" =~ "vars.styl" || "$files" =~ "/_" ]]; then
      files="$(echo ./Public/applets/*/*.styl)"
    fi

    IFS=$' '
    for f in $files
    do
      if [[ ! "$f" =~ "/_" && ! "$f" =~ "vars.styl" ]] ; then
        $0 stylus $f
      else
        echo "=== Skipping: $f"
      fi
    done
    ;;


  "js_files")
    # === $ js_files
    find ./Public/ ./specs/    \
      -type f                  \
      -regex ".*\.js\$"        \
      -and -not -regex ".*/Public/.*" \
      -and -not -regex ".*/vendor/.*" \
      -printf "%p\n"
    ;;

  "typescript_files")
    # === $ typescript_files
    find ./Public ./specs       \
      -type f                   \
      -regex ".*\.ts\$"         \
      -and -not -regex ".*\.d\.ts$"   \
      -and -not -regex ".*/vendor/.*" \
      -printf "%p\n"
    ;;

  "validate_js")
    # ===  $ bin/megauni.js  validate_js
    # ===  $ bin/megauni.js  validate_js   file/path/file.js

    if [[ -z "$@" ]]; then # === validate all .js files
      while read  file
      do
        js_setup jshint! "$file" || { exit_stat=$?; echo -e "=== jshint ${RED}failed${RESET_COLOR}: $file" 1>&2; exit $exit_stat; }
      done < <($0 js_files)
      exit 0
    fi # ================================================

    file="$1"
    shift
    if [[ "$file" =~ "bin/" ]]; then
      echo "=== Skipping bin fie: $file" 1>&2
      exit 0
    fi

    js_setup jshint! "$file"
    if [[ "$(readlink --canonicalize $file)" == "$(readlink --canonicalize render.js)" ]] ; then
      $0 compile_mustache
    fi
    ;;

  "validate_html")
    # === $ ... validate_html                     => validates all error html files.
    # === $ ... validate_html  path/to/file.html

    if [[ -z "$@" ]] ; then
      for file in ${error_files[@]}
      do
        $0 validate_html $file
      done
      exit 0
    fi

    file="$1"
    shift

    echo -n "=== Validating $file: " 1>&2
    contents="$(cat $file)"
    new_contents="$(tidy -config tidy.configs.txt "$file")" || new_contents="fail"
    if [[ "$new_contents" == "fail"  ]]; then
      echo -e "${RED}Fail${RESET_COLOR}" 1>&2
    else
      if [[ "$contents" == "$new_contents" ]]; then
        echo "${GREEN}Passed.${RESET_COLOR}" 1>&2
      else
        echo "${GREEN}Passed.${RESET_COLOR} Writing new content..." 1>&2
        echo -e "$new_contents" > $file
        echo -e "=== HTML valid: $file ${GREEN}Passed${RESET_COLOR} and wrote file."
      fi
    fi

    ;;

  "compile_typescript")
    # ===  $ bin/megauni.js  compile_typescript
    # ===  $ bin/megauni.js  compile_typescript   file/path/file.ts
    # === Turns .ts file into temp file for compile_es6

    if [[ -z "$@" ]]; then
      while read file
      do
        $0 compile_typescript "$file"
     done < <($0 typescript_files)
      exit 0
    fi # ================================================

    file="$1"
    shift

    if [[ "$file" == *.d.ts ]]; then
      echo "=== Skipping compiling typescript definition file: $file" 1>&2
      exit 0
    fi

    new_file="$(dirname $file)/$(basename $file .ts).js"

    do_d_ts=""
    if [[ -f "Public/scripts/$(basename $file .ts).ts" ]]; then
    do_d_ts=" --declaration "
    fi

    echo ""
    echo -e "=== Compiling typescript: $file: "
    tsc  \
      ${do_d_ts}       \
      --noImplicitAny  \
      --sourceMap      \
      --out $new_file  \
      --target ES6     \
      $file || { \
      exit_stat=$?;             \
      echo -e "=== typescript ${RED}failed${RESET_COLOR}: $file" 1>&2; \
      exit $exit_stat; \
    }

    tput cuu1; tput el;
    echo -e "=== Typescript: $file: ${GREEN}Passed${RESET_COLOR}"
    $0 compile_es6 $new_file
    ;;

  "compile_es6")
    # ===  $ bin/megauni.js  compile_es6   /tmp/file.js    # ==> --out-file /tmp/file.es3.js
    # ===  $ bin/megauni.js  compile_es6   /tmp/file.path  path/to/output.js
    # === Runs it through Babel.
    file="$1"
    shift

    if [[ -n "$@" ]]; then
      new_file="$1"
      shift
    else
      new_file="$(dirname "$file")/$(basename "$file" .js).es3.js"
    fi

    echo -n "=== Babel: $file => $new_file: "
    babel -s true --out-file $new_file $file
    echo "${GREEN}Passed${RESET_COLOR}"
    $0 validate_js $file
    ;;


  "compile_mustache")
    # ===  $ bin/megauni.js  compile_mustache
    # ===  $ bin/megauni.js  compile_mustache    file/path/mustache.mustache

    # === Render all mustache files if:
    if [[ -z "$@" ]]; then
      IFS=$' '
      while read -r file
      do
        echo ""
        $0 compile_mustache $file
      done < <(echo Public/applets/*/*.mustache)
      exit 0
    fi

    file="$1"
    shift

    if [[ "$file" =~ "layout.mustache" ]]; then
      echo "=== Skipping: $file"
      exit 0
    fi

    echo "=== Rendering: $file"
    meta="$(node render.js $layout $file)"
    path="$(echo "$meta" | head -n 1)"
    dir="$(dirname $path)"
    html="$(echo "$meta" | tail -n +2)"

    if [[ ! -d "$dir" ]]; then
      mkdir -p "$dir"
      echo "=== Created dir: ${dir}"
    fi

    echo "$html" > $path
    $0 validate_html $path
    ;;

  "render")
    # === $ render
    # === * Compiles TypeScript
    # === * Validates .js files
    # === * Renders all stylus files.
    # === * Renders all mustache templates.
    $0 compile_stylus
    $0 compile_mustache
    $0 compile_typescript
    $0 validate_js
    ;;

  "watch")
    echo ""

    # ===  $ bin/megauni.js  watch
    # ===  $ bin/megauni.js  watch   fast

    if [[ ! "$@" =~ "fast" ]]; then
      $0 render || :
    fi

    echo -e "\n=== Watching ${ORANGE}$(basename $0)${RESET_COLOR} (proc ${$})..."

    while read CHANGE
    do
      dir=$(echo "$CHANGE" | cut -d' ' -f 1)
      op=$(echo "$CHANGE" | cut -d' ' -f 2)
      path="${dir}$(echo "$CHANGE" | cut -d' ' -f 3)"
      file="$(basename $path)"

      echo -e "\n=== $CHANGE (${path})"

      if [[ "$path" == "$0" ]]; then
        echo "=== ${GREEN}Reloading${RESET_COLOR}: $0 ${orig_args[@]}"
        break
      fi

      if [[ "${error_files[@]}" =~ "$path" ]]; then
        echo "=== Validating in 2s to let gvim detect change: $path "
        sleep 2s
        $0 validate_html $path
      fi

      if [[ "$file" == *.mustache ]]; then
        if [[ "$file" == "layout.mustache" ]]; then
          $0 compile_mustache
        else
          $0 compile_mustache "$path"
        fi
      fi

      if [[ "$file" == *.styl ]]; then
        $0 compile_stylus "$path"
      fi

      if [[ "$path" == *.ts ]]; then
        $0 compile_typescript $path || :
      fi

      if [[ "$path" == *.json ]]; then
        $0 validate_js $path || :
      fi

      if [[ "$path" == *.js ]] && ! js_setup has_ts $path ; then
        $0 validate_js $path || :
      fi
    done < <(
     inotifywait \
       --quiet   \
       --monitor \
       --event close_write \
       "$0"        \
       -r Public/  \
       -r specs/   \
       *.js        \
       --exclude "/vendor/"
     )

     $0 ${orig_args[@]}
    ;;

  *)
    # === $ bin/megauni.html bower ...

    file="$( echo node_modules/*/bin/$action )"

    if [[ -f "$file"  ]]; then
      $file "$@"
      exit 0
    fi

    echo "Unknown action: $action" 1>&2
    exit 1
    ;;

esac # === case $action

