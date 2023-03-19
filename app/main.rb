require 'octokit'

github_token = ENV['PERSONAL_ACCESS_TOKEN']
notion_secret = ENV['NOTION_SECRET']

puts "#{github_token}: #{notion_secret}"

client = Octokit::Client.new(:access_token => github_token)

user = client.user
user.login