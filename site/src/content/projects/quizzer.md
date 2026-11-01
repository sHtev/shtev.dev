---
title: Quizzer
summary: lockdown family pub quiz, generated from APIs
repo: https://github.com/sHtev/quizzer
order: 3
draft: true
---

A pub quiz app I built for my family during lockdown, with team registration, rounds, answer sheets and scores. It's a Node/Express app with Handlebars templates and MongoDB.

Python scripts generate each quiz: trivia rounds from the Open Trivia Database API, film rounds from screenshots fetched through The Movie Database API, and music rounds from audio clips gathered with a Scrapy scraper, with the media hosted on S3.

I later rebuilt it in Ruby on Rails: [rails-quizzer](https://github.com/sHtev/rails-quizzer).
