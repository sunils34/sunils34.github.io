---
title: "Managing Systems"
description: "I find myself coming back to watch this talk by Richard Cook nearly every 3 months."
published: 2017-01-05T16:44:37.000Z
updated: 2017-01-08T17:33:15.251Z
originalUrl: "https://medium.com/@sunils34/managing-systems-ecbf161066cf"
readingTime: 7
tags: ["management", "systems-thinking", "tech", "buffer", "startup"]
heroImage: "/images/blog/managing-systems/01.png"
draft: false
---

I find myself coming back to watch this talk by Richard Cook nearly every 3 months.

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/PGLYEDpNu60" title="Richard Cook: Resilience in Complex Adaptive Systems" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>

I highly recommend watching this video when you have the chance. It’s an entertaining talk and it’s shaped so much of how I think and operate complex systems.

In the video, Cook describes the properties of complex systems and talks about how all organizations and people typically act and react to system failures. He uses Rasmussen’s [Risk Management in a Dynamic Society: A Modelling Problem](http://www.sciencedirect.com/science/article/pii/S0925753597000520).

This seems complex, but it’s actually quite simple and I believe the key to being a successful strategic thinking in systems and organizations. This model works in every system I can think of — applications and products, computing systems of limited resources, and people, teams and large-scale organizations.

#### Accident Boundaries and the Operating Point

In any system, there are failure or _accident boundaries_ that a system cares about. For instance in building a startup, there are typically product, engineering, finance, marketing, people/HR, customer support, sales metrics that teams care about.

Within the _accident boundaries_ there’s an _operating point_, which describes how balanced and biased the system is towards.

The operating point is constantly in motion and often is pushed close to a failure boundary. For instance if a company is too aggressive in focusing on growth, it may push product teams to ship too early, thus crossing a Product Quality _failure boundary_. Once a team recognizes that the operating point has passed the Product Quality boundary of failure, it’ll apply a _counter gradient_ to ensure this doesn’t happen again.

It’s often in the nature of reacting to crossing an accident boundaries that teams may push the counter gradient too far in the other direction. For instance in the case when a team crosses a Product Quality boundary, they may be likely to push back against Growth/Sales, much more than may be needed and it puts the operating point closer to the growth boundary of failure. If the operating point crosses this boundary, then an organization may be in business trouble.

Like this there are many pendulum swings of the operating point within a complex system of sensing and adapting.

The problem is we never truly know where an accident boundary is — we only know when we’ve crossed it. (ie. the site is down, a great employee just left, we lost a big customer etc.)

#### Marginal Boundaries

In order to improve the resiliency of a system it’s important to set up _marginal boundaries_ — a signal, alert or safety measures to keep an operating point away from an accident boundary.

Setting up marginal boundaries are incredibly important for someone operating a system to sleep well at night — knowing there are things in place to prevent the operating point from crossing an accident boundary. Marginal boundaries also help you focus on a different part of the system without worrying about an accident boundary that has a good marginal boundary set up.

#### Normalization of Deviance

So why, after setting up marginal boundaries do we seem to still see systems fail. Richard Cook describes that over time, the operating point will test the marginal boundaries. For instance, after a process or rule has been in place for a while, we forget the original reasoning for why that was set up. And we’ll recognize we can do without a certain measure.

That means it becomes nearly guaranteed that when you’re not focusing on a part of the system, the operating point will find ways to push past the marginal boundaries and closer to the accident boundary. And only after an accident happens do we typically see a corrective action.

Systems are naturally poised to fail and that over time, though through continuous learning and improving the marginal boundaries does a system become more and more resilient.

### Crossing Accident Boundaries

At Buffer (the organizational system) we’ve crossed accident boundaries many, many times. Each time we were keen to learn from it, sense and react and we’d push the operating point the other way. These are two of our biggest failures and how we’ve learned from them:

-   In 2013, [Buffer was hacked.](https://open.buffer.com/buffer-has-been-hacked-here-is-whats-going-on/) None of us expected our systems to be vulnerable, and we didn’t know where the accident boundary was for keeping our systems secure. As a small startup we didn’t expect our systems would be vulnerable to a sophisticated attack, two-vector attack. After that experience and learning of the current state of web security, we had pushed the operating point [far away from that](https://medium.com/@sunils34/how-to-think-about-security-at-startups-its-a-never-ending-job-a294cb7a2fc3#.6s1f9gdok) (a good thing). We’ve set up many best practices and monitoring to improve our focus on security to ensure we never cross that boundary again. Some of these processes may come to be viewed as a burden to those that haven’t experienced a hack before. The challenge is we (and any organization) will never truly know where the accident boundary for security is. So it’s important to sense and react when an operating point is close to a marginal boundary for security. It’s never a guarantee that things are completely safe, so it’s better to continue adding more and more monitoring, rules and enforcing best practices and assume the worst. Though we still have to be mindful not to cross a productivity/usability and convenience accident boundary.
-   [Last year, we over-hired and had to make layoffs.](https://open.buffer.com/layoffs-and-moving-forward/) This was a mistake in not knowing where the economic boundary of failure was for our business and we did not forecast our hiring plan vs growth well enough. Once we recognized we crossed this boundary of failure we had to put in counter gradients like make lay-offs, cut back perks etc. Those actions push the operating point away from the economic boundary of failure and closer to the accident boundary which makes Buffer not a great place to work, thus risking voluntary churn. That was something we had to be so mindful of and had to keep a close eye on the marginal boundary there (through asking regular team surveys, manager 1–1s, encouraging feedback and CEO AMAs etc). We’ve now set up better marginal boundaries to ensure we have key oversight on the finance boundary, including hiring a VP of Finance.

### Trade-off thinking

I’ve found building an organization very similar to building a complex web or mobile applications. Every day as an engineer, you’ll make 100s of decisions among trade-offs . That’s similar with management and organizational strategy. Of course, the impact of failures are an order of magnitude worse — making mistakes that affect peoples lives is much worse than an app going down (in most cases).

Making trade-offs comes natural to engineers who build systems. There’s rarely a situation when there’s a right and a wrong answer. Instead, you continually make decisions that have benefits and pitfalls. (Angular vs React… AWS vs GKE vs Self-Hosting, SQS vs RabbitMQ).

Management is similar. There’s rarely a right and wrong answer. Building systems is great practice to management and trade-off thinking. It’s why I strive to ensure Engineering Managers at Buffer (and myself) code. I believe coding brings a level of comfort in making trade-off decisions.

### **Monitoring and Alerts**

A key concept I’ve taken away from building systems is monitoring and alerting. When I first started building web-app systems, the monitoring and alerting offering landscape was primitive. I simply would check Twitter or our support inbox if there was a trend or check if we were down. I had several twitter searches following a similar form to: “to:@bufferapp down.”

Not a single hour of the day would go by that I wouldn’t check that twitter search.

Discovering alerting through tools like AWS Cloudwatch and PagerDuty was a non-linear step in my systems understanding. Now I had a way to assess and set up marginal boundaries of failure, and would receive a notification if any part of the system was off.

I’ve tried to take the same philosophies into management. I try to assess and predict the accident boundaries and set up marginal boundaries as oversight. I now have 10 1–1s — It’s definitely not at a point where I can give equal attention to each person, however I try to encourage everyone to share regular thoughts with me in Slack, and I’ve tried to create a culture on my team of speaking up when something is off. I use [Looker](https://looker.com/) to get alerts of quantifiable metrics (customer support ticket numbers, bug numbers, budgets). In our weekly exec meeting, we report and review those numbers. Much of the purpose of those weekly exec meetings is for us to come together and assess where exactly the operating point is within the system of Buffer’s marginal boundaries.

I’ll never know where all the accident boundaries are, but when an accident does happen, I know it’s part of the ballgame and I’ll ensure we apply counter gradients and improve our marginal boundaries for the next time.

When you’re building a system, whether it’s growing a web-app, building a company, or providing anesthesia to a patient, or even leading a nation, _it’s literally a balancing act_. I hope this post helps to describe the dynamics and give terms to an abstract but important concept.
