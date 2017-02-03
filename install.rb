#!/usr/bin/env ruby
require 'openssl'
require 'open-uri'
require 'yaml'

# Source: http://stackoverflow.com/a/2889830 answering http://stackoverflow.com/questions/2889720/one-liner-in-ruby-for-displaying-a-prompt-getting-input-and-assigning-to-a-var
def prompt(*args)
    print(*args)
    gets
end

#
# Download and store the necessary files
#

File.open("package.json", "w") {|f|
  url = "https://raw.githubusercontent.com/ritterim/express-openid-connect-secured-jekyll/master/package.json"
  str = open(url, { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }).read # Note: This is not secure
  f.write str
}

File.open("npm-shrinkwrap.json", "w") {|f|
  url = "https://raw.githubusercontent.com/ritterim/express-openid-connect-secured-jekyll/master/npm-shrinkwrap.json"
  str = open(url, { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }).read # Note: This is not secure
  f.write str
}

File.open("server.js", "w") {|f|
  url = "https://raw.githubusercontent.com/ritterim/express-openid-connect-secured-jekyll/master/server.js"
  str = open(url, { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }).read # Note: This is not secure
  f.write str
}

web_config_prompt = prompt "Would you like to include Web.config? [y/N] "

if web_config_prompt.strip.downcase == "y"
  File.open("Web.config", "w") {|f|
    url = "https://raw.githubusercontent.com/ritterim/express-openid-connect-secured-jekyll/master/Web.config"
    str = open(url, { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }).read # Note: This is not secure
    f.write str
  }
end

#
# Add excludeItems to _config.yml file in a manner that will keep any comments
#

config_file = "_config.yml"
excludeItems = ["node_modules/", "npm-shrinkwrap.json", "npm-debug.log", "package.json", "server.js"]

config_str = IO.read(config_file)

# Ensure "exclude:" exists for usage with `config` below
unless config_str.include? "exclude:"
  config_str = config_str + "\nexclude:"
end

config = YAML.load config_str
excludeIndex = config_str.index("exclude:")

# Immediately after "exclude:" append "\n- ITEM" for each item to exclude if they do not already exist
for item in excludeItems
  unless config["exclude"] && config["exclude"].include?(item)
    config_str.insert(excludeIndex + "exclude:".length, "\n  - " + item)
  end
end

IO.write(config_file, config_str)

#
# Add node_modules/ to .gitignore if file exists and does not contain node_modules
#

gitignore_file = ".gitignore"

if File.exist?(gitignore_file)
  gitignore_str = IO.read(gitignore_file)

  unless gitignore_str.include? "node_modules"
    gitignore_str = gitignore_str + "\nnode_modules/"
  end

  IO.write(gitignore_file, gitignore_str)
end
