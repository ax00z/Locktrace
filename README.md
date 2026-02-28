# Locktrace

A real-time theft analytics dashboard for the City of Toronto, built on publicly available Toronto Police Service data. The application visualises auto and bicycle theft incidents from the past three months on an interactive map, supported by statistical breakdowns and filterable tables.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20-green)
![Python](https://img.shields.io/badge/python-3.12-yellow)

---

## Overview

The system follows a decoupled architecture. A Python scraper pulls incident data from the Toronto Police ArcGIS REST API, cleans it, and writes static JSON files. A React frontend reads those files and renders the dashboard. GitHub Actions ties the two together, running the scraper daily and deploying the updated build to GitHub Pages.

There is no database, no backend server, and no runtime API dependency once the site is deployed.

---

## Prerequisites

- **Node.js** 20 or later
- **Python** 3.12 or later (for the scraper; the frontend runs independently)
- A modern browser (Chromium-based, Firefox, Safari)

---

## Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/ax00z/locktrace.git](https://github.com/ax00z/locktrace.git)
cd locktrace