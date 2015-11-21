#!/usr/bin/env bash
# -*- bash -*-
#
#

# Array is used.
# Inspired from: http://stackoverflow.com/a/3811396/841803
restart_args=("$@")

action="$1"
layout="Public/applets/MUE/layout.mustache"
html_files=(
  ./Public/403.html
  ./Public/404.html
  ./Public/500.html
)
shift

set -u -e -o pipefail

# ==============================================================
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

  "help")
    echo ""
    echo "  $ bin/megauni.js  watch"
    echo "  $ bin/megauni.js  watch   fast"
    echo ""
    echo "  $ bin/megauni.js  render_stylus"
    echo "  $ bin/megauni.js  render_stylus   path/to/file.styl"
    echo ""
    echo "  $ bin/megauni.js  render_html"
    echo "  $ bin/megauni.js  render_html    file/path/mustache.mustache"
    echo ""
    bash_setup print_help $0
    exit 0
    ;;

  "deploy")
    # === $ deploy
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
    find Public/ specs/ -type f -regex ".*.js\$" -and -not -regex ".*/vendor/.*" -printf "%p\n"
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
    htmls="$@"
    if [[ -z "$@" ]] ; then
      htmls=${html_files[@]}
    fi

    for file in $htmls
    do
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

    done
    ;;

  "render_html")
    files="$@"
    if [[ -z "$files" ]]; then
      files="$(echo Public/applets/*/*.mustache)"
    fi

    render_html () {
      local file="$1"
      echo "=== Rendering: $file"
      local results="$(node render.js $layout $file)"
      local html_file="$(echo "$results" | head -n 1)"
      local contents="$(echo "$results" | tail -n +2)"
      local html_valid="true"
      local html_dir="$(dirname $html_file)"

      if [[ ! -d "$html_dir" ]]; then
        mkdir -p "$html_dir"
        echo "=== Created dir: ${html_dir}"
      fi

      echo "$contents" > $html_file
      $0 validate_html $html_file
    }

    IFS=$' '
    for file in $files
    do
      if [[ "$file" =~ "layout.mustache" ]]; then
        echo "=== Skipping: $file"
      else
        render_html "$file"
      fi
    done
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

  "procs")
    ps aux | grep -E "node|megauni|pm2|inotif" --color
    ;;

  "__watch")
    eval "$(bash_setup setup_traps)"
    setup_traps

    echo -e "=== Watching ${ORANGE}$(basename $0)${RESET_COLOR} (proc ${$})..."

    while read CHANGE
    do
      dir=$(echo "$CHANGE" | cut -d' ' -f 1)
      op=$(echo "$CHANGE" | cut -d' ' -f 2)
      path="${dir}$(echo "$CHANGE" | cut -d' ' -f 3)"
      file="$(basename $path)"

      echo -e "=== $CHANGE (${path})"

      if [[ "${html_files[@]}" =~ "$path" ]]; then
        echo "=== Validating in 2s to let gvim detect change: $path "
        sleep 2s
        $0 validate_html $path
      fi

      if [[ "$path" =~ "$0" ]]; then
        echo ""
        echo "=== ${GREEN}Reloading${RESET_COLOR}: $0 ${restart_args[@]}"
        exec $0 ${restart_args[@]}
      fi

      if [[ "$file" =~ ".mustache" ]]; then
        if [[ "$file" == "layout.mustache" ]]; then
          $0 render_html
        else
          $0 render_html "$path"
        fi
      fi

      if [[ "$file" =~ ".styl" ]]; then
        $0 render_stylus "$path"
      fi

      if [[ "$path" =~ ".js" && ! "$path" =~ "bin/" ]]; then
        js_pass="true"
        js_setup jshint! $path || js_pass=""

        if [[ -n $js_pass && "$file" == "render.js" ]]; then
          $0 render_html
        fi

        echo ""

      fi
    done < <(
     inotifywait \
       --quiet   \
       --monitor \
       --event close_write \
       "$0"        \
       -r Public/  \
       -r specs/   \
       --exclude "/vendor/"
     )

    ;;

  "watch")
    eval "$(bash_setup setup_traps)"
    setup_traps

    if [[ ! "$@" =~ "fast" ]]; then
      $0 jshint! || :
      $0 validate_html || :
    fi

    $0 __watch ${restart_args[@]}

    ;;

  *)

    file="$( echo node_modules/*/bin/$action )"

    if [[ -f "$file"  ]]; then
      $file "$@"
      exit 0
    fi

    echo "Unknown action: $action" 1>&2
    exit 1
    ;;

esac # === case $action

