#!/bin/bash

# scripts/scrape.sh: 04/07/2023
#
# Part of an effort to turn this blog into a static website.
# This blog has been superceded by the (static) blog at
# https://lambdalambda.ninja/blog for some time and
# will not be updated any more. I wanted to take it off
# of Heroku hosting and host it statically on GitHub.
#
# Besides scraping the website, the other major change is
# to turn the search feature into a static feature.
#
# Run this from the root of the repo while the node server
# is also running (yes, I know this is an awful solution,
# but it's a makeshift one just to get this site back up).
set -o errexit

pages=(
    /
    /posts
    /search
    /authors
    $(find posts/*.md authors/*.md | sed -r 's/^(.*)\.md$/\/\1/g')
)
resources=(
    /feed.xml
    $(find res -type f -printf '/%p ')
)
server=localhost:5000
out_dir=./docs

# Clean up any old build.
rm -rf "${out_dir}"

# Scrape pages.
for page in "${pages[@]}"; do
    echo Scraping page="${page}..."
    mkdir -p "${out_dir}""${page}"
    curl "${server}""${page}" >"${out_dir}""${page}"/index.html
done

# Scrape resources.
for resource in "${resources[@]}"; do
    echo Scraping resource="${resource}..."
    mkdir -p "$(dirname "${out_dir}""${resource}")"
    curl "${server}""${resource}" >"${out_dir}""${resource}"
done

# Generate 404 page.
curl "${server}"/404 >"${out_dir}"/404.html

echo Done.
