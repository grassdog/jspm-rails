require "fileutils"

module BuildDirectory

  BASE_NAME = "jsb"

  def self.base_url
    "/#{BASE_NAME}/#{JspmRails::REVISION}"
  end

  def self.file_path
    base_dir.join JspmRails::REVISION
  end

  def self.base_dir
    Rails.root.join "public/#{BASE_NAME}"
  end

  def self.clean
    FileUtils.rm_rf Dir.glob(base_dir.join "*")
  end

  def self.create
    FileUtils.mkdir_p file_path
  end
end
