require "fileutils"

module BuildDirectory

  REVISION = `git log --pretty=format:'%h' -n 1`

  def self.js_url_for(file)
    "#{base_url}/#{file}"
  end

  def self.file_path
    base_dir.join REVISION
  end

  def self.clean
    FileUtils.rm_rf Dir.glob(base_dir.join "*")
  end

  def self.create
    FileUtils.mkdir_p file_path
  end

  BASE_NAME = "jsb"

  def self.base_dir
    Rails.root.join "public/#{BASE_NAME}"
  end

  def self.base_url
    "/#{BASE_NAME}/#{REVISION}"
  end
end
