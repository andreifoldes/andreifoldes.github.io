---
layout: post
title: "Building iEMAbot"
---

If you've ever run an EMA (Ecological Momentary Assessment) study that lasts more than a few days, you probably know the pain. Looking at the available options, realizing most are too expensive. Deciding to go with a local-hosted option, setting up the scheduling, managing participants across multiple days or weeks, dealing with reminders and missed prompts. Most of the existing tools either cost a fortune, lock you into a specific platform, or require way more technical setup than they should. Some of the proprietary tools have free tiers, but most studies have unique quirks. Maybe you have a burst design, you want different groups to have unique schedules etc... we need open-source solutions.

That's basically why I started working on **iEMAbot**. The goal is to build a general API for longitudinal EMA studies — one that can interface with whatever delivery channel actually makes sense for your target population. If your participants are best reached via SMS, the study runs over SMS. If it's WhatsApp, then WhatsApp. If you want a custom web app, the scheduling and delivery bot should plug right into that too.

This is really where APIs shine. By keeping the core logic — scheduling, reminders, participant management — behind an API, it opens the door to plugins and extensions. Maybe you need to pull data from wearables. Maybe you want to hook up an AI component for adaptive sampling. An API-first design makes all of that possible without having to rebuild the whole system every time.

The vision for deployment is equally simple: you should be able to hand it off to your university IT team, or just self-host it yourself on a single-CPU Azure node with a few command line commands and some light text editing to plug in your passwords and secret tokens. No DevOps degree should be required.

It's still early days — the project is very much a work in progress. The plan is to open-source the code once it's in better shape, but it's not quite ready for that yet. In the meantime, I've put together a documentation site where you can follow along with how things are developing:

[iEMAbot Documentation](https://iema-bot-docs.netlify.app/)

The docs are built with [Docusaurus](https://docusaurus.io/), which my colleague Kristoffer recommended — and honestly it's been great for getting something clean and readable up quickly. Thanks Kristoffer!

If you're interested in EMA tooling or have thoughts on what would make your life easier when running these kinds of studies, feel free to reach out. More updates to come.