#!/usr/bin/env bash
# -*- bash -*-
#
#

# Array is used.
# Inspired from: http://stackoverflow.com/a/3811396/841803
restart_args=("$@")
restart_args+=('no_server')

action="$1"
layout="Public/applets/MUE/layout.mustache"
shift
set -u -e -o pipefail

# ==============================================================
# === Color codes: =============================================

# FROM: http://www.ibm.com/developerworks/aix/library/au-learningtput/
green=$(tput setaf 2)
green_bg=$(tput setb 2)
white=$(tput setaf 7)
bold_white_on_green=$(tput bold)${white}${green_bg}
bold_white=$(tput bold)${white}
RESET_COLOR=$(tput sgr0)

# FROM: http://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
Color_Off='\e[0m'
BRed='\e[1;31m'
RED='\e[0;31m'
Green='\e[0;32m'
Orange='\e[0;33m'
# ==============================================================

render_all () {
  for file in Public/applets/*/*.mustache
  do
    if [[ ! ( "$file" =~ "layout.mustache" ) ]]; then
      render_file "$file"
    fi
  done
}

render_file () {
  local file="$1"
  echo "=== Rendering: $file"
  local results="$(iojs render.js $layout $file)"
  local html_file="$(echo "$results" | head -n 1)"
  local contents="$(echo "$results" | tail -n +2)"
  local html_valid="true"
  local html_dir="$(dirname $html_file)"

  if [[ ! -d "$html_dir" ]]; then
    mkdir -p "$html_dir"
    echo "=== Created dir: ${html_dir}"
  fi

  ( echo "$contents" | tidy -config tidy.configs.txt -output "$html_file" ) || html_valid=""

  if [[ ! -z "$html_valid" ]]; then
    echo "=== Wrote: $html_file"
  fi
}



jshint () {
  echo -n "=== Running jshint: $1: "
  set +e
  js_hint_results="$($0 jshint "$1" 2>&1)"
  js_hint_exit_code="$?"
  set -e
  if [[ js_hint_exit_code -eq "0" ]]; then
    echo -e "${green}Passed${RESET_COLOR}"
  else
    echo -e "${RED}Fail${RESET_COLOR}"
    echo "$js_hint_results"
  fi
}

on_exit () {
  echo -e "${Green}=== Waiting in ${$}...${RESET_COLOR}"
  wait
  echo -e "${Green}=== Done: ${$}${RESET_COLOR}"
}

on_err () {
  exit_code="$1"
  line="$2"
  echo -e    "!!! ERROR: line: ${RED}${line}${RESET_COLOR} exit: ${RED}${exit_code}${RESET_COLOR}"
  echo -e    "!!! Running: KILL -SIGINT -$$"
  trap "exit ${exit_code}" INT
  kill -SIGINT -$$
}


case "$action" in

  "help")
    echo ""
    echo "  $ bin/megauni.js  watch"
    echo "  $ bin/megauni.js  watch   fast"
    echo "  $ bin/megauni.js  deploy"
    echo ""
    echo "  $ bin/megauni.js  render_stylus"
    echo "  $ bin/megauni.js  render   path/to/file.rb"
    echo ""
    exit 0
    ;;

  "deploy")
    bin/megauni npm install
    node_modules/bower/bin/bower install
    ;;

  "render_stylus")
    for f in ./Public/applets/*/*.styl
    do
      if [[ ! "$f" =~ "vars.styl" ]] ; then
        bin/megauni.js stylus $f
      fi
    done
    ;;

  "render")
    echo "Rendering: $1"
    name="$1"
    shift

    if [[ -f "$name" ]]; then
      dir="$(dirname "$name")"
      name="$(basename "$dir")"
    else
      dir="./Public/applets/$name"
    fi

    markup="$dir/markup.html"

    if [[ ! -d "$dir" ]]; then
      echo "Not found: $dir" 1>&2
      exit 1
    fi

    err=""
    ruby -r"./Public/applets/MUE/layout" -r"${dir}/markup.rb" -e "
      File.write(\"$markup\", HTML);
    " || err="true"

    if [[ -z "$err" ]]; then
      if [[ -f "$markup" ]]; then
        echo "$markup"
      fi

      if [[ "$@" =~ "print" ]]; then
        cat "$markup"
      fi
    fi # === if no err

    ;;

  "render_mustache")
    render_file "$@"
    ;;

  "procs")
    ps aux | grep -E "node|megauni|pm2|inotif" --color
    ;;

  "watch")
    trap 'on_err $? $LINENO' ERR
    trap 'on_exit' EXIT

    do_linting="true"
    do_server="true"
    if [[ "$@" =~ "fast" ]]; then
      do_linting=""
    fi

    if [[ "$@" =~ "no_server" ]]; then
      do_server=""
    fi

    js_files="$(echo -e ./*.js specs/*.js Public/applets/*/*.js)"

    # === Regular expression:
    IFS=$' '

    if [[ ! -z "$do_linting" ]]; then

      for file in $js_files
      do
        if [[ -f "$file" ]]; then
          jshint "$file"
        fi
      done

      render_all
    fi


    re='^[0-9]+$'
    if [[ ! -z "$do_server" ]]; then
      (
        cd ../megauni
        bin/megauni watch
      ) &
      echo "=== process: $!"
      echo "=== process group: $$"
    fi

    echo "=== Watching:"

    IFS=$' '
    while read CHANGE
    do
      IFS=$'\n'
      dir=$(echo "$CHANGE" | cut -d' ' -f 1)
      op=$(echo "$CHANGE" | cut -d' ' -f 2)
      path="${dir}$(echo "$CHANGE" | cut -d' ' -f 3)"
      file="$(basename $path)"

      echo -e "=== $CHANGE (${path})"

      if [[ "$path" =~ ".html" ]]; then
        tidy -config tidy.configs.txt -output "$path" "$path"|| echo "FAILED"
      fi

      if [[ "$path" =~ "$0" ]]; then
        echo "=== Reloading: $0 ${restart_args[@]}"
        exec $0 ${restart_args[@]}
      fi

      if [[ "$file" =~ ".mustache" ]]; then
        if [[ "$file" == "layout.mustache" ]]; then
          render_all
        else
          render_file "$path"
        fi
      fi

      if [[ "$path" =~ ".js" && ! "$path" =~ "bin/" ]]; then
        jshint $path

        if [[ js_hint_exit_code -eq "0" ]]; then
          if [[ "$file" == "render.js" ]]; then
            render_all
          fi
        fi

        echo ""

      fi
    done < <(
     inotifywait \
       --quiet   \
       --monitor \
       --event close_write \
       "$0" $js_files Public/applets/*/*.mustache
     )

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
