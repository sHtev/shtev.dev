---
title: Raspberry Pi Foundation
summary: an education charity's websites, from donations to running young people's code in space
order: 2
draft: true
---

**The organisation.** The Raspberry Pi Foundation is a UK education charity that helps young people learn to code and make things with computers.

**What I did.** From 2019 to 2022 I led a development team building the Foundation's web applications in Ruby on Rails and React. I worked on:

- **An online Python editor.** The embedded editor the Foundation used didn't support Python 3, so we built our own on Skulpt, an in-browser Python implementation, modifying it heavily and writing JavaScript implementations of Raspberry Pi's Python libraries, including the Sense HAT used by Astro Pi, other hardware add-on boards, and p5 for the projects built on Processing-style graphics, so those projects run in the browser. It runs inside the projects site, so learners write and run code alongside the instructions.
- **The projects site**, where young people follow step-by-step coding projects.
- **Astro Pi**, where young people sign up to have their code run on Raspberry Pi computers aboard the International Space Station.
- **Coolest Projects**, the Foundation's showcase for young creators. When COVID lockdowns stopped the in-person event, we turned it into an online platform for submitting and judging projects.
- **Single sign-on**, the login used across the Foundation's sites.
- **The home page**, including online donations through Stripe.
