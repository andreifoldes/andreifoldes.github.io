# -*- encoding: utf-8 -*-
# stub: jekyll-livereload 0.2.2 ruby lib

Gem::Specification.new do |s|
  s.name = "jekyll-livereload"
  s.version = "0.2.2"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib"]
  s.authors = ["Robert DeRose"]
  s.date = "2016-09-02"
  s.description = "    This is a plugin for Jekyll. It adds additional command line options to\n    the server command to provide Livereloading capabilities.\n"
  s.email = ["RobertDeRose@gmail.com"]
  s.homepage = "https://github.com/RobertDeRose/jekyll-livereload"
  s.licenses = ["MIT"]
  s.required_ruby_version = Gem::Requirement.new(">= 2.0.0")
  s.rubygems_version = "2.5.1"
  s.summary = "Adds LiveReload support to Jekyll's included Server"

  s.installed_by_version = "2.5.1" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<jekyll>, ["~> 3.0"])
      s.add_runtime_dependency(%q<em-websocket>, ["~> 0.5"])
      s.add_development_dependency(%q<bundler>, ["~> 1.12"])
    else
      s.add_dependency(%q<jekyll>, ["~> 3.0"])
      s.add_dependency(%q<em-websocket>, ["~> 0.5"])
      s.add_dependency(%q<bundler>, ["~> 1.12"])
    end
  else
    s.add_dependency(%q<jekyll>, ["~> 3.0"])
    s.add_dependency(%q<em-websocket>, ["~> 0.5"])
    s.add_dependency(%q<bundler>, ["~> 1.12"])
  end
end
