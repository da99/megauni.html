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

  "render_stylus")
    # ===  $ bin/megauni.js  render_stylus
    # ===  $ bin/megauni.js  render_stylus   path/to/file.styl
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
    find ./Public/ ./specs/ -type f -regex ".*.js\$" -and -not -regex ".*/Public/.*" -and -not -regex ".*/vendor/.*" -printf "%p\n"
    ;;

  "jshint!")
    while read  file
    do
      if [[ -f "$file" ]]; then
        js_setup jshint! "$file" || (echo "=== jshint failed: $file" 1>&2 && exit 1)
      fi
    done < <($0 js_files)
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
      echo "${RED}Fail${RESET_COLOR}" 1>&2
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

  "render_typescript")
    # ===  $ bin/megauni.js  render_typescript   file/path/file.ts
    # === Turns .ts file into .js file
    file="$1"
    shift
    new_file="$(dirname $file)/$(basename $file .ts).es6"
    es6_file="$(mktemp)"

    echo -n "=== Typescript: $file: "
    node_modules/typescript/bin/tsc --target ES6 $file --outFile $es6_file
    echo "${GREEN}Passed${RESET_COLOR}"
    $0 render_js $es6_file $new_file
    ;;

  "render_js")
    # ===  $ bin/megauni.js  render_js   file/path/file.js                      # file is jshint!, no Babel
    # ===  $ bin/megauni.js  render_js   file/path/file.js   path/to/output.js  # Run through Babel
    # === Runs it through Babel and jshint
    file="$1"
    shift

    if [[ -z "$@" ]]; then
      js_setup jshint! $file
      if [[ "$(readlink --canonicalize $file)" == "$(readlink --canonicalize render.js)" ]] ; then
        $0 render_html
      fi

    else
      new_file="$(dirname $1)/$(basename $1 .es6).js"
      shift
      echo -n "=== Babel: $file => $new_file: "
      node_modules/babel-cli/bin/babel.js $file --out-file $new_file
      echo "${GREEN}Passed${RESET_COLOR}"
    fi
    ;;

  "render_html")
    # ===  $ bin/megauni.js  render_html
    # ===  $ bin/megauni.js  render_html    file/path/mustache.mustache

    # === Render all mustache files if:
    if [[ -z "$@" ]]; then
      IFS=$' '
      while read -r file
      do
        echo ""
        $0 render_html $file
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
    results="$(node render.js $layout $file)"
    html_file="$(echo "$results" | head -n 1)"
    contents="$(echo "$results" | tail -n +2)"
    html_dir="$(dirname $html_file)"

    if [[ ! -d "$html_dir" ]]; then
      mkdir -p "$html_dir"
      echo "=== Created dir: ${html_dir}"
    fi

    echo "$contents" > $html_file
    $0 validate_html $html_file
    ;;

  "render")
    # === $ render
    # === 1) Validates .js files using "jshint".
    # === 2) Renders all stylus files.
    # === 3) Renders all mustache templates.
    $0 jshint!
    $0 render_stylus
    $0 render_html
    ;;

  "watch")
    # ===  $ bin/megauni.js  watch
    # ===  $ bin/megauni.js  watch   fast

    if [[ ! "$@" =~ "fast" ]]; then
      $0 jshint! || :
      $0 validate_html || :
    fi

    echo -e "=== Watching ${ORANGE}$(basename $0)${RESET_COLOR} (proc ${$})..."

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
          $0 render_html
        else
          $0 render_html "$path"
        fi
      fi

      if [[ "$file" == *.styl ]]; then
        $0 render_stylus "$path"
      fi

      if [[ "$path" == *.json && ! "$path" =~ "bin/" ]]; then
        js_pass="true"
        js_setup jshint! $path || js_pass=""
      fi

      if [[ "$path" == *.ts ]]; then
        $0 render_typescript $path || :
      fi

      if [[ "$path" == *.js ]]; then
        $0 render_js $path || :
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

