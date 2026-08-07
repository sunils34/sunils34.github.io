---
title: "How to think about security at startups: It’s a never ending job"
description: "In late October 2013, Buffer suffered a major security breach . As a startup of 8 people at the time, I’ll admit, security wasn’t a top priority on our…"
published: 2014-05-26T17:29:50.024Z
updated: 2014-05-26T17:29:50.024Z
originalUrl: "https://medium.com/buffer-stories/how-to-think-about-security-at-startups-its-a-never-ending-job-a294cb7a2fc3"
readingTime: 7
tags: ["security", "startups", "engineering", "buffer"]
heroImage: "/images/blog/how-to-think-about-security-at-startups-its-a-never-ending-job/01.jpg"
draft: false
---

> Lessons about application security 6 months after recovering from a breach

In late October 2013, [Buffer](https://bufferapp.com/) suffered a [major security breach](http://open.bufferapp.com/buffer-has-been-hacked-here-is-whats-going-on/). As a startup of 8 people at the time, I’ll admit, security wasn’t a top priority on our minds. Our approach when it came to security was to checkmark the basics like setting up proper firewalls, enforcing SSL, and salt+hashing passwords. Going through a security breach changes your perspective on this. We made a huge mistake by doing the minimum. Since that fateful day we’ve completely revamped how we approach our application security. My goal for this post is to help other startups and app developers understand that making security a priority doesn’t add much overhead and that the investment is well worth it.

### The attack

On October 26, my Twitter and Facebook feeds had gone mad with reports that a magical fruit was helping people lose 15 pounds. I realized within seconds that the spam was coming from our app and affecting many Buffer users. Thankfully, because Twitter and Facebook use [OAuth](http://en.wikipedia.org/wiki/OAuth) for API authorization, we were able to shut down the spamming ourselves within 10 minutes. Approximately 30k Facebook users had their walls spammed during just these 10 minutes. It took us a full week to understand the extent of what exactly happened for this to occur.

An admin from our database hosting provider, who was using a shared email/password combo, had their account hacked. The attackers used this account to scrape some 400,000 Twitter and Facebook OAuth tokens. The attackers had also breached our teammate’s Github account to extract client secrets they needed to make authorized requests to Twitter. It was a two-pronged attack, and our best guess is that they obtained these passwords through the massive Adobe leak earlier in October. After we obtained the access logs from Github of these unauthorized sessions, it was quite clear that the goal of these attackers was to extract any secret of value, things like AWS credentials, Stripe keys, API client secrets, anything at all which they could probably sell on black markets.

![We usually look a lot happier. ‘The look of a team recovering from a securing breach.’](/images/blog/how-to-think-about-security-at-startups-its-a-never-ending-job/02.jpg)
_We usually look a lot happier. ‘The look of a team recovering from a securing breach.’_

### **Steps we took to improve security at Buffer**

As you may imagine, experiencing something like this first-hand really shook our faith in what we can trust. After the hack, we questioned and re-thought our approach. Since October, we’ve made countless changes to how we operate with security.

Here are some of the highlights:

-   Set up and enforced Two-Factor Authentication for all team members for every service that supports it. We try not to use any third-party service that doesn’t support TFA, especially if they store critical data.
-   Built out and [launched](https://bufferapp.com/2step) Two-Factor Authentication for Buffer.
-   Bought everyone in the company [1Password](https://agilebits.com/onepassword) to ensure that no shared passwords are used.
-   Encrypted all access tokens, emails, and any other identifiable data that we store.
-   Removed all secrets from all Github repositories and reset all credentials.
-   Treated all of our Github private repositories as open source.
-   Worked with [Egor Homakov](http://www.sakurity.com/) and a few other auditors to help close other holes.
-   Set up a [bounty program](https://bufferapp.com/security). Through this, we’ve fixed over a hundred different bugs and security holes.
-   Set up a workflow in our chat client where we receive a notification every time a new vulnerability is reported. That way, we can triage and jump on the important ones asap.

For how much of a nightmare last October was for us, I’m actually quite grateful that we went through that wake-up call. I can say for certain we wouldn’t have been as gung-ho with these security improvements had we not have been hacked. It would have been hard for our whole team (now 24) to get behind setting up Two-Factor Auth for everything. We also probably would not have set up a bounty program, encrypted access tokens, and removed secrets from Github as quickly. The hack forced us to actively seek out what we can do to improve rather than take a passive approach to security. Contrary to what it may seem, I’ve learned throughout the past six months that shoring up security really has not added much overhead to our development process.

### Simple tips to get started with security at your startup

I’m sure that even if you’re not a payments company, you’re probably still very concerned with protecting any data your customers have given you. I also can relate to that feeling that if you’ve never had a security incident, it’s hard to be motivated to jump on security items when you have limited resources and so many other priorities. Most early stage startups simply don’t have the resources or the money to create a VPN and set up enterprise Github and Mail accounts. Still, there are some small steps you can get started with today that will make a big difference and which won’t stall any of your development work. Eventually, as you start to do some of these steps, it’ll quickly become habitual. This is how you start to **build a culture that focuses on user security.**

### Immediate steps you can take today

**Passwords** With password breaches happening quite often, it’s pretty much inevitable that your shared password to a service will be leaked someday. At Buffer, we’ve seen an increase in distributed brute-force login attempts (for which we have quickly worked to implement limiting and IP banning). I’m sure these types of attacks are occurring often for most services. A way to protect yourself is to use separate, non-related passwords. Services like [1Password](https://agilebits.com/onepassword) or [Last Pass](https://lastpass.com/) help you ensure that you use unique, hard to crack passwords. Not only does it make it easier to keep track of shared logins, it also makes it much quicker to login as a whole. With handy browser extensions, logging in is as simple as ‘command+\\’.

**Two Factor Authentication (TFA)** We had enough motivation to set up TFA after October. For those that haven’t embraced it, I’d absolutely recommend you reconsider. I remember myself thinking last year that TFA was a nuisance, and that the extra second to take out my smartphone to verify a log-in would be unbearably disruptive to my workflow. After converting to a TFA believer, I’ve quickly realized how easy TFA is to set up and use when logging in. It’s well worth those two seconds it takes to take out a phone and verify the login. The value of using TFA is knowing that even if your password is compromised, an attacker will still need your physical device to authorize the login. We’ve found the most important accounts for us to protect are: **Gmail, Github, AWS, Stripe, MongoHQ, Dropbox Facebook/Twitter** (app client credentials).

**Treat private Github repositories like they’re open source** I know how easy it is to copy and paste your Stripe key or AWS credentials to a config file and check it in to Github. In fact, I remember seeing quite a few library documentations instructing developers to set up API secrets in a file that is checked in with the source code. We’ve realized this isn’t a secure way as it reduces the control you have to safeguard your credentials. It doesn’t take that much more effort to set them up as server environment variables. Removing secrets from source code checked in to Github also helps ensure that these secrets aren’t stored locally, which helps eliminate the attack scenario where a team member’s laptop is stolen. If you have any secrets on Github and are starting to extract them out of your source, you’ll want to reset those credentials to invalidate them.

### Long-term steps to take

As you start to expand on the basics for securing your application and find you want to do more, here are some steps that we have found helpful at Buffer:

**Assign a person on your team to lead security** If you’re like us and not yet at the stage where it makes sense to hire a security engineer, this is important. I took it upon myself to oversee the security effort at Buffer after our breach. I had no experience with computer security at the time but I learned along the way. It was key to have one person take this role because we needed someone to ensure that everyone has TFA set up, and help look for security related tasks and assign them to our engineers—kind of like a security product manager. Having one person in charge of this helps centralize the effort and ensures that security is a constant priority.

**Work with a security auditor(s).** We’ve been actively working with a couple of different security firms to help push us to reduce attack vectors. Since none of us are security experts and we’re both an API provider and consumer, it was important for us to seek outside help to double check what we’ve done. Working with people like [Egor](https://twitter.com/homakov) has helped us reduce the likelihood for [OAuth account hijacking](http://homakov.blogspot.com/2012/07/saferweb-most-common-oauth2.html) among other things. As you work closely with these experts, you learn what the best practices are and eventually get better at securing things yourself.

**Set up a Bug and Security Bounty** I must admit, when I first set up [our bug bounty](https://bufferapp.com/security), we were inundated with various reports and it was overwhelming. Some were serious, like not using a secure session cookie, and certain CSRF/XSS issues. Others were not as serious but could very well be exploited some day. Though we took a while to get through that initial backlog, the key for us was to triage every report. One of the biggest things I’ve come to accept is that as we add more features and grow, we’re going to push out more vulnerabilities. Security bounties help with this because there will always be people on the look out for vulnerabilities. We’ve had amazing white-hat hackers disclose these reports for a reward of being acknowledged on our page.

### No Silver Bullets

One of the key things I’ve learned from focusing on security for the past 6 months is that it’s a completely different paradigm than usual software development. There are no test cases that you can write to say that you’re secure. It’s more of an optimization problem. The steps I detail here that we’ve taken have saved us from a few different attack vectors, however I still feel (and I suspect I’ll always feel) that we’re playing catch up and there’s more to do. New attack vectors surface all the time. And as we develop more features and continue to grow, we’ll be vulnerable to more holes. Last month’s [Heartbleed](http://heartbleed.com/) is a great example of how you can never be certain things are secure. The most secure organizations are the ones that continuously rethink everything, take every threat seriously, and react quickly to close holes. The only way a startup would take this approach is if security is a habit.

Do you have an interesting approach to application security? I’d love to hear about it! Hit me up [@sunils34](https://twitter.com/sunils34).

(PS we’re also [hiring](http://jobs.bufferapp.com/?utm_campaign=startupsecurity&utm_medium=medium.com&utm_source=blog#engineering) people who take security seriously)
