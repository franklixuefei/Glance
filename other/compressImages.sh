find . -iname "*png" -print0 | xargs -0 -P4 -n 1 pngout
