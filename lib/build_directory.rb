require "fileutils"

module BuildDirectory

  def self.url_for(file)
    "#{base_url}/#{file}"
  end

  def self.file_path
    base_dir.join JspmRails::REVISION
  end

  def self.clean
    FileUtils.rm_rf Dir.glob(base_dir.join "*")
  end

  def self.create
    FileUtils.mkdir_p file_path
  end

  # Helpers

  BASE_NAME = "jsb"

  def self.base_dir
    Rails.root.join "public/#{BASE_NAME}"
  end

  def self.base_url
    "/#{BASE_NAME}/#{JspmRails::REVISION}"
  end
end
