require "build_directory"

namespace :js do

  desc "Clean out all files from the build directory"
  task :clean do
    puts "Cleaning the build directory"
    BuildDirectory.clean
  end

  task :out_dir do
    puts "Creating the build directory"
    BuildDirectory.create
  end

  desc "Build production version of Javascript"
  task build: :out_dir do
    sh "jspm bundle-sfx --minify lib/main #{BuildDirectory.file_path}/main.js"
  end
end

