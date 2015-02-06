require 'build_directory'

module ApplicationHelper
  JS_BASE_PATH = "/js/"

  # Output a list of javascript tag files to load JSPM managed JS files
  def js_tags_for(*files)

    return bundled_js_tags_for(files) if Rails.env.production?

    bare_js_tags_for(files)
  end

  private

  def bare_js_tags_for(*files)
    [
      content_tag(:script, nil, src: "#{JS_BASE_PATH}jspm_packages/system.js"),
      content_tag(:script, nil, src: "#{JS_BASE_PATH}config.js"),
      files.map do |f|
        content_tag(:script, "System.import('js/#{f}');".html_safe)
      end
    ].flatten.join("\n").html_safe
  end

  def bundled_js_tags_for(*files)
    [
      content_tag(:script, nil, src: "#{JS_BASE_PATH}jspm_packages/traceur-runtime.js"),
      files.map do |f|
        content_tag(:script, nil, src: bundle_url_for(f))
      end
    ].flatten.join("\n").html_safe
  end

  def bundle_url_for(file)
    BuildDirectory.js_url_for(file).gsub(/\.jsx!$/, ".js")
  end
end
