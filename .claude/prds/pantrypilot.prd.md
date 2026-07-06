
# PantryPilot Founder Blueprint (Investor-Grade PRD)

## Executive Summary

PantryPilot is an AI-powered nutrition platform that transforms fridge photos into personalized meal recommendations aligned with health goals such as weight loss, muscle gain, and healthy eating.

Core Value Proposition:
"Turn what's already in your fridge into meals that help you reach your health goals."

---

# 1. Market Analysis

## Global Trends

- AI-powered consumer apps continue growing.
- Obesity and weight-loss markets exceed billions annually.
- Fitness and nutrition subscriptions are widely accepted.
- Food waste remains a major household problem.

## Opportunity

Most recipe apps solve:
"What can I cook?"

PantryPilot solves:
"What should I eat to achieve my goal?"

---

# 2. Competitive Analysis

## MyFitnessPal
Strength:
- Tracking ecosystem

Weakness:
- Doesn't analyze fridge contents

## Mealime
Strength:
- Meal planning

Weakness:
- Requires manual ingredient entry

## ChatGPT
Strength:
- Flexible

Weakness:
- No dedicated workflow or nutrition-focused UX

## PantryPilot Advantage

- Fridge photo input
- Goal-based recommendations
- Nutrition-first experience
- Food waste reduction

---

# 3. User Personas

## Fitness User

Age: 18-35

Goals:
- Gain muscle
- Hit protein targets

Pain:
- Doesn't know what to cook

## Weight Loss User

Age: 20-45

Goals:
- Lose weight

Pain:
- Overeats and lacks meal planning

## Busy Professional

Goals:
- Save time

Pain:
- Decision fatigue after work

---

# 4. North Star Metric

Weekly Active Users Generating Recipes

Secondary Metrics:

- Daily scans
- Saved recipes
- Subscription conversion
- User retention

---

# 5. Revenue Model

## Free

- 3 scans/day

## Pro ($9/month)

- Unlimited scans
- Grocery lists
- Weekly meal plans

## Premium ($19/month)

- Nutrition tracking
- Goal coaching
- Progress analytics

---

# 6. Product Roadmap

## Phase 1 (MVP)

Features:

- Authentication
- Fridge Scanner
- Recipe Generation
- Nutrition Analysis
- Save Recipes

Goal:
First 100 users

---

## Phase 2

Features:

- Weekly Meal Plans
- Grocery Lists
- Diet Profiles

Goal:
1000 users

---

## Phase 3

Features:

- Weight Tracking
- AI Nutrition Coach
- Personalized Recommendations

Goal:
5000 users

---

# 7. Technical Architecture

Frontend:
- Next.js
- TailwindCSS

Backend:
- Next.js API Routes

Database:
- Supabase PostgreSQL

Authentication:
- Supabase Auth

AI:
- Gemini Vision
- Gemini Text Generation

Hosting:
- Vercel

---

# 8. Database Design

## profiles

id
email
goal
height
weight
created_at

## recipes

id
user_id
title
calories
protein
carbs
fat
instructions

## recipe_ingredients

id
recipe_id
ingredient_name
amount
is_missing

## meal_plans

id
user_id
week_start
plan_data

---

# 9. API Design

POST /api/analyze-fridge

Input:
image

Output:
ingredients[]

---

POST /api/generate-recipe

Input:
ingredients
goal

Output:
recipes[]

---

POST /api/save-recipe

Input:
recipe

Output:
success

---

GET /api/meal-plan

Output:
weekly plan

---

# 10. Gemini Prompt Architecture

Step 1:
Detect ingredients from image

Output JSON

Step 2:
Generate recipes

Output JSON

Step 3:
Calculate nutrition

Output JSON

Single structured schema across the platform.

---

# 11. SEO Strategy

Target Keywords:

- ai recipe generator
- healthy recipes from ingredients
- what can I cook with
- meal planner ai
- weight loss meals

Content Strategy:

3 articles/week

Examples:

- High Protein Meals From Fridge Ingredients
- AI Meal Planning Guide
- Weight Loss Recipes Using Leftovers

---

# 12. TikTok Strategy

Post 3 videos/day

Content Formula:

Problem
→ Fridge Photo
→ AI Analysis
→ Meal Result

Hooks:

- I only had 3 ingredients...
- AI planned my meals for a week...
- Can AI build a high-protein dinner?

---

# 13. Product Hunt Launch

Requirements:

- Landing page
- Demo video
- Founder story
- Screenshots

Goal:
500+ visitors on launch day

---

# 14. Landing Page Wireframe

Section 1:
Hero

Section 2:
How It Works

Section 3:
Benefits

Section 4:
Recipe Examples

Section 5:
Testimonials

Section 6:
Pricing

Section 7:
FAQ

CTA throughout page

---

# 15. Success Targets

Month 1
100 users

Month 3
1000 users

Month 6
5000 users

Month 12
10000+ users

Target MRR:
$5,000 - $10,000

---

# Founder Note

Do not market PantryPilot as a recipe generator.

Market PantryPilot as:

"An AI Nutrition Coach that helps people lose weight, build muscle, and reduce food waste using ingredients they already own."
